import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../components/ui/Card"
import { CctvCameraCard } from "../components/ui/CctvCameraCard"
import { DutyContactPanel } from "../components/ui/DutyContactPanel"
import { JejuTileMap } from "../components/ui/JejuTileMap"
import { Pill } from "../components/ui/Pill"
import { RiskBadge } from "../components/ui/RiskBadge"
import { riskStyles } from "../components/ui/riskStyles"
import { ServiceStatusCard } from "../components/ui/ServiceStatusCard"
import { GisIconRail, GIS_RAIL_ITEMS, type GisRailKey } from "../components/ui/GisIconRail"
import { GisSidePanel } from "../components/ui/GisSidePanel"
import { GisTimelinePanel, type GisTimelineTab } from "../components/ui/GisTimelinePanel"
import { VilageForecastPanel } from "../components/ui/VilageForecastPanel"
import type { RiskMarker } from "../types/domain"
import {
  agencyStatuses,
  aiInsights,
  dashboardSensors,
  lastSyncedAt,
  predictionConfidence,
  recentActions,
  riskMarkers,
  sensorCrossCheck,
  serviceStatusCards,
  sixHourSeries,
  timeSeries,
} from "../data/mockDashboard"
import { currentWeather, disasterAlerts, disasterIncidents, disasterResponseTeams } from "../data/mockIncidents"
import { cctvCameras, cctvCoverageSummary } from "../data/mockCctv"
import { sequentialPropagation, simultaneousPropagationGoal } from "../data/mockPropagation"
import type { CctvCamera } from "../types/domain"
// import { shelters } from "../data/mockIncidents" // 자산현황 우선 주석처리 — 재활성화 시 위 줄에 합치기

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

// 대시보드는 대피소(shelters) 자산현황이 맥락과 안 맞아 우선 주석처리 — 필요해지면 GIS_RAIL_ITEMS 그대로 사용
const DASHBOARD_RAIL_ITEMS = GIS_RAIL_ITEMS.filter((item) => item.key !== "asset")

const TOP_TABS = [
  { key: "summary", label: "종합 상황" },
  { key: "gis", label: "GIS 상황" },
  { key: "cctv", label: "CCTV" },
] as const
type TopTabKey = (typeof TOP_TABS)[number]["key"]

export function DashboardPage() {
  const [topTab, setTopTab] = useState<TopTabKey>("gis")
  const [mapDomain, setMapDomain] = useState<RiskMarker["domain"] | "all">("all")
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)
  const filteredMarkers = useMemo(
    () => (mapDomain === "all" ? riskMarkers : riskMarkers.filter((m) => m.domain === mapDomain)),
    [mapDomain],
  )

  // 타임라인/발효중 특보 패널 필터 — demo-10.muhanit.kr GIS 상황 화면의 필터+검색+발령/해제 UI 참고
  const [timelineType, setTimelineType] = useState<string>("all")
  const [timelineQuery, setTimelineQuery] = useState("")
  const [showIssued, setShowIssued] = useState(true)
  const [showLifted, setShowLifted] = useState(true)

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

  const alertSummary = useMemo(
    () =>
      (["danger", "alert", "warning"] as const).map((level) => ({
        level,
        count: serviceStatusCards.reduce((sum, card) => sum + (card.counts[level] ?? 0), 0),
      })),
    [],
  )

  const [cctvDomain, setCctvDomain] = useState<CctvCamera["domain"] | "all">("all")
  const [cctvQuery, setCctvQuery] = useState("")
  const filteredCameras = useMemo(() => {
    const q = cctvQuery.trim()
    return cctvCameras.filter((camera) => {
      const matchesDomain = cctvDomain === "all" || camera.domain === cctvDomain
      const matchesQuery = q === "" || camera.name.includes(q) || camera.address.includes(q)
      return matchesDomain && matchesQuery
    })
  }, [cctvDomain, cctvQuery])

  const railContent: Partial<Record<GisRailKey, ReactNode>> = {
    sensor: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {dashboardSensors.map((sensor) => (
          <li key={sensor.id} className="flex items-center justify-between gap-2 py-2 text-xs">
            <div>
              <p className="font-medium text-white/80">{sensor.name}</p>
              <p className="text-white/35">{sensor.location}</p>
            </div>
            <RiskBadge level={sensor.status} label={sensor.value} />
          </li>
        ))}
      </ul>
    ),
    broadcast: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {recentActions.map((action) => (
          <li key={action.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-white/80">{action.title}</p>
              <span className="shrink-0 text-white/35">{action.time}</span>
            </div>
            <p className="mt-0.5 text-white/35">
              {action.owner} · {action.note}
            </p>
          </li>
        ))}
      </ul>
    ),
    response: (
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold text-white/40">기관별 대응 상태</p>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {agencyStatuses.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <p className="text-white/80">{agency.agency}</p>
                <span className={agency.status === "down" ? "text-risk-danger" : "text-risk-safe"}>
                  {agency.status === "down" ? "⚠ 장애" : "● 연결"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold text-white/40">현장 대응팀</p>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {disasterResponseTeams.map((team) => (
              <li key={team.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <p className="text-white/80">{team.name}</p>
                <RiskBadge level={team.status === "출동중" ? "info" : "offline"} label={team.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
    contact: <DutyContactPanel />,
    // 자산현황(대피소) 우선 주석처리 — 대시보드 맥락과 안 맞아 임시 비활성화, DASHBOARD_RAIL_ITEMS에서도 제외됨
    // asset: (
    //   <ul className="flex flex-col gap-2">
    //     {shelters.map((shelter) => (
    //       <li key={shelter.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
    //         <div className="flex items-center justify-between gap-2">
    //           <p className="font-medium text-white/80">{shelter.name}</p>
    //           <RiskBadge level="safe" label={shelter.status} />
    //         </div>
    //         <p className="mt-1 text-white/35">{shelter.address}</p>
    //         <p className="mt-1 text-white/50">
    //           수용 {shelter.currentOccupancy} / {shelter.capacity}명
    //         </p>
    //       </li>
    //     ))}
    //   </ul>
    // ),
    report: (
      <div className="flex flex-col gap-2 text-xs">
        <p className="text-white/50">종료된 사건의 상세 보고서를 조회합니다.</p>
        <Link
          to="/reports"
          className="inline-flex items-center justify-center rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent-soft"
        >
          이력·보고서 전체 조회 →
        </Link>
      </div>
    ),
    timeline: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {disasterIncidents.map((incident) => (
          <li key={incident.id} className="py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <RiskBadge level={incident.severity} />
              <p className="font-medium text-white/80">
                [{incident.type}] {incident.title}
              </p>
            </div>
            <p className="mt-0.5 text-white/35">
              {incident.region} · {incident.status}
            </p>
          </li>
        ))}
      </ul>
    ),
  }

  const timelineFilters = (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <select
          value={timelineType}
          onChange={(e) => setTimelineType(e.target.value)}
          className="flex-1 rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/70"
        >
          <option value="all">전체</option>
          {incidentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={timelineQuery}
          onChange={(e) => setTimelineQuery(e.target.value)}
          placeholder="검색"
          className="w-24 rounded-md border border-border-subtle bg-inset px-2 py-1 text-[11px] text-white/70 placeholder:text-white/30"
        />
      </div>
      <p className="text-[10px] text-white/30">{timelineDateRange}</p>
      <div className="flex gap-3 text-[11px] text-white/60">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showIssued} onChange={(e) => setShowIssued(e.target.checked)} className="accent-[var(--color-accent)]" />
          발령
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showLifted} onChange={(e) => setShowLifted(e.target.checked)} className="accent-[var(--color-accent)]" />
          해제
        </label>
      </div>
    </div>
  )

  const timelineTabs: GisTimelineTab[] = [
    {
      key: "timeline",
      label: "타임라인",
      content: (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {filteredIncidents.length === 0 && <li className="py-4 text-center text-xs text-white/30">조건에 맞는 항목이 없습니다.</li>}
          {filteredIncidents.map((incident) => (
            <li key={incident.id} className="py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white/60">{formatHM(incident.reportedAt)}</span>
                <RiskBadge level={incident.status === "종료" ? "offline" : "safe"} label={incident.status === "종료" ? "해제" : "발령"} solid />
              </div>
              <p className="mt-1 flex items-center gap-1.5">
                <RiskBadge level={incident.severity} label={incident.type} />
              </p>
              <p className="mt-0.5 text-white/80">{incident.title}</p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "advisory",
      label: "발효중 특보",
      content: (
        <ul className="flex flex-col gap-2">
          {filteredAlerts.length === 0 && <li className="py-4 text-center text-xs text-white/30">조건에 맞는 항목이 없습니다.</li>}
          {filteredAlerts.map((alert) => {
            const lifted = alert.expiresAt <= currentWeather.observedAt
            return (
              <li key={alert.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <RiskBadge level={lifted ? "offline" : "safe"} label={lifted ? "해제" : "발령"} solid />
                  <span className="text-white/35">
                    {formatHM(alert.issuedAt)}~{formatHM(alert.expiresAt)}
                  </span>
                </div>
                <p className="mt-1.5">
                  <RiskBadge level={alert.level} label={alert.title} />
                </p>
                <p className="mt-1.5 text-white/50">
                  {alert.target} · {alert.message}
                </p>
              </li>
            )
          })}
        </ul>
      ),
    },
    {
      key: "forecast",
      label: "동네예보",
      content: <VilageForecastPanel />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">GIS 통합 대시보드</h1>
          <p className="text-xs text-white/35">데이터 최종 수신: {lastSyncedAt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {alertSummary.map(({ level, count }) => (
              <div
                key={level}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${riskStyles[level].bg} ${riskStyles[level].border}`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${riskStyles[level].dot}`} />
                <span className={`text-sm font-bold tabular-nums ${riskStyles[level].text}`}>{count}</span>
                <span className="text-[11px] text-white/40">{riskStyles[level].label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Link
              to="/monitoring"
              className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
            >
              시스템 모니터링
            </Link>
            <Link
              to="/reports"
              className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
            >
              이력·보고서
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1.5 border-b border-border-subtle pb-3">
        {TOP_TABS.map((tab) => (
          <Pill key={tab.key} active={topTab === tab.key} onClick={() => setTopTab(tab.key)}>
            {tab.label}
          </Pill>
        ))}
      </nav>

      {topTab === "cctv" && (
        <Card
          title="CCTV 통합 조회"
          subtitle={`도 자체관제 약 ${(cctvCoverageSummary.ownOperatedTotal / 10000).toFixed(1)}만대 · 불법주정차 포함 약 ${(
            cctvCoverageSummary.includingIllegalParkingTotal / 10000
          ).toFixed(1)}만대 · 자치경찰단 ITS ${cctvCoverageSummary.itsLinkedCount}/${cctvCoverageSummary.itsTotalCount}대만 연계 (대표 ${
            cctvCoverageSummary.representativeCount
          }대 표시)`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={cctvQuery}
                onChange={(e) => setCctvQuery(e.target.value)}
                placeholder="주소 또는 카메라명 검색"
                className="w-48 rounded-full border border-border-subtle bg-inset px-3 py-1.5 text-xs text-white/80 placeholder:text-white/30 focus:border-accent focus:outline-none"
              />
              <div className="flex gap-1.5">
                {CCTV_DOMAIN_FILTERS.map((f) => (
                  <Pill key={f.id} size="sm" active={cctvDomain === f.id} onClick={() => setCctvDomain(f.id)}>
                    {f.label}
                  </Pill>
                ))}
              </div>
            </div>
          }
        >
          {filteredCameras.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCameras.map((camera) => (
                <CctvCameraCard key={camera.id} camera={camera} />
              ))}
            </div>
          )}
        </Card>
      )}

      {topTab === "summary" && (
        <>
          <Card title="AI 분석 근거 및 데이터 출처" subtitle={`예측 신뢰도: 고신뢰 (${predictionConfidence.percent}%)`}>
            <ul className="flex flex-col gap-3">
              {aiInsights.map((insight) => (
                <li key={insight.id} className="rounded-lg border border-border-subtle bg-inset p-3">
                  <p className="text-sm font-semibold text-white/80">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{insight.basis}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-border-subtle p-3 text-xs text-white/50">
              <p className="font-semibold text-white/70">센서 이상 교차검증</p>
              <p className="mt-1">
                정상 {sensorCrossCheck.normal} / 장애 {sensorCrossCheck.fault} / 누락 {sensorCrossCheck.missing}
              </p>
              <p className="mt-1 text-white/35">장애·누락 데이터는 위험 경보와 별도 표시됩니다.</p>
            </div>
          </Card>

          <Card title="센서 시계열 검증 — 강우·수위·해양" subtitle="최근 6시간">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {timeSeries.map((reading) => {
                const over =
                  reading.worseWhen === "below" ? reading.value <= reading.threshold : reading.value >= reading.threshold
                return (
                  <div key={reading.label} className="rounded-lg border border-border-subtle bg-inset p-3">
                    <p className="text-xs font-medium text-white/40">{reading.label}</p>
                    <p className={`mt-1 text-lg font-bold ${over ? "text-risk-warning" : "text-white"}`}>
                      {reading.value}
                      {reading.unit}
                    </p>
                    <p className="text-[11px] text-white/35">
                      기준 {reading.threshold}
                      {reading.unit}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sixHourSeries} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
                  <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
                  <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
                  <Line type="monotone" dataKey="돈내코수위" stroke="#0054a3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="쇠소깍수위" stroke="#8ec21f" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="함덕수온" stroke="#f2731a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            title="상황 전파 · 보고체계"
            subtitle="도청 → 시 상황실 → 읍면동 순차 전파 현황"
            action={
              <Link
                to="/propagation"
                className="rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
              >
                전체 보기 →
              </Link>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {sequentialPropagation.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-center">
                    <p className="text-xs font-semibold text-white/80">{step.stage}</p>
                    <p className="text-[11px] text-white/40">{step.time}</p>
                  </div>
                  {i < sequentialPropagation.length - 1 && (
                    <span className="text-xs text-risk-warning">
                      →{" "}
                      {(() => {
                        const [h1, m1] = step.time.split(":").map(Number)
                        const [h2, m2] = sequentialPropagation[i + 1].time.split(":").map(Number)
                        return h2 * 60 + m2 - (h1 * 60 + m1)
                      })()}
                      분 지연
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
              목표: {simultaneousPropagationGoal.note} — {simultaneousPropagationGoal.status}
            </div>
          </Card>
        </>
      )}

      {topTab === "gis" && (
      <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title="위험 위치 및 영향 범위 — 제주 전역 GIS"
          subtitle={`기온 ${currentWeather.temperatureC}℃ · 강수 ${currentWeather.rainfallMm}mm · 풍속 ${currentWeather.windSpeedMs}m/s · 습도 ${currentWeather.humidityPercent}% · 갱신 ${formatHM(currentWeather.observedAt)} / 5분 주기`}
          action={
            <div className="flex gap-1.5">
              {MAP_DOMAIN_FILTERS.map((f) => (
                <Pill key={f.id} size="sm" active={mapDomain === f.id} onClick={() => setMapDomain(f.id)}>
                  {f.label}
                </Pill>
              ))}
            </div>
          }
          className="xl:col-span-2"
        >
          <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
            <JejuTileMap markers={filteredMarkers} cctvMarkers={cctvCameras} className="relative h-full w-full" />
            <GisIconRail
              activeKey={activeRailKey}
              onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))}
              items={DASHBOARD_RAIL_ITEMS}
            />
            {activeRailKey && (
              <GisSidePanel activeKey={activeRailKey} onClose={() => setActiveRailKey(null)} content={railContent} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="font-semibold text-white/30">범례</span>
            <RiskBadge level="danger" />
            <RiskBadge level="alert" />
            <RiskBadge level="warning" />
            <RiskBadge level="caution" />
            <RiskBadge level="safe" />
          </div>
        </Card>

        <Card title="타임라인" className="flex flex-col">
          <div className="h-[560px]">
            <GisTimelinePanel tabs={timelineTabs} filters={timelineFilters} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {serviceStatusCards.map((card) => (
          <ServiceStatusCard key={card.id} card={card} />
        ))}
      </div>
      </>
      )}
    </div>
  )
}
