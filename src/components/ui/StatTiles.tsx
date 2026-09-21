import type { ReactNode } from "react"
import type { RiskLevel } from "../../types/domain"

export interface StatTile {
  label: string
  value: ReactNode
  /** 값 아래 보조 문구 */
  sub?: ReactNode
  /** 값 색 — 위험 등급 색을 쓸 때 */
  tone?: RiskLevel
}

/** demo-10 클론의 통계 타일(.stats / .stat) — 한 줄 박스 안에 라벨 + 큰 숫자를 가운데 정렬로 나란히 */
export function StatTiles({ items }: { items: StatTile[] }) {
  return (
    <div className="stats" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <p className="stat__label">{item.label}</p>
          <p className="stat__value" style={item.tone ? { color: `var(--risk-${item.tone})` } : undefined}>
            {item.value}
          </p>
          {item.sub && <p style={{ marginTop: 2, fontSize: 11, color: "var(--foreground-subtle)" }}>{item.sub}</p>}
        </div>
      ))}
    </div>
  )
}
