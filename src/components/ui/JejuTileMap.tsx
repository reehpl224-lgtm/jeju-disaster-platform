import "leaflet/dist/leaflet.css"
import { useEffect, useState } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet"
import type { CctvCamera, RiskLevel, RiskMarker } from "../../types/domain"
import { riskStyles } from "./riskStyles"
import { TOOLBOX_PANELS, type ToolboxChipItem } from "./mapToolboxData"

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

type MapMode = "general" | "weather" | "weatherModel" | "riskLevel" | "cctv" | "aerial"

const MODE_BUTTONS: { key: MapMode; label: string }[] = [
  { key: "general", label: "일반지도" },
  { key: "weather", label: "기상/재난" },
  { key: "weatherModel", label: "기상모델" },
  { key: "riskLevel", label: "재난위험도" },
  { key: "cctv", label: "CCTV/센서" },
  { key: "aerial", label: "항공지도" },
]

/** 참고 플랫폼(demo-10.muhanit.kr) GIS 화면의 상단 토글 행 — 각 모드 버튼이 레이어 선택 패널(mapToolboxData.ts)도 함께 연다 */
const MODE_TO_PANEL: Partial<Record<MapMode, string>> = {
  weather: "weather",
  weatherModel: "model",
  riskLevel: "flood-risk",
  cctv: "cctv",
}

function initialToolboxChecked() {
  const state: Record<string, boolean> = {}
  for (const panel of TOOLBOX_PANELS) {
    for (const section of panel.sections) {
      if (section.headingChecked !== undefined) {
        state[`heading:${panel.id}:${section.id}`] = section.headingChecked
      }
      for (const item of section.items) {
        state[item.id] = item.defaultChecked
      }
    }
  }
  return state
}

const CHIP_ACTIVE_CLASS: Record<ToolboxChipItem["activeColor"], string> = {
  blue: "border-risk-info bg-risk-info text-white",
  green: "border-accent bg-accent text-black",
}

// 실제 서로 다른 타일/오버레이 데이터가 없는 모드(기상/재난·기상모델)는 재난위험도와 동일한 화면을 보여준다 —
// 자세한 내용은 이 컴포넌트를 쓰는 화면의 안내 참고.
const AERIAL_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
const STREET_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

const REGIONS: { key: string; label: string; center: [number, number]; zoom: number }[] = [
  { key: "all", label: "전체", center: JEJU_CENTER, zoom: 11 },
  { key: "jeju-si", label: "제주시", center: [33.51, 126.53], zoom: 12 },
  { key: "seogwipo-si", label: "서귀포시", center: [33.25, 126.56], zoom: 12 },
]

function FlyToRegion({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom])
  return null
}

/**
 * 무료 타일 지도(OpenStreetMap 표준 타일 + Esri 위성 타일, 둘 다 API 키 불필요) 기반 GIS 지도.
 * lat/lng이 없는 마커는 표시되지 않는다 — 실좌표가 있는 마커만 대상.
 */
export function JejuTileMap({
  markers,
  cctvMarkers,
  className,
}: {
  markers: RiskMarker[]
  cctvMarkers?: CctvCamera[]
  className?: string
}) {
  const [mode, setMode] = useState<MapMode>("general")
  const [regionKey, setRegionKey] = useState("all")
  const [activePanelId, setActivePanelId] = useState<string | null>(null)
  const [toolboxChecked, setToolboxChecked] = useState<Record<string, boolean>>(initialToolboxChecked)
  const region = REGIONS.find((r) => r.key === regionKey) ?? REGIONS[0]
  const activePanel = TOOLBOX_PANELS.find((p) => p.id === activePanelId)

  const geoMarkers = markers.filter((m): m is RiskMarker & { lat: number; lng: number } => m.lat != null && m.lng != null)
  const geoCctv = (cctvMarkers ?? []).filter((c): c is CctvCamera & { lat: number; lng: number } => c.lat != null && c.lng != null)

  function toggleToolboxItem(id: string) {
    setToolboxChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleModeClick(key: MapMode) {
    setMode(key)
    const panelId = MODE_TO_PANEL[key]
    setActivePanelId((prev) => (panelId ? (prev === panelId ? null : panelId) : null))
  }

  function handleAgencyClick() {
    setActivePanelId((prev) => (prev === "agency" ? null : "agency"))
  }

  return (
    // isolate: Leaflet의 내부 팬/컨트롤 z-index(최대 1000)가 새 스태킹 컨텍스트에 갇히도록 격리 —
    // 격리가 없으면 GisIconRail/GisSidePanel/GisTimelinePanel(z-10, 이 지도 바깥의 형제 요소)이
    // Leaflet 마커·팝업·줌 컨트롤에 가려지는 문제가 있었음(2026-09-09 SVG→Leaflet 전환 이후 발견).
    <div className={`isolate ${className ?? "relative h-72 w-full sm:h-80"}`}>
      <MapContainer
        center={JEJU_CENTER}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "var(--color-inset)" }}
      >
        <FlyToRegion center={region.center} zoom={region.zoom} />
        {/* 기본 줌 컨트롤(top-left)은 GisIconRail과 겹쳐서 비어있는 좌하단으로 이동 */}
        <ZoomControl position="bottomleft" />
        <TileLayer
          key={mode === "aerial" ? "aerial" : "street"}
          attribution={
            mode === "aerial"
              ? "&copy; Esri, Maxar, Earthstar Geographics"
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={mode === "aerial" ? AERIAL_URL : STREET_URL}
          subdomains="abc"
          maxZoom={19}
        />

        {mode === "cctv"
          ? geoCctv.map((cam) => (
              <CircleMarker
                key={cam.id}
                center={[cam.lat, cam.lng]}
                radius={6}
                pathOptions={{
                  color: cam.status === "online" ? "var(--color-risk-safe)" : "var(--color-risk-offline)",
                  fillColor: cam.status === "online" ? "var(--color-risk-safe)" : "var(--color-risk-offline)",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-40 text-xs">
                    <p className="font-semibold text-white/90">{cam.name}</p>
                    <p className="mt-0.5 text-white/50">
                      {cam.operator} · {cam.status === "online" ? "온라인" : "오프라인"}
                    </p>
                    <p className="mt-1 text-white/40">{cam.address}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          : geoMarkers.map((marker) => {
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

      <div className="absolute right-2 top-12 z-[500] flex max-w-[calc(100%-16px)] flex-wrap items-center justify-end gap-1.5 rounded-lg border border-border-subtle bg-panel/95 p-1.5 shadow-panel">
          <select
            value="jeju"
            disabled
            className="rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/50"
          >
            <option value="jeju">제주특별자치도</option>
          </select>
          <select
            value={regionKey}
            onChange={(e) => setRegionKey(e.target.value)}
            className="rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/70"
          >
            {REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex gap-0.5">
            {MODE_BUTTONS.map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => handleModeClick(btn.key)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  mode === btn.key ? "bg-accent text-black" : "text-white/50 hover:bg-inset"
                }`}
              >
                {btn.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAgencyClick}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                activePanelId === "agency" ? "bg-accent text-black" : "text-white/50 hover:bg-inset"
              }`}
            >
              유관기관
            </button>
          </div>
        </div>

        {activePanel && (
          // right-2 앵커는 GisTimelinePanel(우측 하단, w-72)과 겹쳐서 좌측(GisIconRail 옆)에 독립 배치.
          // 좁은 컨테이너에서도 화면 밖으로 안 나가도록 right 기반 고정폭 오프셋 대신 left 기반으로 앵커.
          <div className="absolute left-[72px] top-12 z-[500] max-h-72 w-64 overflow-y-auto rounded-lg border border-border-subtle bg-panel p-3 shadow-panel">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <p className="text-sm font-bold text-white/90">{activePanel.panelTitle}</p>
              <button
                type="button"
                onClick={() => setActivePanelId(null)}
                className="text-white/40 hover:text-white"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-3">
              {activePanel.sections.map((section) => (
                <div key={section.id}>
                  {section.heading && (
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                      {section.headingChecked !== undefined && (
                        <input
                          type="checkbox"
                          checked={toolboxChecked[`heading:${activePanel.id}:${section.id}`] ?? false}
                          onChange={() => toggleToolboxItem(`heading:${activePanel.id}:${section.id}`)}
                          className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                        />
                      )}
                      {section.heading}
                    </label>
                  )}

                  {section.kind === "chip" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {section.items.map((item) => {
                        const chip = item as ToolboxChipItem
                        const active = toolboxChecked[item.id]
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleToolboxItem(item.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                              active ? CHIP_ACTIVE_CLASS[chip.activeColor] : "border-border-subtle text-white/40 hover:bg-inset"
                            }`}
                          >
                            {active ? "✓" : "✕"} {item.label}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {section.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-white/70 hover:bg-inset"
                        >
                          <input
                            type="checkbox"
                            checked={toolboxChecked[item.id] ?? false}
                            onChange={() => toggleToolboxItem(item.id)}
                            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}
