import { useMemo, useState } from "react"
import { useElementHeight } from "../hooks/useElementHeight"
import { useSearchParams } from "react-router-dom"
import { DragScrollTabs } from "../components/board/DragScrollTabs"
import { JejuTileMap } from "../components/ui/JejuTileMap"
import { JejuVectorMap } from "../components/ui/JejuVectorMap"
import { ActiveWarningsPanel } from "../components/sidepanel/ActiveWarningsPanel"
import { GisLeftPanel, type GisWhich } from "../components/sidepanel/GisLeftPanels"
import { ForecastPanel } from "../components/sidepanel/ForecastPanel"
import { LiveWarningsPanel } from "../components/sidepanel/LiveWarningsPanel"
import { TimelinePanel } from "../components/sidepanel/TimelinePanel"
import { SummaryRightDock, type SpDockTab } from "../components/sidepanel/SummaryRightDock"
import { PropagationPanel } from "../components/sidepanel/PropagationPanel"
import { SensorSummaryPanel, SensorTrendPanel } from "../components/sidepanel/SensorPanels"
import { ResponsePanel } from "../components/sidepanel/ResponsePanel"
import { fullySample, usePanelInput } from "../data/panelInput"
import { AiPanel, AssetPanel, ContactPanel, FuturePanel, ReportPanel } from "../components/sidepanel/MiscPanels"
import {
  HorizontalTabsDock,
  MessengerFab,
  Risk,
  ServiceStrip,
  SideTabsDock,
  StripToggle,
  type DockTab,
} from "../components/board/BoardParts"
import type { CctvCamera, RiskMarker } from "../types/domain"
import {
  agencyStatuses,
  riskMarkers,
  serviceStatusCards,
} from "../data/mockDashboard"
import { useLiveWeather } from "../data/useLiveWeather"
import { currentWeather, disasterIncidents, disasterResponseTeams } from "../data/mockIncidents"
import { cctvCoverageSummary } from "../data/mockCctv"
import { cctvStatusLabel, openCctvPlayer, useCctvCameras, useCctvLoadState } from "../data/cctvLive"
import { overallStatus } from "../data/mockMonitoring"
import { riskStyles } from "../components/ui/riskStyles"

/**
 * 통합 대시보드 — demo-10 클론 디자인(헤더 탭 3종: 종합 상황 / GIS 상황 / CCTV).
 * 탭은 헤더의 링크(/dashboard?tab=…)로 전환한다. 데이터·계산식은 기존 대시보드와 동일하다.
 */

function formatHM(iso: string) {
  return iso.slice(11, 16)
}

const MAP_DOMAIN_FILTERS: { id: RiskMarker["domain"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "heavyRain", label: "호우" },
  { id: "typhoon", label: "태풍" },
  { id: "heat", label: "폭염" },
  { id: "wildfire", label: "산불" },
  { id: "tsunami", label: "지진해일" },
  { id: "snow", label: "대설" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "해안관측" },
]

const CCTV_DOMAIN_FILTERS: { id: CctvCamera["domain"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "월파(연안)" },
  { id: "snow", label: "적설(대설)" },
  { id: "aqua", label: "해안관측" },
  { id: "general", label: "일반" },
]
const CCTV_DOMAIN_LABEL = Object.fromEntries(CCTV_DOMAIN_FILTERS.map((f) => [f.id, f.label])) as Record<string, string>

const REGIONS = ["제주시", "서귀포시"] as const

/** 종합상황 좌측 패널 제목 — 탭 이름과 같다(동네예보는 디자인대로 '동네 예보') */
const SP_LEFT_TITLE: Record<string, string> = { timeline: "타임라인", advisory: "발효중 특보", forecast: "동네 예보", "live-warnings": "실시간 특보" }

// 높은 등급부터 — 서비스 카드와 같은 4단계(관심 포함). 건수는 렌더 때마다 합산한다
const RISK_ORDER = ["danger", "alert", "warning", "caution"] as const

type TabKey = "summary" | "gis" | "cctv"

export function DashboardPage() {
  // 현재 날씨는 기상청 초단기실황(실시간)을 우선 쓰고, 못 받으면 기존 mock(관측값 없음)으로 되돌린다
  const liveWeather = useLiveWeather()
  const cctvCameras = useCctvCameras()
  const weather = liveWeather ?? currentWeather
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab")
  const tab: TabKey = raw === "gis" || raw === "cctv" ? raw : "summary"

  // 종합 상황과 GIS 상황의 분야 필터는 서로 독립 — 한쪽에서 '태풍'처럼 제주 밖 마커뿐인 분야를 골라도 다른 쪽 지도는 그대로
  const [mapDomain, setMapDomain] = useState<RiskMarker["domain"] | "all">("all")
  const [summaryDomain, setSummaryDomain] = useState<RiskMarker["domain"] | "all">("all")
  const byDomain = (d: RiskMarker["domain"] | "all") => (d === "all" ? riskMarkers : riskMarkers.filter((m) => m.domain === d))
  const filteredMarkers = useMemo(() => byDomain(mapDomain), [mapDomain])
  const summaryMarkers = useMemo(() => byDomain(summaryDomain), [summaryDomain])

  // 좌측 패널(종합) · 우측 패널(GIS) 탭 — 필터는 각 패널(src/components/sidepanel)이 가진다
  const [timelineTab, setTimelineTab] = useState("timeline")

  // 총 합계 — 기존 mock 데이터를 그대로 합산(새 수치를 만들지 않음)
  const totalActiveRisk = serviceStatusCards.reduce(
    (sum, card) => sum + card.counts.danger + card.counts.alert + card.counts.warning + (card.counts.caution ?? 0),
    0,
  )
  const riskTotals = RISK_ORDER.map((level) => ({
    level,
    count: serviceStatusCards.reduce((sum, card) => sum + (card.counts[level] ?? 0), 0),
  }))
  // 상황단계 = 서비스 전체에서 건수가 있는 가장 높은 등급(없으면 평시)
  const stageLevel = riskTotals.find((t) => t.count > 0)?.level
  const totalDutyMembers = disasterResponseTeams.reduce((sum, team) => sum + team.members, 0)
  const dispatchedTeams = disasterResponseTeams.filter((team) => team.status === "출동중").length
  const connectedAgencies = agencyStatuses.filter((a) => a.status === "connected").length

  // 제주시/서귀포시 집계 — disasterIncidents.region · disasterResponseTeams.agency의 실제 지역 태그만 사용
  const regionStats = REGIONS.map((label) => ({
    label,
    incidents: disasterIncidents.filter((i) => i.region === label),
    members: disasterResponseTeams.filter((t) => t.agency.includes(label)).reduce((sum, t) => sum + t.members, 0),
  }))

  const [mapTopRef, mapTopHeight] = useElementHeight<HTMLDivElement>()
  const [stripOpen, setStripOpen] = useState(true)
  const [leftOpen, setLeftOpen] = useState(true)
  // 요약 수치를 눌렀을 때 좌측 패널(접혀 있으면 펼침)의 해당 탭을 연다
  const openLeftTab = (key: string) => {
    setTimelineTab(key)
    setLeftOpen(true)
  }
  const [openRegions, setOpenRegions] = useState<string[]>([])
  const [summaryDockTab, setSummaryDockTab] = useState("broadcast")
  const [gisDockTab, setGisDockTab] = useState("status")

  // 종합상황 우측 패널 — Figma 1단계 R1~R8·R00 순서(방재메신저·안전뉴스는 2단계 예정 안내)
  const panelInput = usePanelInput()
  const summaryTabs: SpDockTab[] = [
    { key: "broadcast", label: "상황전파", content: <PropagationPanel /> },
    { key: "sensor", label: "센서정보", headTitle: "전체 센서 현황", sample: fullySample.sensor(panelInput), noData: true, content: <SensorSummaryPanel /> },
    { key: "trend", label: "센서 추이", sample: fullySample.trend(panelInput), noData: true, content: <SensorTrendPanel /> },
    { key: "response", label: "대응현황", headTitle: "대응 단계", sample: fullySample.response(panelInput), noData: true, content: <ResponsePanel /> },
    { key: "contact", label: "담당자", content: <ContactPanel /> },
    { key: "report", label: "보고서", content: <ReportPanel /> },
    { key: "asset", label: "자산현황", content: <AssetPanel /> },
    { key: "ai", label: "AI 분석", content: <AiPanel /> },
    { key: "messenger", label: "방재메신저", headTitle: "예정 기능", content: <FuturePanel kind="messenger" /> },
    { key: "news", label: "안전뉴스", headTitle: "예정 기능", content: <FuturePanel kind="news" /> },
  ]

  // GIS 상황 좌측 패널 — Figma 2단계 T1~T4(현황 · 관측·CCTV · 영향·자산 · 대응·연락). 서비스 칩은 지도 분야 칩과 같은 상태(mapDomain)
  const gisLeftTabs: DockTab[] = [
    { key: "status", label: "현황" },
    { key: "obs", label: "관측·CCTV" },
    { key: "impact", label: "영향·자산" },
    { key: "response", label: "대응·연락" },
  ].map((t) => ({ ...t, content: <GisLeftPanel which={t.key as GisWhich} domain={mapDomain} onDomain={setMapDomain} /> }))

  // 좌측 패널 4탭(종합상황) · GIS 우측 패널과 같은 구성 — 필터·데이터는 각 패널 컴포넌트 안에 있다
  const timelineTabs: DockTab[] = [
    { key: "timeline", label: "타임라인", content: <TimelinePanel /> },
    { key: "advisory", label: "발효중 특보", content: <ActiveWarningsPanel /> },
    { key: "forecast", label: "동네예보", content: <ForecastPanel /> },
    { key: "live-warnings", label: "실시간 특보", content: <LiveWarningsPanel /> },
  ]

  // 관측값이 없으면(observedAt "-") 0으로 보이지 않게 "-"로 표시한다
  const hasWeather = weather.observedAt !== "-"
  const wx = (value: number, unit = "") => (hasWeather ? `${value}${unit}` : "-")
  const weatherLine = (
    <p className="weather-line">
      기온 <b>{wx(weather.temperatureC, "℃")}</b> · 강수 <b>{wx(weather.rainfallMm, "mm")}</b> · 풍속{" "}
      <b>{wx(weather.windSpeedMs, "m/s")}</b> · 습도 <b>{wx(weather.humidityPercent, "%")}</b>
      {hasWeather ? ` · 기상청 초단기실황 ${formatHM(weather.observedAt)} 기준(${weather.location})` : " · 관측값 없음"}
    </p>
  )

  // GIS 지도 분야 필터 — 지도 왼쪽 빈 해역(2026-09-23 사용자 지정 위치)에 세로 버튼열로 배치
  const mapDomainFilterChips = (
    <div className="absolute left-3 top-[34%] z-[500] flex flex-col gap-2">
      {MAP_DOMAIN_FILTERS.map((f) => (
        <button key={f.id} type="button" className="chip" aria-pressed={mapDomain === f.id} onClick={() => setMapDomain(f.id)}>
          {f.label}
        </button>
      ))}
    </div>
  )

  const legend = (
    <>
      {(["danger", "alert", "warning", "caution", "safe"] as const).map((level) => (
        <span key={level} style={{ display: "contents" }}>
          <Risk level={level} />{" "}
        </span>
      ))}
    </>
  )

  // ============================ 종합 상황 ============================
  if (tab === "summary") {
    const incidentRow = (incident: (typeof disasterIncidents)[number]) => (
      <div
        className="region-card region-card--row"
        key={incident.id}
        title={`${incident.location} · ${incident.assignedTeam} · ${incident.action}`}
      >
        <span className={`dot dot--${incident.severity}`} />
        <span className="label">
          [{incident.type}] {incident.title}
        </span>
        {incident.status === "종료" ? <Risk level="offline" label="해제" solid /> : <Risk level={incident.severity} />}
      </div>
    )

    const toggleRegion = (label: string) =>
      setOpenRegions((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))

    const regionCard = (region: (typeof regionStats)[number]) => {
      const open = openRegions.includes(region.label)
      return (
        <>
          <div className={`region-card ${open ? "region-card--open" : "region-card--closed"}`}>
            <button
              type="button"
              className="region-card__label"
              aria-expanded={open}
              onClick={() => toggleRegion(region.label)}
              style={{ height: 24, width: "100%", justifyContent: "space-between", color: "var(--foreground)" }}
            >
              <span>{region.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--foreground-subtle)" }}>
                근무 {region.members} · 피해접수 {region.incidents.length}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : undefined }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            {open && (
              <div className="region-card__stats region-card__stats--2">
                <button type="button" title="담당자 보기" onClick={() => setSummaryDockTab("contact")}>
                  <span className="k">근무(명)</span>
                  <span className="v">{region.members}</span>
                </button>
                <button
                  type="button"
                  title="타임라인 보기"
                  onClick={() => openLeftTab("timeline")}
                >
                  <span className="k">피해접수(건)</span>
                  <span className="v warning">{region.incidents.length}</span>
                </button>
              </div>
            )}
          </div>
          {open && (
            <>
              <p className="region-foot">위험자산·상황전파는 도 전체 기준만 집계됩니다</p>
              <p className="region-sub">재난 발생 {region.incidents.length}건</p>
              {region.incidents.map(incidentRow)}
            </>
          )}
        </>
      )
    }

    const [jeju, seogwipo] = regionStats
    return (
      <main className="stage" id="main-content" tabIndex={-1}>
        <div className="stage__main">
          <div className="korea" />
          <div className="overlay">
            {/* 접힌 좌측 패널: 타임라인 */}
            <aside className={`dock dock--reserve dock--pill${leftOpen ? " is-open" : ""}`}>
              <button type="button" className="panel-pill" onClick={() => setLeftOpen(true)}>
                <span>타임라인</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 5l5 7-5 7M14 5l5 7-5 7" />
                </svg>
              </button>
              <section className="panel panel--left">
                <div className="panel__head">
                  <h2 className="panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {SP_LEFT_TITLE[timelineTab] ?? "타임라인"}
                    {timelineTab !== "timeline" && (
                      <span className="sp-live" style={{ fontWeight: 500 }}>
                        실시간
                      </span>
                    )}
                  </h2>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="접기"
                    onClick={() => setLeftOpen(false)}
                    style={{ width: 32, height: 32 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 5l-5 7 5 7M10 5l-5 7 5 7" />
                    </svg>
                  </button>
                </div>
                <DragScrollTabs label="타임라인 탭">
                  {timelineTabs.map((t) => (
                    <button key={t.key} type="button" role="tab" aria-selected={timelineTab === t.key} onClick={() => setTimelineTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </DragScrollTabs>
                <div className="panel__scroll">{(timelineTabs.find((t) => t.key === timelineTab) ?? timelineTabs[0]).content}</div>
              </section>
            </aside>

            <div className="center">
              <div className="regions regions--wide">
                {/* 좌측 지역 컬럼: 제주도(현재 날씨) */}
                <div className="region-col region-col--left">
                  <div className="region-card region-card--open">
                    <p className="region-card__label">
                      {liveWeather ? (
                        <span title="기상청 초단기실황 — 실시간 연동" style={{ color: "var(--risk-safe)" }}>
                          ●
                        </span>
                      ) : (
                        <span title="실제로 연동해서 가져올 수 없는 완전 가상 더미데이터입니다">*</span>
                      )}{" "}
                      제주도 · 현재 날씨{liveWeather ? ` (${liveWeather.location} 기준)` : ""}
                    </p>
                    <div className="region-card__stats">
                      {/* 날씨 수치를 누르면 좌측 패널의 동네예보(시간별 예보)를 연다 */}
                      <button type="button" title="동네예보 보기" onClick={() => openLeftTab("forecast")}>
                        <span className="k">기온</span>
                        <span className="v">{wx(weather.temperatureC, "℃")}</span>
                      </button>
                      <button type="button" title="동네예보 보기" onClick={() => openLeftTab("forecast")}>
                        <span className="k">강수(mm)</span>
                        <span className="v warning">{wx(weather.rainfallMm)}</span>
                      </button>
                      <button type="button" title="동네예보 보기" onClick={() => openLeftTab("forecast")}>
                        <span className="k">풍속(m/s)</span>
                        <span className="v">{wx(weather.windSpeedMs)}</span>
                      </button>
                      <button type="button" title="동네예보 보기" onClick={() => openLeftTab("forecast")}>
                        <span className="k">습도(%)</span>
                        <span className="v">{wx(weather.humidityPercent)}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 가운데: 제주 전역 위험 마커 */}
                <div className="korea__map" style={{ pointerEvents: "auto" }}>
                  <select
                    className="select"
                    value={summaryDomain}
                    onChange={(e) => setSummaryDomain(e.target.value as RiskMarker["domain"] | "all")}
                    style={{ height: 32, fontSize: 12, backgroundColor: "var(--background)", borderColor: "var(--foreground-faint)" }}
                    aria-label="분야"
                  >
                    {MAP_DOMAIN_FILTERS.map((f) => (
                      <option key={f.id} value={f.id}>
                        분야: {f.label}
                      </option>
                    ))}
                  </select>
                  <div className="jmap">
                    <JejuVectorMap markers={summaryMarkers} />
                    <div
                      className="risk-legend"
                      style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", zIndex: 500 }}
                      aria-label="서비스 경보 요약"
                    >
                      <Risk
                        level={stageLevel ?? "safe"}
                        label={`상황단계 ${stageLevel ? riskStyles[stageLevel].label : "평시"}`}
                        solid
                      />
                      {riskTotals.map(({ level, count }) => (
                        <Risk key={level} level={level} label={`${riskStyles[level].label} ${count}`} />
                      ))}
                      <Risk
                        level={overallStatus.status === "정상" ? "safe" : "warning"}
                        label={`시스템 ${overallStatus.status}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 우측 지역 컬럼: 총 합계 + 제주시 + 서귀포시 */}
                <div className="region-col region-col--right">
                  <div className="region-card region-card--open">
                    <p className="region-card__label">
                      <span title="실제로 연동해서 가져올 수 없는 완전 가상 더미데이터입니다">*</span> 총 합계 · 제주도 전체
                    </p>
                    <div className="region-card__stats">
                      {/* 각 수치를 누르면 그 수치의 근거가 되는 패널·화면을 연다 */}
                      <button type="button" title="담당자 보기" onClick={() => setSummaryDockTab("contact")}>
                        <span className="k">근무(명) · 출동 {dispatchedTeams}팀</span>
                        <span className="v">{totalDutyMembers}</span>
                      </button>
                      <button type="button" title="GIS 상황에서 위험 위치 보기" onClick={() => setParams({ tab: "gis" })}>
                        <span className="k">위험자산(건)</span>
                        <span className="v danger">{totalActiveRisk}</span>
                      </button>
                      <button
                        type="button"
                        title="타임라인 보기"
                        onClick={() => openLeftTab("timeline")}
                      >
                        <span className="k">피해접수(건)</span>
                        <span className="v warning">{disasterIncidents.length}</span>
                      </button>
                      <button type="button" title="상황전파 보기" onClick={() => setSummaryDockTab("broadcast")}>
                        <span className="k">상황전파 연결</span>
                        <span className="v safe">
                          {connectedAgencies}/{agencyStatuses.length}
                        </span>
                      </button>
                    </div>
                  </div>
                  {regionCard(jeju)}
                  {regionCard(seogwipo)}
                </div>
              </div>
            </div>

            <SummaryRightDock tabs={summaryTabs} activeKey={summaryDockTab} onSelect={setSummaryDockTab} />
          </div>
          <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
        </div>
        {stripOpen && <ServiceStrip cards={serviceStatusCards} />}
        <MessengerFab onClick={() => setSummaryDockTab("messenger")} />
      </main>
    )
  }

  // ============================ GIS 상황 ============================
  if (tab === "gis") {
    return (
      <main className="stage" id="main-content" tabIndex={-1}>
        <div className="stage__main">
          <div className="map map--dark" />
          <div className="overlay">
            <SideTabsDock tabs={gisLeftTabs} rail="right" equal activeKey={gisDockTab} onSelect={setGisDockTab} />

            <div className="center center--gis">
              <div className="jmap" style={{ pointerEvents: "auto" }}>
                <JejuTileMap
                  markers={filteredMarkers}
                  cctvMarkers={cctvCameras}
                  className="relative h-full w-full"
                  toolbarAtBottom
                  fitMarkers
                  toolbarTop={mapTopHeight + 16}
                />
                {mapDomainFilterChips}
              </div>
              <div className="map-top" ref={mapTopRef}>
                {weatherLine}
              </div>
              <div />
              <div className="timebar">
                <div className="risk-legend">범례 {legend}</div>
              </div>
            </div>

            <HorizontalTabsDock tabs={timelineTabs} activeKey={timelineTab} onSelect={setTimelineTab} />
          </div>
          <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
        </div>
        {stripOpen && <ServiceStrip cards={serviceStatusCards} />}
        <MessengerFab onClick={() => setGisDockTab("status")} />
      </main>
    )
  }

  // ============================ CCTV ============================
  return <CctvView />
}

function CctvView() {
  const cctvCameras = useCctvCameras()
  const cctvLoad = useCctvLoadState()
  const hasCctvData = cctvLoad.phase === "ready" || cctvLoad.phase === "partial"
  const [domain, setDomain] = useState<CctvCamera["domain"] | "all">("all")
  const [query, setQuery] = useState("")
  const riverCount = cctvCameras.filter((camera) => camera.domain === "river").length
  const waveCount = cctvCameras.filter((camera) => camera.domain === "coast").length
  const snowCount = cctvCameras.filter((camera) => camera.domain === "snow").length
  const checkedAtLabel = cctvLoad.checkedAt
    ? new Date(cctvLoad.checkedAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null
  const cameras = useMemo(() => {
    const q = query.trim()
    return cctvCameras.filter((camera) => {
      const matchesDomain = domain === "all" || camera.domain === domain
      const matchesQuery = q === "" || camera.name.includes(q) || camera.address.includes(q)
      return matchesDomain && matchesQuery
    })
  }, [cctvCameras, domain, query])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__search">
          <label className="label" htmlFor="cam-q">
            검색어
          </label>
          <div className="row">
            <input
              className="input"
              id="cam-q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="주소 또는 카메라명"
            />
          </div>
        </div>
        {/* 탭이 하나뿐인 제목 줄 — 누를 동작이 없어 버튼이 아닌 정적 라벨로 둔다 */}
        <div className="tabs">
          <span className="tabs__static">분야</span>
        </div>
        <ul className="tree">
          {CCTV_DOMAIN_FILTERS.filter((f) => f.id === "all" || cctvCameras.some((c) => c.domain === f.id)).map((f) => {
            const count = f.id === "all" ? cctvCameras.length : cctvCameras.filter((c) => c.domain === f.id).length
            return (
              <li key={f.id}>
                <button type="button" aria-pressed={domain === f.id} onClick={() => setDomain(f.id)}>
                  <span>
                    {f.label} <span className="count">({hasCctvData ? count : "—"})</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="content" id="main-content" tabIndex={-1}>
        <div className="content__head">
          <div>
            <h2 className="content__title">CCTV 통합 조회</h2>
            <p className="content__sub">
              제주시 월파·하천·적설 감시 CCTV(공공데이터포털 API) — 현재 조회 가능한 목록의 위치·사용 여부·영상
            </p>
          </div>
        </div>
        <div className="coverage">
          <div className="pbox">
            <small>현재 조회 목록</small>
            <b>{hasCctvData ? `${cctvCameras.length}대` : "—"}</b>
            <p>제주시 공공데이터 API 3종</p>
          </div>
          <div className="pbox">
            <small>하천 감시</small>
            <b>{hasCctvData ? `${riverCount}대` : "—"}</b>
          </div>
          <div className="pbox">
            <small>월파 감시</small>
            <b>{hasCctvData ? `${waveCount}대` : "—"}</b>
          </div>
          <div className="pbox">
            <small>적설 감시</small>
            <b>{hasCctvData ? `${snowCount}대` : "—"}</b>
          </div>
        </div>
        <p className={`cctv-feed-status cctv-feed-status--${cctvLoad.phase}`} role="status">
          {cctvLoad.phase === "ready" && `제주시 공공데이터 API 3/3종 수신${checkedAtLabel ? ` · ${checkedAtLabel} 확인` : ""} · 도 전체 CCTV 수가 아닙니다.`}
          {cctvLoad.phase === "partial" && `일부 수신 실패 · ${cctvLoad.receivedFeeds}/3종만 반영${checkedAtLabel ? ` · ${checkedAtLabel} 확인` : ""} · 표시 대수는 전체가 아닙니다.`}
          {cctvLoad.phase === "loading" && "제주시 CCTV 목록을 불러오는 중입니다."}
          {cctvLoad.phase === "failed" && "CCTV 목록을 불러오지 못했습니다. 현재 대수를 확인할 수 없습니다."}
          {cctvLoad.phase === "unconfigured" && "CCTV 조회용 프록시 주소가 설정되지 않아 현재 대수를 확인할 수 없습니다."}
        </p>
        <details className="cctv-legacy-context">
          <summary>도 전체 운영 규모 · 면담 자료 참고(현재 조회 목록과 별개)</summary>
          <p>
            도 자체관제 약 {(cctvCoverageSummary.ownOperatedApproxTotal / 10000).toFixed(1)}만대,
            불법주정차 CCTV 포함 약 {(cctvCoverageSummary.includingIllegalParkingApproxTotal / 10000).toFixed(1)}만대.
            두 수치는 포함 관계로 합산하지 않습니다.
          </p>
          <p>출처: 레거시시스템 현황 조사 면담 결과서({cctvCoverageSummary.sourceDate}). ITS 일부 연계 언급은 있으나 확인된 연계 대수는 없습니다.</p>
          <p>{cctvCoverageSummary.retentionNote}</p>
        </details>
        {hasCctvData && (
          <p className="cctv-result-count" aria-live="polite">
            {cameras.length === cctvCameras.length ? `목록 ${cctvCameras.length}대` : `검색 결과 ${cameras.length} / 목록 ${cctvCameras.length}대`}
          </p>
        )}
        {!hasCctvData ? (
          <p className="pempty">{cctvLoad.phase === "loading" ? "목록을 불러오는 중입니다." : "현재 CCTV 목록을 표시할 수 없습니다."}</p>
        ) : cameras.length === 0 ? (
          <p className="pempty">검색 결과가 없습니다.</p>
        ) : (
          <div className="grid-cards">
            {cameras.map((camera) => {
              const online = camera.status === "online"
              return (
                <article className="card cam-card" key={camera.id}>
                  <div className={`cam-card__screen${online ? "" : " is-off"}`}>
                    {camera.streamUrl ? (
                      <button type="button" className="btn btn--outline btn--pill" onClick={() => openCctvPlayer(camera)} style={{ height: 34, fontSize: 12 }}>
                        ▶ 영상 보기
                      </button>
                    ) : online ? (
                      "실시간 영상 연동 예정"
                    ) : (
                      "미사용 — 영상 주소 없음"
                    )}
                  </div>
                  <h3>
                    {camera.name}
                    <span className={`risk ${online ? "risk--info" : "risk--offline"}`}>{cctvStatusLabel(camera)}</span>
                  </h3>
                  <p>{camera.address}</p>
                  <div className="row-between" style={{ fontSize: 11, color: "var(--foreground-subtle)" }}>
                    <span>
                      {CCTV_DOMAIN_LABEL[camera.domain]} · {camera.operator}
                    </span>
                    {camera.lastFrameAt && <span>최종 수신 {formatHM(camera.lastFrameAt)}</span>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

