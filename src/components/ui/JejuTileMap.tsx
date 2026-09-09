import "leaflet/dist/leaflet.css"
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from "react-leaflet"
import type { RiskLevel, RiskMarker } from "../../types/domain"
import { riskStyles } from "./riskStyles"

const DOMAIN_LABEL: Record<RiskMarker["domain"], string> = {
  river: "하천",
  coast: "연안",
  aqua: "양식장",
  heavyRain: "호우",
  typhoon: "태풍",
  heat: "폭염",
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

const JEJU_CENTER: [number, number] = [33.38, 126.53]

/**
 * 무료 타일 지도(OpenStreetMap 데이터 + CARTO Dark Matter 베이스맵, API 키 불필요) 기반 GIS 지도.
 * lat/lng이 없는 마커는 표시되지 않는다 — 실좌표가 있는 마커만 대상.
 */
export function JejuTileMap({ markers, className }: { markers: RiskMarker[]; className?: string }) {
  const geoMarkers = markers.filter((m): m is RiskMarker & { lat: number; lng: number } => m.lat != null && m.lng != null)

  return (
    <div className={className ?? "relative h-72 w-full sm:h-80"}>
      <MapContainer
        center={JEJU_CENTER}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "var(--color-inset)" }}
      >
        {/* 기본 줌 컨트롤(top-left)은 GisIconRail과 겹쳐서 비어있는 좌하단으로 이동 */}
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={19}
        />
        {geoMarkers.map((marker) => {
          const color = MARKER_COLOR[marker.level]
          return (
            <CircleMarker
              key={marker.id}
              center={[marker.lat, marker.lng]}
              radius={7}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>
                <div className="min-w-40 text-xs">
                  <p className="font-semibold text-white/90">{marker.name}</p>
                  <p className="mt-0.5 text-white/50">
                    {DOMAIN_LABEL[marker.domain]} · {riskStyles[marker.level].label}
                  </p>
                  {marker.temperature && <p className="mt-1">수온 {marker.temperature}</p>}
                  {marker.salinity && <p>염분 {marker.salinity}</p>}
                  {marker.value && !marker.temperature && !marker.salinity && <p className="mt-1">{marker.value}</p>}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
