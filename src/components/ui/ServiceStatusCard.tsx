import { Link } from "react-router-dom"
import type { serviceStatusCards } from "../../data/mockDashboard"

export function ServiceStatusCard({ card }: { card: (typeof serviceStatusCards)[number] }) {
  return (
    <Link
      to={card.href}
      className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-panel p-4 transition hover:border-accent/60 hover:bg-inset"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-white/90">
        <span aria-hidden>{card.icon}</span>
        {card.title}
      </p>
      <dl className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-risk-warning">주의</dt>
          <dd className="font-semibold text-white/80">{card.counts.warning}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-risk-alert">경계</dt>
          <dd className="font-semibold text-white/80">{card.counts.alert}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-risk-danger">심각</dt>
          <dd className="font-semibold text-white/80">{card.counts.danger}</dd>
        </div>
      </dl>
    </Link>
  )
}
