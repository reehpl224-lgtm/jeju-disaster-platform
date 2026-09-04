import type { RiskLevel } from "../../types/domain"
import { riskStyles } from "./riskStyles"

interface RiskBadgeProps {
  level: RiskLevel
  label?: string
}

export function RiskBadge({ level, label }: RiskBadgeProps) {
  const style = riskStyles[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label ?? style.label}
    </span>
  )
}
