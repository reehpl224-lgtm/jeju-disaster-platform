import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { riverDispatchRequest } from "../../data/mockRiver"
import { riverResources } from "../../data/mockRiverResources"
import { useRiverRun } from "../../data/riverRunHooks"
import { approveDispatch } from "../../data/riverRunState"

export function RiverDispatchPage() {
  const d = riverDispatchRequest
  const run = useRiverRun()
  const canApprove = run.timeline.length > 0 && !run.endedAtSim && !run.flow.대응
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">출동 요청</h1>
          <p className="mt-1 text-sm text-white/50">{d.target}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/river/control"
            className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"
          >
            현장 통제로 이동 →
          </Link>
          <Link
            to="/river/closure"
            className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            상황 종료 처리
          </Link>
        </div>
      </div>

      {canApprove && (
        <Card title="담당자 승인 필요" subtitle="시나리오 실행 중 — 출동(대응) 단계를 승인합니다">
          <button className="rounded bg-accent px-4 py-2 text-sm font-bold text-black" onClick={() => approveDispatch()}>
            출동 요청 승인
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="출동 요청 개요" dummy>
          <RiskBadge level={d.level} label={d.stage} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="대상 하천·구역" value={d.target} />
            <Row label="범람 예상 시각" value={d.eta} />
            <Row label="영향 범위" value={d.impact} />
            <Row label="요청 시각" value={d.requestedAt} />
            <Row label="요청 담당자" value={d.requester} />
          </dl>
        </Card>

        <Card title="위험 분석 요약" dummy>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            {d.analysis.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="요청 경위" dummy>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {d.process.map((p) => (
            <li key={p.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{p.time}</span>
              <p className="text-white/70">{p.title}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="기관별 출동 요청 현황" dummy>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">기관명</th>
              <th className="pb-2 font-medium">요청 시각</th>
              <th className="pb-2 font-medium">수신 확인</th>
              <th className="pb-2 font-medium">출동 상태</th>
              <th className="pb-2 font-medium">도착 예정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {run.resourceRequests.length === 0 ? (
              <tr>
                <td className="py-3 text-center text-white/30" colSpan={5}>
                  출동 요청 이력 없음 — 평시 감시 중
                </td>
              </tr>
            ) : (
              run.resourceRequests
                .filter((r) => r.status !== "취소")
                .map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-white/70">{riverResources.find((x) => x.id === r.resourceId)?.label ?? r.resourceId}</td>
                    <td className="py-2 text-white/40">{r.requestedAtSim}</td>
                    <td className="py-2 text-white/40">{r.approvedAtSim ? "확인" : "대기"}</td>
                    <td className="py-2 text-white/40">{r.status}</td>
                    <td className="py-2 text-white/40">{r.arrivedAtSim ?? (r.status === "출동 중" ? "이동 중" : "-")}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle/60 pb-2">
      <dt className="shrink-0 text-white/40">{label}</dt>
      <dd className="text-right font-medium text-white/80">{value}</dd>
    </div>
  )
}
