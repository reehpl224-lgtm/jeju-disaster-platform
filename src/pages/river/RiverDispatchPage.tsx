import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import { riverDispatchRequest } from "../../data/mockRiver"

export function RiverDispatchPage() {
  const d = riverDispatchRequest
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">출동 요청</h1>
        <p className="mt-1 text-sm text-white/50">{d.target}</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="출동 요청 개요">
          <RiskBadge level="alert" label={d.stage} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="대상 하천·구역" value={d.target} />
            <Row label="범람 예상 시각" value={d.eta} />
            <Row label="영향 범위" value={d.impact} />
            <Row label="요청 시각" value={d.requestedAt} />
            <Row label="요청 담당자" value={d.requester} />
          </dl>
        </Card>

        <Card title="위험 분석 요약">
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            {d.analysis.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="요청 경위">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {d.process.map((p) => (
            <li key={p.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{p.time}</span>
              <p className="text-white/70">{p.title}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="기관별 출동 요청 현황">
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
            <tr>
              <td className="py-2 text-white/70">제주소방서 북제주</td>
              <td className="py-2 text-white/40">14:05</td>
              <td className="py-2"><RiskBadge level="safe" label="확인" /></td>
              <td className="py-2 text-white/40">출동 완료</td>
              <td className="py-2 text-white/40">14:18</td>
            </tr>
            <tr>
              <td className="py-2 text-white/70">제주경찰서</td>
              <td className="py-2 text-white/40">14:05</td>
              <td className="py-2"><RiskBadge level="caution" label="대기 중" /></td>
              <td className="py-2 text-white/40">출동 준비</td>
              <td className="py-2 text-white/40">-</td>
            </tr>
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
