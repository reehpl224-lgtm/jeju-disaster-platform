import "leaflet/dist/leaflet.css"
import { latLngBounds } from "leaflet"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, WMSTileLayer, ZoomControl } from "react-leaflet"
import { cctvStatusLabel, openCctvPlayer } from "../../data/cctvLive"
import { IS_STAGING } from "../../data/appMode"
import { LEVEL_SAMPLE, levelStageOf, type LevelPoint } from "../../data/levelAlerts"
import { AGENCY_SAMPLE_POINTS } from "../../data/sampleAgencies"
import type { CctvCamera, RiskLevel, RiskMarker } from "../../types/domain"
import { placeTileLabels, type LabelSpot } from "./labelPlacement"
import { riskStyles } from "./riskStyles"
import { TOOLBOX_PANELS, type ToolboxChipItem } from "./mapToolboxData"

const DOMAIN_LABEL: Record<RiskMarker["domain"], string> = {
  river: "하천",
  coast: "연안",
  aqua: "해안관측",
  heavyRain: "호우",
  typhoon: "태풍",
  heat: "폭염",
  wildfire: "산불",
  tsunami: "지진해일",
  snow: "대설",
}

const MARKER_COLOR: Record<RiskLevel, string> = {
  danger: "#ff3b30",
  alert: "#f8390d",
  warning: "#f2731a",
  caution: "#f9cd00",
  safe: "#8ec21f",
  info: "#0054a3",
  offline: "#8a8d90",
}

const JEJU_CENTER: [number, number] = [33.38, 126.53]

type MapMode = "general" | "weather" | "weatherModel" | "riskLevel" | "cctv" | "aerial"

/** 센서 라디오 → 값을 주는 레거시 시스템 */
const SENSOR_RADIO_SYSTEM: Record<string, LevelPoint["system"]> = { "river-level-gauge": "ls-river-mon", "river-flood-sensor-center": "ls-flood-warn" }

const MODE_BUTTONS: { key: MapMode; label: string }[] = [
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

function initialRadioSel() {
  const state: Record<string, string | null> = {}
  for (const panel of TOOLBOX_PANELS) {
    if (!panel.sections.some((s) => s.kind === "radio")) continue
    state[panel.id] = null
    for (const section of panel.sections) {
      for (const item of section.items) if (section.kind === "radio" && item.defaultChecked) state[panel.id] = item.id
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
// 바탕 지도 — 요구사항 "GIS맵 - Vworld API"에 따라 브이월드(국토교통부) WMTS를 쓴다. 인증키(VITE_VWORLD_KEY)가 없으면 이전처럼 OSM·Esri로 대신한다.
// 브이월드 타일 주소는 {z}/{y}/{x} 순서이고 키가 주소에 들어가므로 브라우저에서 보이는 값이다 — 키는 브이월드에서 허용 도메인으로 제한한다.
const VWORLD_KEY = import.meta.env.VITE_VWORLD_KEY as string | undefined
const vworld = (layer: string, ext: "png" | "jpeg") => `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/${layer}/{z}/{y}/{x}.${ext}`
const BASE = VWORLD_KEY
  ? { street: vworld("midnight", "png"), aerial: vworld("Satellite", "jpeg"), labels: vworld("Hybrid", "png"), streetAttr: "&copy; VWorld", aerialAttr: "&copy; VWorld", maxNative: 18 }
  : {
      street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      aerial: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      labels: null,
      streetAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      aerialAttr: "&copy; Esri, Maxar, Earthstar Geographics",
      maxNative: 19,
    }

const REGIONS: { key: string; label: string; center: [number, number]; zoom: number }[] = [
  { key: "all", label: "전체", center: JEJU_CENTER, zoom: 11 },
  { key: "jeju-si", label: "제주시", center: [33.51, 126.53], zoom: 12 },
  { key: "seogwipo-si", label: "서귀포시", center: [33.25, 126.56], zoom: 12 },
]

/** 시 → 읍·면 선택(GIS 상황 구성예시의 세 번째 '선택' 드롭다운). 중심 좌표는 각 읍·면 소재지 부근의 근사값 */
const SUB_AREAS: Record<string, { key: string; label: string; center: [number, number] }[]> = {
  "jeju-si": [
    { key: "hallim", label: "한림읍", center: [33.414, 126.267] },
    { key: "aewol", label: "애월읍", center: [33.462, 126.331] },
    { key: "gujwa", label: "구좌읍", center: [33.514, 126.852] },
    { key: "jocheon", label: "조천읍", center: [33.536, 126.64] },
    { key: "hangyeong", label: "한경면", center: [33.339, 126.176] },
    { key: "chuja", label: "추자면", center: [33.955, 126.3] },
    { key: "udo", label: "우도면", center: [33.505, 126.953] },
  ],
  "seogwipo-si": [
    { key: "daejeong", label: "대정읍", center: [33.224, 126.253] },
    { key: "namwon", label: "남원읍", center: [33.279, 126.722] },
    { key: "seongsan", label: "성산읍", center: [33.387, 126.88] },
    { key: "andeok", label: "안덕면", center: [33.253, 126.335] },
    { key: "pyoseon", label: "표선면", center: [33.326, 126.834] },
  ],
}

/** 재난위험도 라디오 → 지도에 실제로 그릴 수 있는 위험 마커 분야(없으면 표기 기준 TBD 안내) */
const RISK_RADIO_DOMAIN: Record<string, RiskMarker["domain"]> = {
  "river-flood-risk": "river",
  "ai-river-flood": "river",
  "coast-safety-risk": "coast",
  "ai-coast-safety": "coast",
  "low-salinity-risk": "aqua",
  "high-temp-risk": "aqua",
  "ai-aqua": "aqua",
}

/**
 * 재난위험도 라디오 → 생활안전지도(행정안전부) WMS 레이어. 하천위험지도 = 하천범람지도(지방하천), 침수이력 = 침수흔적도.
 * 타일은 프록시(/api/safemap-wms)가 대신 받아 키가 브라우저에 보이지 않는다.
 */
const SAFEMAP_RADIO: Record<string, { layer: "river" | "trace"; name: string }> = {
  "river-hazard-map": { layer: "river", name: "하천범람지도(지방하천)" },
  "flood-history": { layer: "trace", name: "침수흔적도" },
}
const SAFEMAP_PROXY = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

/** CCTV 라디오 → 카메라 필터(도메인). 공공CCTV는 전체 */
const CCTV_RADIO_DOMAINS: Record<string, CctvCamera["domain"][] | "all"> = {
  "public-cctv": "all",
  "disaster-cctv": ["river", "aqua", "snow"],
  "coast-smart-cctv": ["coast"],
}

function FlyToRegion({ center, zoom, skipInitial }: { center: [number, number]; zoom: number; skipInitial?: boolean }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    // 마커 범위 맞춤(FitToMarkers)이 처음 화면을 잡는 경우, 첫 렌더의 flyTo가 그것을 덮어쓰지 않게 건너뜀
    if (first.current && skipInitial) {
      first.current = false
      return
    }
    first.current = false
    map.flyTo(center, zoom, { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom])
  return null
}

/** 마커 이름표 자리를 화면 좌표 기준으로 계산 — 줌/크기가 바뀔 때마다 다시 배치 */
function useLabelSpots(points: { id: string; name: string; lat: number; lng: number }[], enabled: boolean): Record<string, LabelSpot> {
  const map = useMap()
  const [spots, setSpots] = useState<Record<string, LabelSpot>>({})
  const key = points.map((p) => p.id).join("|")
  const compute = useCallback(() => {
    if (!enabled) return
    const size = map.getSize()
    setSpots(placeTileLabels(points.map((p) => ({ id: p.id, name: p.name, ...map.latLngToContainerPoint([p.lat, p.lng]) })), size.x, size.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, enabled, key])
  useEffect(() => {
    compute()
    map.on("zoomend resize", compute)
    return () => {
      map.off("zoomend resize", compute)
    }
  }, [map, compute])
  return spots
}

type GeoMarker = RiskMarker & { lat: number; lng: number }

/** 점이 이만큼 넘으면 이름표가 서로 겹치므로, 기본 위치 점만 이름을 고정해 두고 나머지(관측·특보·쉼터 점)는 마우스를 올릴 때 보여준다 */
const CROWDED_MARKERS = 24
const OUT_OF_RANGE_SHOWN = 6
const isDetailMarker = (id: string) => /^(fact|shelter|warn)-/.test(id)

function MarkerLayer({ markers }: { markers: GeoMarker[] }) {
  const crowded = markers.length > CROWDED_MARKERS
  const spots = useLabelSpots(crowded ? markers.filter((m) => !isDetailMarker(m.id)) : markers, true)
  return (
    <>
      {markers.map((marker) => {
        const color = MARKER_COLOR[marker.level]
        const spot = spots[marker.id] ?? { dir: "right" as const, offset: [6, -10] as [number, number] }
        const quiet = crowded && isDetailMarker(marker.id)
        return (
          <Fragment key={marker.id}>
            <CircleMarker center={[marker.lat, marker.lng]} radius={18} interactive={false} pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 0 }} />
            <CircleMarker center={[marker.lat, marker.lng]} radius={9} pathOptions={{ color: "#fff", fillColor: color, fillOpacity: 1, weight: 2.5 }}>
              <Tooltip key={spot.dir + spot.offset.join(",") + quiet} permanent={!quiet} direction={spot.dir} offset={spot.offset} className="jmk-label">
                {marker.name}
              </Tooltip>
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
          </Fragment>
        )
      })}
    </>
  )
}

/** 표시 중인 마커가 현재 화면 밖(해상 등)에 있으면 제주 전체와 마커가 모두 보이도록 화면을 맞춘다 */
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap()
  const key = points.map((p) => p.join(",")).join("|")
  useEffect(() => {
    if (points.length === 0) return
    // 첫 렌더 직후에는 컨테이너 크기가 아직 확정되지 않을 수 있어 잠시 뒤에 맞춘다
    const timer = window.setTimeout(() => {
      map.invalidateSize()
      const box = latLngBounds([33.1, 126.14], [33.6, 126.98])
      // 제주 안 마커가 하나라도 있으면 제주 기준으로 보고(해상 마커 때문에 섬이 작아지지 않게),
      // 제주 안 마커가 없는 분야(예: 태풍)일 때만 해당 마커까지 포함해 범위를 맞춘다
      const inJeju = points.filter((p) => box.contains(p))
      const target = inJeju.length > 0 ? inJeju : points
      const all = latLngBounds(target).extend(box.getSouthWest()).extend(box.getNorthEast())
      const view = map.getBounds()
      if (target.some((p) => !view.contains(p))) map.fitBounds(all, { padding: [40, 40], maxZoom: 11, animate: true })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
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
  showToolbar = true,
  toolbarAtBottom = false,
  fitMarkers = false,
  toolbarTop,
}: {
  markers: RiskMarker[]
  cctvMarkers?: CctvCamera[]
  className?: string
  /** false면 지도 위 모드/지역 툴바를 숨긴다(종합 상황판의 작은 지도용) */
  showToolbar?: boolean
  /** true면 툴바를 우하단에 둔다(GIS 상황판은 상단 중앙에 분야 칩이 있어서) */
  toolbarAtBottom?: boolean
  /** true면 화면 밖 마커가 있을 때 자동으로 범위를 맞춘다(GIS 상황판) */
  fitMarkers?: boolean
  /** 모드 툴바·지도범위밖 목록의 상단 여백(px) — 지도 위에 날씨/칩 등 다른 오버레이가 있을 때
   *  그 실측 높이를 넘겨 겹침을 막는다. 생략하면 toolbarAtBottom 값에 따라 고정 오프셋(92px/8px)을 쓴다 */
  toolbarTop?: number
}) {
  const [mode, setMode] = useState<MapMode>("general")
  const [regionKey, setRegionKey] = useState("all")
  const [subAreaKey, setSubAreaKey] = useState("")
  // 라디오 패널(재난위험도·CCTV/센서)은 패널당 하나만 선택 — 값은 항목 id
  const [radioSel, setRadioSel] = useState<Record<string, string | null>>(initialRadioSel)
  const [activePanelId, setActivePanelId] = useState<string | null>(null)
  const [toolboxChecked, setToolboxChecked] = useState<Record<string, boolean>>(initialToolboxChecked)
  const baseRegion = REGIONS.find((r) => r.key === regionKey) ?? REGIONS[0]
  const subArea = (SUB_AREAS[regionKey] ?? []).find((s) => s.key === subAreaKey)
  const region = subArea ? { ...baseRegion, center: subArea.center, zoom: 13 } : baseRegion
  const activePanel = TOOLBOX_PANELS.find((p) => p.id === activePanelId)

  const geoMarkers = markers.filter((m): m is RiskMarker & { lat: number; lng: number } => m.lat != null && m.lng != null)
  const outOfRange = geoMarkers.filter((m) => m.lat < 33.1 || m.lat > 33.6 || m.lng < 126.14 || m.lng > 126.98)
  const geoCctv = (cctvMarkers ?? []).filter((c): c is CctvCamera & { lat: number; lng: number } => c.lat != null && c.lng != null)

  const labelOf = (id: string | null | undefined) => {
    if (!id) return ""
    for (const p of TOOLBOX_PANELS) for (const s of p.sections) for (const i of s.items) if (i.id === id) return i.label
    return id
  }
  const riskSel = radioSel["flood-risk"]
  const riskDomain = riskSel ? RISK_RADIO_DOMAIN[riskSel] : undefined
  const safemap = mode === "riskLevel" && riskSel ? SAFEMAP_RADIO[riskSel] : undefined
  const shownMarkers = mode === "riskLevel" && riskDomain ? geoMarkers.filter((m) => m.domain === riskDomain) : geoMarkers
  const cctvSel = radioSel["cctv"]
  const cctvDomains = cctvSel ? CCTV_RADIO_DOMAINS[cctvSel] : undefined
  const shownCctv = !cctvDomains ? [] : cctvDomains === "all" ? geoCctv : geoCctv.filter((c) => cctvDomains.includes(c.domain))
  // 스테이징만: 센서 라디오(하천 수위계·침수정보센터)는 레거시 수위 연계 전이라 임의 샘플 지점을 그린다
  const sensorSystem = cctvSel ? SENSOR_RADIO_SYSTEM[cctvSel] : undefined
  const sensorPoints = IS_STAGING && mode === "cctv" && sensorSystem ? LEVEL_SAMPLE.filter((p) => p.system === sensorSystem) : []
  const agencyChecked = TOOLBOX_PANELS.find((p) => p.id === "agency")?.sections.flatMap((s) => s.items).filter((i) => toolboxChecked[i.id]) ?? []
  // 스테이징만: 유관기관 위치 자료 수령 전이라 샘플 위치를 그린다
  const agencyPoints = IS_STAGING && activePanelId === "agency" ? agencyChecked.flatMap((i) => (AGENCY_SAMPLE_POINTS[i.id] ?? []).map((p) => ({ ...p, kind: i.label }))) : []

  // 선택한 레이어를 지도에 그릴 수 있는지 안내 — 위치 데이터가 없는 항목은 '표기 기준 확정 전(TBD)'으로 표시
  let layerNotice: string | null = null
  if (activePanelId === "agency") {
    layerNotice = !agencyChecked.length
      ? null
      : IS_STAGING
        ? `유관기관 ${agencyChecked.length}종 선택 — 샘플 위치 ${agencyPoints.length}곳 표출 중(위치 자료 10월 중순 수령 예정)`
        : `유관기관 ${agencyChecked.length}종 선택 — 표기 기준 확정 전(TBD), 위치 데이터 준비 중`
  } else if (mode === "riskLevel" && riskSel) {
    layerNotice = safemap
      ? SAFEMAP_PROXY
        ? `${labelOf(riskSel)} — 생활안전지도(행정안전부) ${safemap.name} 표출 중`
        : `${labelOf(riskSel)} — 프록시 주소가 없어 ${safemap.name}를 불러올 수 없음`
      : riskDomain
        ? `${labelOf(riskSel)} — 위험 마커 ${shownMarkers.length}건 표출 중`
        : `${labelOf(riskSel)} — 표기 기준 확정 전(TBD)`
  } else if (mode === "cctv" && cctvSel) {
    layerNotice = cctvDomains
      ? `${labelOf(cctvSel)} — ${shownCctv.length}대 표출 중`
      : sensorPoints.length
        ? `${labelOf(cctvSel)} — 레거시 수위 샘플 ${sensorPoints.length}곳 표출 중(연계 전 임의 값, 10월 중순 수령 예정)`
        : `${labelOf(cctvSel)} — 표기 기준 확정 전(TBD)`
  }

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
        {mode !== "cctv" && <MarkerLayer markers={shownMarkers} />}
        {fitMarkers && <FitToMarkers points={geoMarkers.map((m) => [m.lat, m.lng])} />}
        <FlyToRegion center={region.center} zoom={region.zoom} skipInitial={fitMarkers} />
        {/* 기본 줌 컨트롤(top-left)은 GisIconRail과 겹쳐서 비어있는 좌하단으로 이동 */}
        <ZoomControl position="bottomleft" />
        <TileLayer
          key={mode === "aerial" ? "aerial" : "street"}
          attribution={mode === "aerial" ? BASE.aerialAttr : BASE.streetAttr}
          url={mode === "aerial" ? BASE.aerial : BASE.street}
          subdomains="abc"
          maxZoom={19}
          maxNativeZoom={BASE.maxNative}
        />
        {/* 항공지도 위에 도로·지명 글자(브이월드 Hybrid)를 얹는다 */}
        {mode === "aerial" && BASE.labels && <TileLayer key="aerial-labels" url={BASE.labels} maxZoom={19} maxNativeZoom={BASE.maxNative} />}

        {safemap && SAFEMAP_PROXY && (
          <WMSTileLayer
            key={safemap.layer}
            url={`${SAFEMAP_PROXY}/api/safemap-wms?layer=${safemap.layer}`}
            layers={safemap.layer}
            format="image/png"
            transparent
            opacity={0.8}
            attribution="&copy; 행정안전부 생활안전지도"
          />
        )}

        {agencyPoints.map((p) => (
          <CircleMarker key={`${p.kind}-${p.name}`} center={[p.lat, p.lng]} radius={7} pathOptions={{ color: "#0054a3", fillColor: "#3b8ee0", fillOpacity: 0.85, weight: 2 }}>
            <Tooltip direction="top" offset={[0, -6]}>
              {p.name} · {p.kind} (샘플)
            </Tooltip>
          </CircleMarker>
        ))}

        {sensorPoints.map((p) => {
          const stage = levelStageOf(p)
          const color = stage === "심각" ? "#e5484d" : stage === "경계" ? "#f08a24" : stage === "주의" ? "#e5c339" : stage === "관심" ? "#8ec21f" : "#3b8ee0"
          return (
            <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={7} pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}>
              <Tooltip direction="top" offset={[0, -6]}>
                {p.group} {p.place} · 수위 {p.levelM.toFixed(2)}m · {stage ?? "기준 미만"} (샘플)
              </Tooltip>
            </CircleMarker>
          )
        })}

        {mode === "cctv"
          ? shownCctv.map((cam) => (
              <CircleMarker
                key={cam.id}
                center={[cam.lat, cam.lng]}
                radius={6}
                pathOptions={{
                  color: cam.status === "online" ? "#8ec21f" : "#8a8d90",
                  fillColor: cam.status === "online" ? "#8ec21f" : "#8a8d90",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-40 text-xs">
                    <p className="font-semibold text-white/90">{cam.name}</p>
                    <p className="mt-0.5 text-white/50">
                      {cam.operator} · {cctvStatusLabel(cam)}
                    </p>
                    <p className="mt-1 text-white/40">{cam.address}</p>
                    {cam.streamUrl && (
                      <button type="button" onClick={() => openCctvPlayer(cam)} className="mt-2 rounded-full border border-accent px-3 py-1 text-[11px] font-bold text-accent hover:bg-accent-soft">
                        ▶ 영상 보기
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))
          : null}
      </MapContainer>

      {fitMarkers && mode !== "cctv" && outOfRange.length > 0 && (
        <div
          className={`absolute left-3 z-[500] rounded-lg border border-white/20 bg-[#1d1d1d]/95 px-3 py-2 text-[11px] text-white/70 shadow-panel ${
            toolbarTop == null ? "top-3" : ""
          }`}
          style={toolbarTop != null ? { top: toolbarTop } : undefined}
        >
          <p className="mb-1 font-bold text-white">지도 범위 밖 (해상)</p>
          <ul>
            {outOfRange.slice(0, OUT_OF_RANGE_SHOWN).map((m) => (
              <li key={m.id} className="flex items-center gap-1.5 leading-relaxed">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: MARKER_COLOR[m.level] }} />
                {m.name}
              </li>
            ))}
            {outOfRange.length > OUT_OF_RANGE_SHOWN && <li className="leading-relaxed text-white/50">외 {outOfRange.length - OUT_OF_RANGE_SHOWN}건</li>}
          </ul>
        </div>
      )}

      {/* GisTimelinePanel이 지도 위에 뜨는 오버레이가 아니라 지도 옆 전용 컬럼으로 옮겨져서(2026-09-09)
          더 이상 우측 하단과 겹칠 일이 없어 툴바를 top-2로 올리고, 팝업도 다시 우측에 둘 수 있음 */}
      {showToolbar && (
      <div
        className={`absolute right-2 z-[500] flex max-w-[calc(100%-16px)] flex-col items-end gap-1.5 ${
          toolbarTop == null ? (toolbarAtBottom ? "top-[92px]" : "top-2") : ""
        }`}
        style={toolbarTop != null ? { top: toolbarTop } : undefined}
      >
        {/* 선택창 줄과 모드 버튼 줄을 서로 다른 박스로 분리 — 참고 화면(demo-10)처럼 두 그룹이
            시각적으로 구분되게. 각 박스는 items-end 바깥 컨테이너 안에서 자기 내용 폭만큼만 차지한다 */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 rounded-lg border border-border-subtle bg-panel/95 p-1.5 shadow-panel">
          <select
            value="jeju"
            disabled
            className="rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/50"
          >
            <option value="jeju">제주특별자치도</option>
          </select>
          <select
            value={regionKey}
            onChange={(e) => {
              setRegionKey(e.target.value)
              setSubAreaKey("")
            }}
            className="rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/70"
          >
            {REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={subAreaKey}
            onChange={(e) => setSubAreaKey(e.target.value)}
            disabled={!SUB_AREAS[regionKey]}
            aria-label="읍·면 선택"
            className="rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/70 disabled:text-white/30"
          >
            <option value="">선택</option>
            {(SUB_AREAS[regionKey] ?? []).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap justify-end gap-0.5 rounded-lg border border-border-subtle bg-panel/95 p-1.5 shadow-panel">
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

        {activePanel && (
          <div className="max-h-[360px] w-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel p-3 shadow-panel">
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

                  {section.kind === "radio" ? (
                    <div className="flex flex-col gap-1">
                      {section.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-white/70 hover:bg-inset"
                        >
                          <input
                            type="radio"
                            name={activePanel.id}
                            checked={radioSel[activePanel.id] === item.id}
                            onChange={() => setRadioSel((prev) => ({ ...prev, [activePanel.id]: item.id }))}
                            onClick={() => {
                              // 이미 선택된 항목을 다시 누르면 선택 해제
                              if (radioSel[activePanel.id] === item.id) setRadioSel((prev) => ({ ...prev, [activePanel.id]: null }))
                            }}
                            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  ) : section.kind === "chip" ? (
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

        {layerNotice && (
          <div className="max-w-72 rounded-lg border border-border-subtle bg-panel px-3 py-2 text-[11px] text-white/60 shadow-panel">
            {layerNotice}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
