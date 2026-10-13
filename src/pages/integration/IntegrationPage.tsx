import { useMemo, useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { useCctvLoadState } from "../../data/cctvLive"
import { IS_STAGING } from "../../data/appMode"
import { buildChecks, ISSUE_TYPES, NEXT_ISSUE, type Check, type Issue, type IssueStatus, type IssueType } from "../../data/integrationLogic"
import { checkIssue, clearIssues, moveIssue, reportIssue, useIssues } from "../../data/integrationLog"
import { usePilotBatch } from "../../data/pilotBatch/usePilotBatch"
import { useCommonEvents } from "../../data/useCommonEvents"
import { useSidePanelEvents } from "../../data/useSidePanelEvents"
import type { RiskLevel } from "../../types/domain"

const STATUS_LEVEL: Record<IssueStatus, RiskLevel> = { 접수: "alert", "수정 중": "warning", 재검증: "caution", 완료: "safe" }
const sel = "rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
const txt = "min-w-0 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
const btn = "h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
const at = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })

/** 스테이징 전용 — 처리 이력이 하나도 없을 때 화면 구성을 보이는 완료된 샘플 한 건(읽기 전용) */
const SAMPLE_ISSUE: Issue = {
  id: "E-SAMPLE-1",
  checkId: "recv:재난문자",
  system: "재난문자(행정안전부)",
  type: "수신 실패",
  detail: "재난문자 스냅샷 파일을 받지 못함",
  status: "완료",
  createdAt: new Date(2026, 9, 12, 9, 10).toISOString(),
  events: [
    { at: new Date(2026, 9, 12, 9, 10).toISOString(), status: "접수", by: "이운영(시스템·운영업체 담당자)" },
    { at: new Date(2026, 9, 12, 9, 40).toISOString(), status: "수정 중", by: "이운영(시스템·운영업체 담당자)", note: "스냅샷 갱신 스크립트 재실행" },
    { at: new Date(2026, 9, 12, 10, 5).toISOString(), status: "재검증", by: "이운영(시스템·운영업체 담당자)" },
    { at: new Date(2026, 9, 12, 10, 6).toISOString(), status: "완료", by: "이운영(시스템·운영업체 담당자)" },
  ],
  lastCheck: { at: new Date(2026, 9, 12, 10, 6).toISOString(), ok: true, text: "정상 수신" },
}

/**
 * 운영 > 연계 오류·검증 — 요구사항 '원본·표출 데이터 일치성 검증'·'연계 오류 대응'.
 * 위: 지금 받은 데이터를 자동 점검한 표(수신 여부·원본 값과 화면 판정 대조·ID 중복). 아래: 오류를 유형별로 접수해
 * 접수 → 수정 중 → 재검증 → 완료로 처리하는 이력(완료는 같은 점검이 정상일 때만). 이력은 이 브라우저에만 저장된다.
 */
export function IntegrationPage() {
  const sp = useSidePanelEvents()
  const cctv = useCctvLoadState()
  const pilot = usePilotBatch()
  const { events } = useCommonEvents()
  const issues = useIssues()
  const [checkedAt, setCheckedAt] = useState(() => new Date())

  const checks = useMemo(
    () => buildChecks({ nullSources: sp.nullSources, sourcesLoaded: sp.mode !== "loading", cctv, batch: pilot?.batch ?? null, eventIds: events.map((e) => e.id) }),
    [sp.nullSources, sp.mode, cctv, pilot, events],
    // checkedAt은 표시용 — 점검 자체는 받은 값이 바뀔 때마다 다시 계산된다
  )
  const bad = checks.filter((c) => !c.ok)
  const openByCheck = new Set(issues.filter((i) => i.status !== "완료" && i.checkId).map((i) => i.checkId))
  const shown = issues.length === 0 && IS_STAGING ? [SAMPLE_ISSUE] : issues

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">연계 오류·검증</h1>
        <p className="mt-1 text-sm text-white/50">받은 데이터가 화면에 맞게 표출되는지 점검하고, 연동 오류를 접수부터 재검증까지 처리합니다 — 이력은 이 브라우저에만 저장됩니다.</p>
      </div>

      <Card
        title="원본 ↔ 표출 일치성 검증"
        subtitle={`${checks.length}개 점검 · 이상 ${bad.length}건 · ${at(checkedAt.toISOString())} 기준`}
        action={
          <button type="button" className={btn} onClick={() => setCheckedAt(new Date())}>
            다시 검증
          </button>
        }
      >
        {pilot === null && <p className="mb-2 rounded-lg bg-inset px-3 py-2 text-xs text-white/50">실증사 자료가 연계되지 않아 원본 값 대조 점검은 없습니다 — 데이터 없음</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs text-white/35">
                <th className="pb-2 font-medium">점검</th>
                <th className="pb-2 font-medium">원본</th>
                <th className="pb-2 font-medium">표출</th>
                <th className="pb-2 font-medium">결과</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {checks.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="py-2 pr-3 text-white/80">
                    {c.label}
                    <span className="block text-xs text-white/35">{c.system}</span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-white/55">{c.raw ?? "-"}</td>
                  <td className="py-2 pr-3 text-xs text-white/55">{c.shown ?? "-"}</td>
                  <td className="py-2 pr-3 text-xs">
                    <span className={c.ok ? "font-bold text-accent" : "font-bold text-risk-danger"}>{c.ok ? "✓ 정상" : `✗ ${c.type}`}</span>
                    <span className="block text-white/40">{c.detail}</span>
                  </td>
                  <td className="py-2 text-right">
                    {!c.ok && (
                      <button type="button" className={btn} disabled={openByCheck.has(c.id)} onClick={() => reportIssue({ checkId: c.id, system: c.system, type: c.type, detail: `${c.label}: ${c.detail}` })}>
                        {openByCheck.has(c.id) ? "접수됨" : "오류 접수"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-white/30">
                    데이터를 받는 중입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="연계 오류 처리 이력"
        subtitle="유형별로 분류하고 접수 → 수정 중 → 재검증 → 완료로 처리합니다"
        action={
          issues.length > 0 ? (
            <button type="button" className={btn} onClick={() => window.confirm("이 브라우저에 저장된 연계 오류 이력을 모두 지웁니다.") && clearIssues()}>
              이력 비우기
            </button>
          ) : undefined
        }
      >
        <ManualForm />
        <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
          {shown.map((i) => (
            <IssueRow key={i.id} issue={i} checks={checks} readOnly={i === SAMPLE_ISSUE} />
          ))}
          {shown.length === 0 && <li className="py-6 text-center text-sm text-white/30">접수된 연계 오류가 없습니다.</li>}
        </ul>
      </Card>
    </div>
  )
}

function ManualForm() {
  const [system, setSystem] = useState("")
  const [type, setType] = useState<IssueType>("수신 실패")
  const [detail, setDetail] = useState("")
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!system.trim() || !detail.trim()) return
        reportIssue({ system: system.trim(), type, detail: detail.trim() })
        setSystem("")
        setDetail("")
      }}
    >
      <span className="text-xs font-bold text-white/50">직접 접수</span>
      <input className={`${txt} w-44`} value={system} onChange={(e) => setSystem(e.target.value)} placeholder="연계 시스템" aria-label="연계 시스템" />
      <select className={sel} value={type} onChange={(e) => setType(e.target.value as IssueType)} aria-label="오류 유형">
        {ISSUE_TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <input className={`${txt} flex-1`} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="오류 내용 (예: 기능점검에서 응답 지연 확인)" aria-label="오류 내용" />
      <button type="submit" className={btn} disabled={!system.trim() || !detail.trim()}>
        접수
      </button>
    </form>
  )
}

function IssueRow({ issue: i, checks, readOnly }: { issue: Issue; checks: Check[]; readOnly: boolean }) {
  const [note, setNote] = useState("")
  const linked = i.checkId ? checks.find((c) => c.id === i.checkId) : undefined
  const rerun = () => {
    // 같은 점검을 다시 돌린 결과 — 점검 목록에 이 항목이 없으면(받는 중이거나 더는 대상이 아님) 정상으로 보지 않고 사람이 확인하게 한다
    if (!linked) return
    checkIssue(i.id, { ok: linked.ok, text: linked.detail })
  }
  return (
    <li className="flex flex-col gap-2 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={STATUS_LEVEL[i.status]} label={i.status} />
        <span className="rounded-full border border-white/20 px-2 text-[11px] text-white/60">{i.type}</span>
        <b className="text-white/85">{i.system}</b>
        {readOnly && <span className="rounded-full border border-white/20 px-2 text-[10px] text-white/50">샘플</span>}
        <span className="ml-auto text-xs text-white/35">{at(i.createdAt)} 접수</span>
      </div>
      <p className="text-white/65">{i.detail}</p>
      <p className="text-xs text-white/40">{i.events.map((e) => `${e.status} ${at(e.at)}${e.note ? `(${e.note})` : ""}`).join(" → ")}</p>
      {i.lastCheck && <p className={`text-xs font-bold ${i.lastCheck.ok ? "text-accent" : "text-risk-danger"}`}>재검증 {i.lastCheck.ok ? "정상" : "이상"} — {i.lastCheck.text}</p>}
      {!readOnly && NEXT_ISSUE[i.status].length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {i.status !== "재검증" && <input className={`${txt} w-64`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="처리 내용 메모(선택)" aria-label="처리 내용 메모" />}
          {i.status === "재검증" &&
            (linked ? (
              <button type="button" className={btn} onClick={rerun}>
                같은 점검 다시 실행
              </button>
            ) : (
              <>
                <button type="button" className={btn} onClick={() => checkIssue(i.id, { ok: true, text: "동일 시나리오 재현 결과 정상(사람 확인)" })}>
                  재검증 정상
                </button>
                <button type="button" className={btn} onClick={() => checkIssue(i.id, { ok: false, text: "동일 시나리오 재현 결과 이상(사람 확인)" })}>
                  재검증 이상
                </button>
              </>
            ))}
          {NEXT_ISSUE[i.status].map((to) => (
            <button
              key={to}
              type="button"
              className={btn}
              disabled={to === "완료" && !i.lastCheck?.ok}
              title={to === "완료" && !i.lastCheck?.ok ? "재검증이 정상이어야 완료할 수 있습니다" : undefined}
              onClick={() => {
                moveIssue(i.id, to, note)
                setNote("")
              }}
            >
              {to === "수정 중" && i.status === "재검증" ? "수정 중으로 되돌리기" : `${to}${to === "완료" ? " 처리" : "으로"}`}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
