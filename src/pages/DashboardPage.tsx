import { useMemo, useState, type ReactNode } from "react"
import { useElementHeight } from "../hooks/useElementHeight"
import { Link, useSearchParams } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DutyContactPanel } from "../components/ui/DutyContactPanel"
import { JejuTileMap } from "../components/ui/JejuTileMap"
import { JejuVectorMap } from "../components/ui/JejuVectorMap"
import { VilageForecastPanel } from "../components/ui/VilageForecastPanel"
import { WarningsPanel } from "../components/ui/WarningsPanel"
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
  aiInsights,
  dashboardSensors,
  predictionConfidence,
  recentActions,
  riskMarkers,
  sensorCrossCheck,
  serviceStatusCards,
  sixHourSeries,
  timeSeries,
} from "../data/mockDashboard"
import { currentWeather, disasterAlerts, disasterIncidents, disasterResponseTeams, shelters } from "../data/mockIncidents"
import { cctvCameras, cctvCoverageSummary } from "../data/mockCctv"
import { sequentialPropagation, simultaneousPropagationGoal } from "../data/mockPropagation"

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
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "양식장" },
]

const CCTV_DOMAIN_FILTERS: { id: CctvCamera["domain"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "양식장" },
  { id: "general", label: "일반" },
]
const CCTV_DOMAIN_LABEL = Object.fromEntries(CCTV_DOMAIN_FILTERS.map((f) => [f.id, f.label])) as Record<string, string>

const REGIONS = ["제주시", "서귀포시"] as const

type TabKey = "summary" | "gis" | "cctv"

export function DashboardPage() {
  const [params] = useSearchParams()
  const raw = params.get("tab")
  const tab: TabKey = raw === "gis" || raw === "cctv" ? raw : "summary"

  // 종합 상황과 GIS 상황의 분야 필터는 서로 독립 — 한쪽에서 '태풍'처럼 제주 밖 마커뿐인 분야를 골라도 다른 쪽 지도는 그대로
  const [mapDomain, setMapDomain] = useState<RiskMarker["domain"] | "all">("all")
  const [summaryDomain, setSummaryDomain] = useState<RiskMarker["domain"] | "all">("all")
  const byDomain = (d: RiskMarker["domain"] | "all") => (d === "all" ? riskMarkers : riskMarkers.filter((m) => m.domain === d))
  const filteredMarkers = useMemo(() => byDomain(mapDomain), [mapDomain])
  const summaryMarkers = useMemo(() => byDomain(summaryDomain), [summaryDomain])

  // 타임라인/발효중 특보 패널 필터
  const [timelineType, setTimelineType] = useState<string>("all")
  const [timelineQuery, setTimelineQuery] = useState("")
  const [showIssued, setShowIssued] = useState(true)
  const [showLifted, setShowLifted] = useState(true)
  const [timelineTab, setTimelineTab] = useState("timeline")

  const incidentTypes = useMemo(() => Array.from(new Set(disasterIncidents.map((i) => i.type))), [])

  const filteredIncidents = useMemo(() => {
    const q = timelineQuery.trim()
    return disasterIncidents.filter((incident) => {
      const lifted = incident.status === "종료"
      if (lifted && !showLifted) return false
      if (!lifted && !showIssued) return false
      if (timelineType !== "all" && incident.type !== timelineType) return false
      if (q && !incident.title.includes(q) && !incident.location.includes(q)) return false
      return true
    })
  }, [timelineType, timelineQuery, showIssued, showLifted])

  const filteredAlerts = useMemo(() => {
    const q = timelineQuery.trim()
    return disasterAlerts.filter((alert) => {
      const lifted = alert.expiresAt <= currentWeather.observedAt
      if (lifted && !showLifted) return false
      if (!lifted && !showIssued) return false
      if (q && !alert.title.includes(q) && !alert.message.includes(q)) return false
      return true
    })
  }, [timelineQuery, showIssued, showLifted])

  const timelineDateRange = useMemo(() => {
    const dates = [...disasterIncidents.map((i) => i.reportedAt), ...disasterAlerts.map((a) => a.issuedAt)].map((s) => s.slice(0, 10))
    return `${dates.reduce((a, b) => (a < b ? a : b))} ~ ${dates.reduce((a, b) => (a > b ? a : b))}`
  }, [])

  // 총 합계 — 기존 mock 데이터를 그대로 합산(새 수치를 만들지 않음)
  const totalActiveRisk = serviceStatusCards.reduce(
    (sum, card) => sum + card.counts.danger + card.counts.alert + card.counts.warning + (card.counts.caution ?? 0),
    0,
  )
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
  const [openRegions, setOpenRegions] = useState<string[]>([])
  const [summaryDockTab, setSummaryDockTab] = useState("broadcast")
  const [gisDockTab, setGisDockTab] = useState("timeline")

  // ---- 패널 안 콘텐츠 (클론의 plist / pgroup / pbox 규칙) ----
  const railContent: Record<string, ReactNode> = {
    timeline: (
      <ul className="plist">
        {disasterIncidents.map((incident) => (
          <li key={incident.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Risk level={incident.severity} />
              <span className="t">
                [{incident.type}] {incident.title}
              </span>
            </div>
            <p className="s">
              {incident.region} · {incident.status}
            </p>
          </li>
        ))}
      </ul>
    ),
    broadcast: (
      <>
        <div className="pgroup">
          <p className="pnote">도청 → 시 상황실 → 읍면동 순차 전파</p>
          <div className="steps">
            {sequentialPropagation.map((step, i) => {
              const next = sequentialPropagation[i + 1]
              const lag = next
                ? (() => {
                    const [h1, m1] = step.time.split(":").map(Number)
                    const [h2, m2] = next.time.split(":").map(Number)
                    return h2 * 60 + m2 - (h1 * 60 + m1)
                  })()
                : null
              return (
                <span key={step.id} style={{ display: "contents" }}>
                  <div className="step">
                    <b>{step.stage}</b>
                    <span>{step.time}</span>
                  </div>
                  {lag !== null && <span className="lag">→{lag}분</span>}
                </span>
              )
            })}
          </div>
          <p className="pgoal">
            목표: {simultaneousPropagationGoal.note} — {simultaneousPropagationGoal.status}
          </p>
          <Link className="plink" to="/propagation">
            전체 보기 → (상황전파·보고체계)
          </Link>
        </div>
        <div className="pgroup">
          <p className="pnote">최근 조치 이력</p>
          <ul className="plist">
            {recentActions.map((action) => (
              <li key={action.id}>
                <div className="row-between">
                  <span className="t">{action.title}</span>
                  <span className="s" style={{ margin: 0 }}>
                    {action.time}
                  </span>
                </div>
                <p className="s">
                  {action.owner} · {action.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </>
    ),
    sensor: (
      <ul className="plist">
        {dashboardSensors.map((sensor) => (
          <li key={sensor.id} className="row-between">
            <div>
              <p className="t">{sensor.name}</p>
              <p className="s">{sensor.location}</p>
            </div>
            <Risk level={sensor.status} label={sensor.value} />
          </li>
        ))}
      </ul>
    ),
    response: (
      <>
        <div className="pgroup">
          <p className="pnote">기관별 대응 상태</p>
          <ul className="plist">
            {agencyStatuses.map((agency) => (
              <li key={agency.id} className="row-between">
                <span>{agency.agency}</span>
                <span style={{ color: agency.status === "down" ? "var(--risk-danger)" : "var(--risk-safe)", fontWeight: 700 }}>
                  {agency.status === "down" ? "⚠ 장애" : "● 연결"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pgroup">
          <p className="pnote">현장 대응팀</p>
          <ul className="plist">
            {disasterResponseTeams.map((team) => (
              <li key={team.id} className="row-between">
                <span>{team.name}</span>
                <Risk level={team.status === "출동중" ? "info" : "offline"} label={team.status} />
              </li>
            ))}
          </ul>
        </div>
      </>
    ),
    contact: <DutyContactPanel />,
    report: (
      <>
        <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>종료된 사건의 상세 보고서를 조회합니다.</p>
        <Link
          className="btn btn--outline btn--pill btn--block"
          to="/reports"
          style={{ marginTop: 10, height: 34, fontSize: 12 }}
        >
          이력·보고서 전체 조회 →
        </Link>
      </>
    ),
    asset: (
      <>
        {shelters.map((shelter) => (
          <div className="pbox" key={shelter.id}>
            <div className="row-between">
              <span className="t">{shelter.name}</span>
              <Risk level="safe" label={shelter.status} />
            </div>
            <p className="s">
              {shelter.region} · {shelter.address}
            </p>
            <p style={{ marginTop: 4, color: "var(--foreground-muted)" }}>
              수용 {shelter.currentOccupancy} / {shelter.capacity}명
            </p>
          </div>
        ))}
      </>
    ),
    messenger: <p className="pempty">2단계 상세 구현 예정 — 준비 중입니다.</p>,
    news: <p className="pempty">2단계 상세 구현 예정 — 준비 중입니다.</p>,
    ai: (
      <>
        <p className="pnote">예측 신뢰도: 고신뢰 ({predictionConfidence.percent}%)</p>
        {aiInsights.map((insight) => (
          <div className="pbox" key={insight.id}>
            <p className="t">{insight.title}</p>
            <p className="s">{insight.basis}</p>
          </div>
        ))}
        <div className="pbox" style={{ marginTop: 12, background: "none" }}>
          <p className="t">센서 이상 교차검증</p>
          <p className="s">
            정상 {sensorCrossCheck.normal} / 장애 {sensorCrossCheck.fault} / 누락 {sensorCrossCheck.missing}
          </p>
        </div>
      </>
    ),
    trend: (
      <>
        <div className="kv-grid">
          {timeSeries.map((reading) => {
            const over = reading.worseWhen === "below" ? reading.value <= reading.threshold : reading.value >= reading.threshold
            return (
              <div className="pbox" key={reading.label}>
                <small>{reading.label}</small>
                <b className={over ? "over" : undefined}>
                  {reading.value}
                  {reading.unit}
                </b>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sixHourSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 10, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#ffffffaa" }} />
              <Line type="monotone" dataKey="돈내코수위" stroke="#0054a3" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="쇠소깍수위" stroke="#8ec21f" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="함덕수온" stroke="#f2731a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    ),
  }

  const summaryDockTabs: DockTab[] = [
    { key: "broadcast", label: "상황전파" },
    { key: "sensor", label: "센서정보" },
    { key: "response", label: "대응현황" },
    { key: "contact", label: "담당자" },
    { key: "report", label: "보고서" },
    { key: "asset", label: "자산현황" },
    { key: "messenger", label: "방재메신저" },
    { key: "news", label: "안전뉴스" },
    { key: "ai", label: "AI 분석" },
    { key: "trend", label: "센서 추이" },
  ].map((t) => ({ ...t, content: railContent[t.key] }))

  const gisLeftTabs: DockTab[] = [
    { key: "timeline", label: "타임라인" },
    { key: "broadcast", label: "상황전파" },
    { key: "sensor", label: "센서정보" },
    { key: "response", label: "대응현황" },
    { key: "contact", label: "담당자" },
    { key: "report", label: "보고서" },
    { key: "asset", label: "자산현황" },
    { key: "messenger", label: "방재메신저" },
    { key: "news", label: "안전뉴스" },
  ].map((t) => ({ ...t, content: railContent[t.key] }))

  const timelineFilters = (
    <div className="pfilters">
      <div className="row">
        <select className="select" value={timelineType} onChange={(e) => setTimelineType(e.target.value)} aria-label="유형">
          <option value="all">전체 유형</option>
          {incidentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="input"
          value={timelineQuery}
          onChange={(e) => setTimelineQuery(e.target.value)}
          placeholder="검색 (제목·위치)"
        />
      </div>
      <p className="date">{timelineDateRange}</p>
      <div className="checks">
        <label className="check">
          <input type="checkbox" checked={showIssued} onChange={(e) => setShowIssued(e.target.checked)} /> 발령
        </label>
        <label className="check">
          <input type="checkbox" checked={showLifted} onChange={(e) => setShowLifted(e.target.checked)} /> 해제
        </label>
      </div>
    </div>
  )

  const timelineTabs: DockTab[] = [
    {
      key: "timeline",
      label: "타임라인",
      content: (
        <ul className="plist">
          {filteredIncidents.length === 0 && <li className="pempty">조건에 맞는 항목이 없습니다.</li>}
          {filteredIncidents.map((incident) => (
            <li key={incident.id}>
              <div className="row-between">
                <span className="time">{formatHM(incident.reportedAt)}</span>
                {incident.status === "종료" ? <Risk level="offline" label="해제" solid /> : <Risk level="safe" label="발령" solid />}
              </div>
              <p className="mt">
                <Risk level={incident.severity} label={incident.type} />
              </p>
              <p className="t" style={{ marginTop: 4 }}>
                {incident.title}
              </p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "advisory",
      label: "발효중 특보",
      content: (
        <ul className="plist" style={{ gap: 8 }}>
          {filteredAlerts.length === 0 && <li className="pempty">조건에 맞는 항목이 없습니다.</li>}
          {filteredAlerts.map((alert) => {
            const lifted = alert.expiresAt <= currentWeather.observedAt
            return (
              <li key={alert.id}>
                <div className="pbox">
                  <div className="row-between">
                    {lifted ? <Risk level="offline" label="해제" solid /> : <Risk level="safe" label="발령" solid />}
                    <span className="s" style={{ margin: 0 }}>
                      {formatHM(alert.issuedAt)}~{formatHM(alert.expiresAt)}
                    </span>
                  </div>
                  <p className="mt">
                    <Risk level={alert.level} label={alert.title} />
                  </p>
                  <p className="s" style={{ marginTop: 6 }}>
                    {alert.target} · {alert.message}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ),
    },
    { key: "forecast", label: "동네예보", content: <VilageForecastPanel variant="dock" /> },
    { key: "live-warnings", label: "실시간 특보", content: <WarningsPanel /> },
  ]

  const weatherLine = (
    <p className="weather-line">
      기온 <b>{currentWeather.temperatureC}℃</b> · 강수 <b>{currentWeather.rainfallMm}mm</b> · 풍속{" "}
      <b>{currentWeather.windSpeedMs}m/s</b> · 습도 <b>{currentWeather.humidityPercent}%</b> · 갱신{" "}
      {formatHM(currentWeather.observedAt)} / 5분 주기
    </p>
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
                <button type="button">
                  <span className="k">근무(명)</span>
                  <span className="v">{region.members}</span>
                </button>
                <button type="button">
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
      <div className="stage">
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
                  <h2 className="panel__title">타임라인</h2>
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
                <div className="tabs" role="tablist">
                  {timelineTabs.map((t) => (
                    <button key={t.key} type="button" role="tab" aria-selected={timelineTab === t.key} onClick={() => setTimelineTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {(timelineTab === "timeline" || timelineTab === "advisory") && timelineFilters}
                <div className="panel__scroll">{(timelineTabs.find((t) => t.key === timelineTab) ?? timelineTabs[0]).content}</div>
              </section>
            </aside>

            <div className="center">
              <div className="regions regions--wide">
                {/* 좌측 지역 컬럼: 제주도(현재 날씨) */}
                <div className="region-col region-col--left">
                  <div className="region-card region-card--open">
                    <p className="region-card__label">제주도 · 현재 날씨</p>
                    <div className="region-card__stats">
                      <button type="button">
                        <span className="k">기온</span>
                        <span className="v">{currentWeather.temperatureC}℃</span>
                      </button>
                      <button type="button">
                        <span className="k">강수(mm)</span>
                        <span className="v warning">{currentWeather.rainfallMm}</span>
                      </button>
                      <button type="button">
                        <span className="k">풍속(m/s)</span>
                        <span className="v">{currentWeather.windSpeedMs}</span>
                      </button>
                      <button type="button">
                        <span className="k">습도(%)</span>
                        <span className="v">{currentWeather.humidityPercent}</span>
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
                  </div>
                </div>

                {/* 우측 지역 컬럼: 총 합계 + 제주시 + 서귀포시 */}
                <div className="region-col region-col--right">
                  <div className="region-card region-card--open">
                    <p className="region-card__label">총 합계 · 제주도 전체</p>
                    <div className="region-card__stats">
                      <button type="button">
                        <span className="k">근무(명) · 출동 {dispatchedTeams}팀</span>
                        <span className="v">{totalDutyMembers}</span>
                      </button>
                      <button type="button">
                        <span className="k">위험자산(건)</span>
                        <span className="v danger">{totalActiveRisk}</span>
                      </button>
                      <button type="button">
                        <span className="k">피해접수(건)</span>
                        <span className="v warning">{disasterIncidents.length}</span>
                      </button>
                      <button type="button">
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

            <SideTabsDock
              tabs={summaryDockTabs}
              rail="left"
              activeKey={summaryDockTab}
              onSelect={setSummaryDockTab}
              dense
              headExtra={<span style={{ fontSize: 11, color: "var(--foreground-subtle)" }}>대응 패널</span>}
            />
          </div>
          <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
        </div>
        {stripOpen && <ServiceStrip cards={serviceStatusCards} />}
        <MessengerFab onClick={() => setSummaryDockTab("messenger")} />
      </div>
    )
  }

  // ============================ GIS 상황 ============================
  if (tab === "gis") {
    return (
      <div className="stage">
        <div className="stage__main">
          <div className="map map--dark" />
          <div className="overlay">
            <SideTabsDock tabs={gisLeftTabs} rail="right" activeKey={gisDockTab} onSelect={setGisDockTab} />

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
              </div>
              <div className="map-top" ref={mapTopRef}>
                {weatherLine}
                <div className="chips">
                  {MAP_DOMAIN_FILTERS.map((f) => (
                    <button key={f.id} type="button" className="chip" aria-pressed={mapDomain === f.id} onClick={() => setMapDomain(f.id)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div />
              <div className="timebar">
                <div className="risk-legend">범례 {legend}</div>
              </div>
            </div>

            <HorizontalTabsDock tabs={timelineTabs} filters={timelineTab === "timeline" || timelineTab === "advisory" ? timelineFilters : undefined} activeKey={timelineTab} onSelect={setTimelineTab} />
          </div>
          <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
        </div>
        {stripOpen && <ServiceStrip cards={serviceStatusCards} />}
        <MessengerFab onClick={() => setGisDockTab("messenger")} />
      </div>
    )
  }

  // ============================ CCTV ============================
  return <CctvView />
}

function CctvView() {
  const [domain, setDomain] = useState<CctvCamera["domain"] | "all">("all")
  const [query, setQuery] = useState("")
  const cameras = useMemo(() => {
    const q = query.trim()
    return cctvCameras.filter((camera) => {
      const matchesDomain = domain === "all" || camera.domain === domain
      const matchesQuery = q === "" || camera.name.includes(q) || camera.address.includes(q)
      return matchesDomain && matchesQuery
    })
  }, [domain, query])

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
        <div className="tabs">
          <button type="button" aria-selected="true">
            분야
          </button>
        </div>
        <ul className="tree">
          {CCTV_DOMAIN_FILTERS.map((f) => {
            const count = f.id === "all" ? cctvCameras.length : cctvCameras.filter((c) => c.domain === f.id).length
            return (
              <li key={f.id}>
                <button type="button" aria-pressed={domain === f.id} onClick={() => setDomain(f.id)}>
                  <span>
                    {f.label} <span className="count">({count})</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="content">
        <div className="content__head">
          <div>
            <h2 className="content__title">CCTV 통합 조회</h2>
            <p className="content__sub">
              3개 실증 서비스 확정 대상지 카메라 + 도심 대표 카메라 · 영상 스트림은 백엔드 연동 전이라 표시하지 않음
            </p>
          </div>
        </div>
        <div className="coverage">
          <div className="pbox">
            <small>도 자체관제</small>
            <b>약 {(cctvCoverageSummary.ownOperatedTotal / 10000).toFixed(1)}만대</b>
          </div>
          <div className="pbox">
            <small>불법주정차 포함</small>
            <b>약 {(cctvCoverageSummary.includingIllegalParkingTotal / 10000).toFixed(1)}만대</b>
          </div>
          <div className="pbox">
            <small>자치경찰단 ITS 연계</small>
            <b>
              {cctvCoverageSummary.itsLinkedCount} / {cctvCoverageSummary.itsTotalCount.toLocaleString()}대
            </b>
            <p>예산·라이선스 문제로 일부만 연계</p>
          </div>
          <div className="pbox">
            <small>이 화면의 대표 카메라</small>
            <b>{cctvCoverageSummary.representativeCount}대</b>
            <p>실제 규모와 혼동하지 않도록 구분 표기</p>
          </div>
        </div>
        {cameras.length === 0 ? (
          <p className="pempty">검색 결과가 없습니다.</p>
        ) : (
          <div className="grid-cards">
            {cameras.map((camera) => {
              const online = camera.status === "online"
              return (
                <article className="card cam-card" key={camera.id}>
                  <div className={`cam-card__screen${online ? "" : " is-off"}`}>
                    {online ? "실시간 영상 연동 예정" : "오프라인 — 영상 수신 없음"}
                  </div>
                  <h3>
                    {camera.name}
                    <span className={`risk ${online ? "risk--info" : "risk--offline"}`}>{online ? "연결" : "오프라인"}</span>
                  </h3>
                  <p>{camera.address}</p>
                  <div className="row-between" style={{ fontSize: 11, color: "var(--foreground-subtle)" }}>
                    <span>
                      {CCTV_DOMAIN_LABEL[camera.domain]} · {camera.operator}
                    </span>
                    <span>최종 수신 {formatHM(camera.lastFrameAt)}</span>
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

