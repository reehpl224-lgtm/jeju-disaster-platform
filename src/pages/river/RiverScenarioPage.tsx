import { useRef, useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { riverResources } from "../../data/mockRiverResources"
import { useRiverRun } from "../../data/riverRunHooks"
import {
  advance,
  approveResourceRequest,
  cancelResourceRequest,
  confirmClosure,
  forceCloseRun,
  loadTimeline,
  returnResourceRequest,
  requestResource,
  togglePlaying,
} from "../../data/riverRunState"
import { parseRiverTimelineWorkbook } from "../../data/riverTimelineWorkbook"
import type { RiverTimelinePoint } from "../../types/riverRun"

export function RiverScenarioPage() {
  const run = useRiverRun()
  const ref = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<RiverTimelinePoint[] | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [closureError, setClosureError] = useState("")

  async function onFile(file?: File) {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      setPending(await parseRiverTimelineWorkbook(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽지 못했습니다.")
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ""
    }
  }

  function startRun() {
    if (pending) {
      loadTimeline(pending)
      setPending(null)
    }
  }

  function onConfirmClosure() {
    const r = confirmClosure()
    setClosureError(r.ok ? "" : (r.reason ?? ""))
  }

  const started = run.timeline.length > 0
  const point = run.timeline[run.playheadIndex]
  const atEnd = run.playheadIndex >= run.timeline.length - 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">하천 시나리오 실행</h1>
        <p className="mt-1 text-sm text-white/50">시간별 계획홍수량비율(%) 엑셀을 올려 위험등급 변화·승인·가상 자원 배치를 시험합니다(효돈천 파일럿).</p>
      </div>

      <Card title="① 시계열 엑셀 업로드" subtitle="/dummy-data의 수집상태 엑셀과는 다른 별도 파일입니다" dummy>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold"
            href={`${import.meta.env.BASE_URL}하천_시나리오_시간별입력_템플릿.xlsx`}
            download
          >
            엑셀 템플릿 다운로드
          </a>
          <input ref={ref} className="hidden" type="file" accept=".xlsx" onChange={(e) => onFile(e.target.files?.[0])} />
          <button className="rounded bg-accent px-4 py-2 text-sm font-bold text-black" onClick={() => ref.current?.click()}>
            {busy ? "검증 중..." : "작성한 엑셀 업로드"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {pending && (
          <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3">
            <p className="text-sm text-white/80">검증 완료 — {pending.length}개 시점. 시작하면 새 실행(새 runId)으로 이전 실행을 대체합니다.</p>
            <button className="mt-2 rounded bg-accent px-4 py-2 text-sm font-bold text-black" onClick={startRun}>
              이 시나리오로 시작
            </button>
          </div>
        )}
      </Card>

      {!started ? (
        <Card dummy title="진행 중인 시나리오 없음">
          <p className="py-8 text-center text-sm text-white/45">엑셀을 업로드하고 시작하면 여기서 시점을 진행할 수 있습니다.</p>
        </Card>
      ) : (
        <>
          <Card title="② 재생 제어" subtitle={`실행 ID ${run.runId}`} dummy>
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge level={run.endedAtSim ? "safe" : "info"} label={run.endedAtSim ? `종료(${run.endReason})` : `시점 ${run.playheadIndex + 1}/${run.timeline.length}`} solid />
              <span className="text-sm text-white/70">{point ? `${point.observedAt} · ${point.location} ${point.flowRatioPercent}%` : "아직 시작 전"}</span>
              <div className="ml-auto flex gap-2">
                <button
                  className="rounded border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-30"
                  onClick={() => togglePlaying()}
                  disabled={!!run.endedAtSim}
                >
                  {run.playing ? "일시정지" : "자동 재생"}
                </button>
                <button
                  className="rounded bg-accent px-4 py-2 text-xs font-bold text-black disabled:opacity-30"
                  onClick={() => advance()}
                  disabled={atEnd || !!run.endedAtSim}
                >
                  다음 시점 →
                </button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["돈내코", "쇠소깍"] as const).map((loc) => {
              const p = run.pointState[loc]
              const pd = run.pendingDown[loc]
              return (
                <Card key={loc} title={loc} dummy>
                  <RiskBadge level={p?.level ?? "safe"} label={p ? `${p.level}` : "관측 없음"} solid />
                  <p className="mt-2 text-xs text-white/40">{p ? `${p.sinceSim}부터 유지` : "-"}</p>
                  {pd && <p className="mt-1 text-xs text-risk-caution">하향 대기 중 → {pd.level}({pd.sinceSim}부터, 30분 유지 필요)</p>}
                </Card>
              )
            })}
          </div>

          <Card title="③ 가상 인력·장비 배치" subtitle="고정 세트 — 실제 기관 보유량이 아닙니다" dummy>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {riverResources.map((res) => {
                const active = run.resourceRequests.filter(
                  (r) => r.resourceId === res.id && (r.status === "요청" || r.status === "출동 중" || r.status === "도착" || r.status === "철수 중"),
                )
                const used = active.reduce((s, r) => s + r.qty, 0)
                return (
                  <div key={res.id} className="rounded-lg border border-border-subtle p-3">
                    <p className="text-sm font-semibold text-white/85">{res.label}</p>
                    <p className="mt-1 text-xs text-white/40">가용 {res.capacity - used} / 전체 {res.capacity}</p>
                    <button
                      className="mt-2 rounded border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-30"
                      disabled={!started || !!run.endedAtSim || used >= res.capacity}
                      onClick={() => requestResource(res.id, 1, `${res.id}-${Date.now()}-${Math.random()}`)}
                    >
                      1건 배치 요청
                    </button>
                  </div>
                )
              })}
            </div>

            {run.resourceRequests.length > 0 && (
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-white/35">
                    <th className="pb-2 font-medium">자원</th>
                    <th className="pb-2 font-medium">상태</th>
                    <th className="pb-2 font-medium">요청 시각</th>
                    <th className="pb-2 font-medium">조치</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {run.resourceRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 text-white/80">{riverResources.find((x) => x.id === r.resourceId)?.label ?? r.resourceId}</td>
                      <td className="py-2 text-white/60">{r.status}</td>
                      <td className="py-2 text-white/40">{r.requestedAtSim}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          {r.status === "요청" && (
                            <>
                              <button className="text-xs font-bold text-accent" onClick={() => approveResourceRequest(r.id)}>
                                승인
                              </button>
                              <button className="text-xs text-white/40" onClick={() => cancelResourceRequest(r.id)}>
                                취소
                              </button>
                            </>
                          )}
                          {r.status === "도착" && (
                            <button className="text-xs font-bold text-accent" onClick={() => returnResourceRequest(r.id)}>
                              복귀 처리
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="④ 종료 처리" dummy>
            {run.endedAtSim ? (
              <p className="text-sm text-white/70">{run.endedAtSim} · {run.endReason}로 종료되었습니다. 자세한 내용은 종료 보고 화면을 확인하세요.</p>
            ) : (
              <>
                <p className="text-sm text-white/70">
                  {run.closurePending ? "종료 조건(유지시간·조치 완료·자원 복귀)을 충족했습니다 — 종료를 확인하세요." : "정상 등급 유지·모든 조치 완료·자원 복귀가 확인되어야 종료할 수 있습니다."}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-30"
                    onClick={onConfirmClosure}
                    disabled={!run.closurePending}
                  >
                    정상 종료 확인
                  </button>
                  <button className="rounded border border-risk-danger/40 px-4 py-2 text-sm font-bold text-risk-danger hover:bg-risk-danger-bg" onClick={() => forceCloseRun()}>
                    예외 강제 종료
                  </button>
                </div>
                {closureError && <p className="mt-2 text-xs text-red-200">{closureError}</p>}
              </>
            )}
          </Card>

          <Card title="이력" dummy>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {run.history.length === 0 && <li className="py-3 text-sm text-white/35">이력 없음</li>}
              {run.history.map((h) => (
                <li key={h.id} className="flex gap-3 py-2.5 text-sm">
                  <span className="w-12 shrink-0 text-xs text-white/35">{h.simTime}</span>
                  <p className="text-white/70">{h.label}</p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
