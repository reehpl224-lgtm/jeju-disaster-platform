import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { StageTracker } from "../../components/aqua/StageTracker"
import { ChecklistRow } from "../../components/aqua/ChecklistRow"
import { aquaAgencyRows, aquaChecklist, aquaResponseState, aquaStages } from "../../data/mockAqua"

export function AquaResponsePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">e-SOP 대응 절차</h1>
          <p className="mt-1 text-sm text-white/50">{aquaResponseState.title}</p>
        </div>
        <Link
          to="/aqua/monitoring"
          className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
        >
          실시간 모니터링으로 이동 →
        </Link>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="현재 재난 상황">
          <RiskBadge level="danger" label={aquaResponseState.level} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="위험 등급" value={aquaResponseState.grade} />
            <Row label="발생 위치" value={aquaResponseState.location} />
            <Row label="감지 시각" value={aquaResponseState.detectedAt} />
            <Row label="예상 도달" value={aquaResponseState.eta} />
            <Row label="염분(현재)" value={aquaResponseState.salinity} />
            <Row label="수온(현재)" value={aquaResponseState.temperature} />
            <Row label="영향 반경" value={aquaResponseState.radius} />
          </dl>
        </Card>

        <Card title="진행 단계 요약" subtitle="현재 단계 진입 09:44 · 담당: 최경보 (재난대응1팀)">
          <StageTracker stages={aquaStages} />
        </Card>
      </div>

      <Card title="e-SOP 단계별 대응 절차" subtitle="2단계 — 주의 · 현재 진행 중">
        <div className="flex flex-col gap-2.5">
          {aquaChecklist.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              action={
                item.status === "미완료" ? (
                  <button type="button" className="rounded-full border border-accent px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent-soft">
                    미완료 재확인
                  </button>
                ) : item.status === "실패" ? (
                  <button type="button" className="rounded-full border border-risk-danger px-2.5 py-1 text-[11px] font-bold text-risk-danger hover:bg-risk-danger-bg">
                    발송 실패 확인
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="담당 기관별 상태">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-white/35">
                <th className="pb-2 font-medium">기관</th>
                <th className="pb-2 font-medium">역할</th>
                <th className="pb-2 font-medium">승인</th>
                <th className="pb-2 font-medium">수행</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {aquaAgencyRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-medium text-white/80">{row.agency}</td>
                  <td className="py-2 text-white/40">{row.role}</td>
                  <td className="py-2 text-white/60">{row.approve}</td>
                  <td className="py-2 text-white/60">{row.execute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="다음 단계 안내" subtitle="3단계(경계) 전환 조건">
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li>· 염분 27‰ 이하 지속 6시간 또는 실측 유입 확인 시 자동 상향</li>
            <li>· 현재 2단계 미완료 항목 2건 해소 후 3단계 전환 가능</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
      <dt className="text-white/40">{label}</dt>
      <dd className="font-medium text-white/80">{value}</dd>
    </div>
  )
}
