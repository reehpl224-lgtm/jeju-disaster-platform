import { Link } from "react-router-dom"
import type { KpiCard as KpiCardType } from "../../types/domain"
import { riskStyles } from "./riskStyles"

export function KpiCard({ card }: { card: KpiCardType }) {
  const style = riskStyles[card.level]
  return (
    <div className={`flex flex-col justify-between rounded-xl border ${style.border} bg-panel p-4`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/60">{card.title}</span>
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        </div>
        <p className={`mt-2 text-xl font-bold ${style.text}`}>{card.headline}</p>
        <p className="mt-1 text-xs text-white/35">{card.detail}</p>
      </div>
      <Link
        to={card.href}
        className="mt-4 inline-flex items-center justify-center rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent transition hover:bg-accent-soft"
      >
        {card.ctaLabel} →
      </Link>
    </div>
  )
}
