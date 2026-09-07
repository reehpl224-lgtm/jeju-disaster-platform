import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import { riverControlFailures, riverControlRows, riverControlTimeline, riverJointAgencies, riverPropagation } from "../../data/mockRiver"

export function RiverControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">현장 통제 관리</h1>
        <p className="mt-1 text-sm text-white/50">하천별 차단기·출동·통제 조치 현황</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card title="효돈천 구간별 통제 현황">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {riverControlRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border-subtle p-3">
              <p className="text-sm font-bold text-white/85">{row.river}</p>
              <p className="mt-1 text-xs font-semibold text-risk-warning">{row.stage}</p>
              <p className="mt-1 text-xs text-white/35">{row.location}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <RiskBadge level={row.gate === "정상 작동" ? "safe" : "danger"} label={`차단기 ${row.gate}`} />
                <RiskBadge level={row.dispatch === "완료" ? "safe" : "caution"} label={`출동 ${row.dispatch}`} />
                <RiskBadge level={row.ack === "확인" ? "safe" : "offline"} label={`수신 ${row.ack}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="실패 항목 및 대체 조치">
        <ul className="flex flex-col gap-3">
          {riverControlFailures.map((f) => (
            <li key={f.id} className="rounded-lg border border-risk-danger/40 bg-risk-danger-bg p-3">
              <p className="text-sm font-semibold text-risk-danger">{f.title}</p>
              <p className="mt-1 text-xs text-white/50">{f.time} 확인</p>
              <p className="mt-1 text-xs text-white/60">원인: {f.cause}</p>
              <p className="mt-1 text-xs font-medium text-white/70">{f.action}</p>
              <Link to="/river/dispatch" className="mt-2 inline-block text-xs font-bold text-accent">
                출동 요청 →
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="전파 이력 및 승인 근거">
          <ul className="flex flex-col gap-2">
            {riverPropagation.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-2.5 text-sm">
                <p className="text-white/80">{p.channel}</p>
                <span className="text-xs text-white/40">{p.status}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="공동 대응 기관 현황">
          <ul className="flex flex-col gap-2">
            {riverJointAgencies.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-2.5 text-sm">
                <p className="text-white/80">{a.agency}</p>
                <span className="text-xs text-white/40">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="단계별 타임라인">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {riverControlTimeline.map((t) => (
            <li key={t.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{t.time}</span>
              <p className="text-white/70">{t.title}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
