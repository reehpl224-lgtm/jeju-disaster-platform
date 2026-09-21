import { useMemo } from "react"
import { JEJU_OUTLINE, type LngLat } from "../../data/jejuOutline"
import type { RiskMarker } from "../../types/domain"

const BOUNDS = { minLng: 126.14, maxLng: 126.98, minLat: 33.1, maxLat: 33.6 }
const K = Math.cos((33.4 * Math.PI) / 180) // 경도 축 보정(등장방형)
const SCALE = 1000
const W = (BOUNDS.maxLng - BOUNDS.minLng) * K * SCALE
const H = (BOUNDS.maxLat - BOUNDS.minLat) * SCALE

const project = ([lng, lat]: LngLat): [number, number] => [(lng - BOUNDS.minLng) * K * SCALE, (BOUNDS.maxLat - lat) * SCALE]
const ringPath = (ring: LngLat[]) => "M" + ring.map((p) => project(p).map((n) => n.toFixed(1)).join(",")).join("L") + "Z"

const LEVEL_COLOR: Record<string, string> = {
  danger: "var(--risk-danger)",
  alert: "var(--risk-alert)",
  warning: "var(--risk-warning)",
  caution: "var(--risk-caution)",
  safe: "var(--risk-safe)",
  info: "var(--risk-info)",
  offline: "var(--risk-offline)",
}

const REGION_LABEL: Record<"제주시" | "서귀포시", LngLat> = {
  제주시: [126.53, 33.46],
  서귀포시: [126.56, 33.3],
}

const inBounds = (m: RiskMarker) =>
  m.lat != null && m.lng != null && m.lng >= BOUNDS.minLng && m.lng <= BOUNDS.maxLng && m.lat >= BOUNDS.minLat && m.lat <= BOUNDS.maxLat

/** 제주도 행정구역 윤곽(제주시·서귀포시) 위에 위험 마커를 실제 위경도로 그리는 벡터 지도 */
export function JejuVectorMap({ markers }: { markers: RiskMarker[] }) {
  const paths = useMemo(
    () =>
      (Object.keys(JEJU_OUTLINE) as (keyof typeof JEJU_OUTLINE)[]).map((name) => ({
        name,
        d: JEJU_OUTLINE[name].map(ringPath).join(""),
      })),
    [],
  )
  const plotted = markers.filter(inBounds)
  const outside = markers.filter((m) => !inBounds(m))

  return (
    <div className="jvmap">
      <svg viewBox={`0 0 ${W.toFixed(0)} ${H.toFixed(0)}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="제주도 위험 마커 지도">
        {paths.map((p) => (
          <path key={p.name} d={p.d} className={`jvmap__region jvmap__region--${p.name === "제주시" ? "jeju" : "seogwipo"}`} />
        ))}
        {(Object.keys(REGION_LABEL) as (keyof typeof REGION_LABEL)[]).map((name) => {
          const [x, y] = project(REGION_LABEL[name])
          return (
            <text key={name} x={x} y={y} className="jvmap__label" textAnchor="middle">
              {name}
            </text>
          )
        })}
        {plotted.map((m) => {
          const [x, y] = project([m.lng as number, m.lat as number])
          const color = LEVEL_COLOR[m.level] ?? LEVEL_COLOR.offline
          return (
            <g key={m.id} className="jvmap__mk">
              <circle cx={x} cy={y} r={16} fill={color} opacity={0.28} />
              <circle cx={x} cy={y} r={7} fill={color} stroke="#111" strokeWidth={2} />
              <text x={x + 12} y={y - 10}>
                {m.name}
              </text>
              <title>{`${m.name} · ${m.level}`}</title>
            </g>
          )
        })}
      </svg>
      {outside.length > 0 && (
        <div className="jvmap__out">
          <b>지도 범위 밖 (해상)</b>
          <ul>
            {outside.map((m) => (
              <li key={m.id}>
                <span className="dot" style={{ background: LEVEL_COLOR[m.level] }} />
                {m.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
