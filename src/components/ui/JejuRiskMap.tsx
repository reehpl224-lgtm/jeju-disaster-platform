import type { RiskMarker } from "../../types/domain"
import { riskStyles } from "./riskStyles"

const DOMAIN_LABEL: Record<RiskMarker["domain"], string> = {
  river: "하천",
  coast: "연안",
  aqua: "양식장",
}

export function JejuRiskMap({ markers }: { markers: RiskMarker[] }) {
  return (
    <div className="relative h-72 w-full sm:h-80">
      <svg
        viewBox="0 0 320 300"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="img"
        aria-label="제주 전역 GIS 위험 지도"
      >
        {/* 간략화된 제주도 외곽선 (실제 좌표 아님 · 데모용) */}
        <path
          d="M40 150 C 42 110, 90 78, 150 74 C 190 71, 230 78, 262 100 C 288 118, 292 145, 280 168 C 270 188, 250 195, 236 178 C 224 200, 200 224, 168 236 C 140 246, 108 244, 84 226 C 58 208, 38 188, 40 150 Z"
          fill="var(--color-slate-100)"
          stroke="var(--color-slate-300)"
          strokeWidth="2"
        />
        {/* 한라산 표기 */}
        <circle cx="164" cy="152" r="4" fill="var(--color-slate-400)" />
        <text x="172" y="156" fontSize="9" fill="var(--color-slate-400)">
          한라산
        </text>

        {markers.map((marker) => {
          const style = riskStyles[marker.level]
          return (
            <g key={marker.id}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r="9"
                className={style.dot}
                fillOpacity="0.25"
              />
              <circle cx={marker.x} cy={marker.y} r="4.5" className={style.dot} />
              <text
                x={marker.x}
                y={marker.y - 12}
                fontSize="9"
                textAnchor="middle"
                fill="var(--color-slate-600)"
                fontWeight={600}
              >
                {marker.name}
              </text>
              <text
                x={marker.x}
                y={marker.y + 18}
                fontSize="8"
                textAnchor="middle"
                fill="var(--color-slate-400)"
              >
                {DOMAIN_LABEL[marker.domain]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
