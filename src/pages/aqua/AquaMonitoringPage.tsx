import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaAgencyRows, aquaMonitoringEvents, aquaMonitoringState } from "../../data/mockAqua"

export function AquaMonitoringPage() {
  const cards = Object.values(aquaMonitoringState)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">실시간 모니터링</h1>
          <p className="mt-1 text-sm text-white/50">하천·연안·양식장 통합 실시간 위험 감시</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/aqua/response"
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
          >
            e-SOP 대응 절차로 이동 →
          </Link>
          <Link
            to="/aqua/closure"
            className="rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            상황 종료 처리
          </Link>
        </div>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-xs font-medium text-white/40">{card.label}</p>
            <p className="mt-1 text-sm font-semibold text-white/85">{card.value}</p>
            <div className="mt-2">
              <RiskBadge level={card.level} label={card.tag} solid />
            </div>
          </Card>
        ))}
      </div>

      <Card title="GIS 위험 위치 및 영향 범위 지도">
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          하천 범람 경계 · 연안 위험구역 · 양식장 영향권 · 출동 대기 위치 표시 (2단계 상세 구현 예정)
        </div>
      </Card>

      <Card title="기관별 대응 상태">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {aquaAgencyRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border-subtle p-3 text-center">
              <p className="text-xs font-medium text-white/60">{row.agency}</p>
              <p className="mt-1 text-sm font-bold text-accent">{row.execute}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="최근 감지 이벤트 및 조치 이력">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaMonitoringEvents.map((event) => (
            <li key={event.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{event.time}</span>
              <p className="text-white/70">{event.title}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
