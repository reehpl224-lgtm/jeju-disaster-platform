import { Link } from "react-router-dom"
import type { RiskLevel } from "../../types/domain"
import type { serviceStatusCards } from "../../data/mockDashboard"
import { riskStyles } from "./riskStyles"

const TIERS: { level: RiskLevel; key: "danger" | "alert" | "warning" | "caution" }[] = [
  { level: "danger", key: "danger" },
  { level: "alert", key: "alert" },
  { level: "warning", key: "warning" },
  { level: "caution", key: "caution" },
]

// 위험색 글로우 — Tailwind는 동적으로 조합한 클래스명을 빌드 시점에 인식하지 못하므로
// 카드 테두리 발광 효과만 CSS 변수 참조 인라인 스타일로 처리한다 (border/text/dot 등은 riskStyles의 정적 문자열을 그대로 사용).
const GLOW_VAR: Record<RiskLevel, string | null> = {
  danger: "var(--color-risk-danger-bg)",
  alert: "var(--color-risk-alert-bg)",
  warning: "var(--color-risk-warning-bg)",
  caution: "var(--color-risk-caution-bg)",
  safe: null,
  info: "var(--color-risk-info-bg)",
  offline: null,
}

export function ServiceStatusCard({ card }: { card: (typeof serviceStatusCards)[number] }) {
  const counts = card.counts
  const total = counts.danger + counts.alert + counts.warning + (counts.caution ?? 0)
  const dominant = TIERS.find((t) => (counts[t.key] ?? 0) > 0)?.level ?? "safe"
  const dominantStyle = riskStyles[dominant]
  const glow = GLOW_VAR[dominant]

  return (
    <Link
      to={card.href}
      style={glow ? { boxShadow: `0 0 16px ${glow}` } : undefined}
      className={`group flex flex-col gap-3 rounded-xl border bg-panel p-4 transition hover:scale-[1.01] ${dominantStyle.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-white/90">
          <span aria-hidden>{card.icon}</span>
          {card.title}
        </p>
        {dominant !== "safe" && (
          <span className={`h-2 w-2 shrink-0 rounded-full ${riskStyles[dominant].dot}`} />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {total === 0 ? (
          <span className="text-xs text-white/30">이상 없음</span>
        ) : (
          TIERS.filter((t) => (counts[t.key] ?? 0) > 0).map((t) => (
            <div key={t.key} className="flex flex-col items-center gap-0.5">
              <span className={`text-lg font-bold leading-none tabular-nums ${riskStyles[t.level].text}`}>
                {counts[t.key]}
              </span>
              <span className="text-[10px] text-white/35">{riskStyles[t.level].label}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex h-1 w-full overflow-hidden rounded-full bg-inset">
        {TIERS.filter((t) => (counts[t.key] ?? 0) > 0).map((t) => (
          <div
            key={t.key}
            className={riskStyles[t.level].dot}
            style={{ width: `${((counts[t.key] ?? 0) / Math.max(total, 1)) * 100}%` }}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold text-accent group-hover:underline">자세히 보기 →</p>
    </Link>
  )
}
