import type { RiskLevel, RiskMarker } from "../../types/domain"

const DOMAIN_LABEL: Record<RiskMarker["domain"], string> = {
  river: "하천",
  coast: "연안",
  aqua: "양식장",
}

const MARKER_COLOR: Record<RiskLevel, string> = {
  danger: "var(--color-risk-danger)",
  alert: "var(--color-risk-alert)",
  warning: "var(--color-risk-warning)",
  caution: "var(--color-risk-caution)",
  safe: "var(--color-risk-safe)",
  info: "var(--color-risk-info)",
  offline: "var(--color-risk-offline)",
}

const CALLOUT_FILL: Record<RiskLevel, string> = {
  danger: "#3a1414",
  alert: "#3a1a14",
  warning: "#3a2414",
  caution: "#3a3414",
  safe: "#16321a",
  info: "#132a3a",
  offline: "#2a2a2a",
}

function hasAquaCallout(m: RiskMarker) {
  return m.domain === "aqua" && (m.value || m.temperature || m.salinity)
}

export function JejuRiskMap({ markers }: { markers: RiskMarker[] }) {
  const aquaMarkers = markers.filter(hasAquaCallout)
  const otherMarkers = markers.filter((m) => !hasAquaCallout(m))

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
          fill="var(--color-inset)"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeOpacity="0.6"
        />
        {/* 한라산 표기 */}
        <circle cx="164" cy="152" r="4" fill="white" fillOpacity="0.3" />
        <text x="172" y="156" fontSize="9" fill="white" fillOpacity="0.4">
          한라산
        </text>

        {otherMarkers.map((marker) => {
          const color = MARKER_COLOR[marker.level]
          return (
            <g key={marker.id}>
              <circle cx={marker.x} cy={marker.y} r="9" fill={color} fillOpacity="0.25" />
              <circle cx={marker.x} cy={marker.y} r="4.5" fill={color} />
              <text
                x={marker.x}
                y={marker.y - 12}
                fontSize="9"
                textAnchor="middle"
                fill="white"
                fillOpacity="0.85"
                fontWeight={600}
              >
                {marker.name}
              </text>
              <text x={marker.x} y={marker.y + 18} fontSize="8" textAnchor="middle" fill="white" fillOpacity="0.4">
                {DOMAIN_LABEL[marker.domain]}
              </text>
            </g>
          )
        })}

        {/* 양식장 수온·염분 콜아웃 — 제주특별자치도 해양수산연구원 '양식장 수온' 화면 참고 */}
        {aquaMarkers.map((marker) => {
          const color = MARKER_COLOR[marker.level]
          const hasReadings = Boolean(marker.temperature || marker.salinity)
          const boxW = 60
          const boxH = hasReadings ? 38 : 26
          const boxX = marker.x - boxW / 2
          const boxY = marker.y - (hasReadings ? 56 : 44)
          return (
            <g key={marker.id}>
              <line x1={marker.x} y1={marker.y} x2={marker.x} y2={boxY + boxH} stroke="white" strokeOpacity="0.3" strokeWidth="1" />
              <circle cx={marker.x} cy={marker.y} r="4" fill={color} />
              <rect
                x={boxX}
                y={boxY}
                width={boxW}
                height={boxH}
                rx="5"
                fill={CALLOUT_FILL[marker.level]}
                stroke={color}
                strokeWidth="1"
              />
              <text x={marker.x} y={boxY + 9} fontSize="7" textAnchor="middle" fill="white" fillOpacity="0.7">
                {marker.name}
              </text>
              {hasReadings ? (
                <>
                  {marker.temperature && (
                    <text x={marker.x} y={boxY + 21} fontSize="9.5" fontWeight={700} textAnchor="middle" fill={color}>
                      {marker.temperature}
                    </text>
                  )}
                  {marker.salinity && (
                    <text x={marker.x} y={boxY + 33} fontSize="9.5" fontWeight={700} textAnchor="middle" fill="#5fb8ff">
                      {marker.salinity}
                    </text>
                  )}
                </>
              ) : (
                <text
                  x={marker.x}
                  y={boxY + 21}
                  fontSize={marker.value === "점검중" ? 8 : 11}
                  fontWeight={700}
                  textAnchor="middle"
                  fill={color}
                >
                  {marker.value}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
