import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../components/ui/Card"
import { JejuRiskMap } from "../components/ui/JejuRiskMap"
import { MapToolbox } from "../components/ui/MapToolbox"
import { RiskBadge } from "../components/ui/RiskBadge"
import { ServiceStatusCard } from "../components/ui/ServiceStatusCard"
import { GisIconRail, type GisRailKey } from "../components/ui/GisIconRail"
import { GisSidePanel } from "../components/ui/GisSidePanel"
import { GisTimelinePanel } from "../components/ui/GisTimelinePanel"
import type { RiskMarker } from "../types/domain"
import {
  aiInsights,
  lastSyncedAt,
  predictionConfidence,
  riskMarkers,
  sensorCrossCheck,
  serviceStatusCards,
  sixHourSeries,
  timeSeries,
} from "../data/mockDashboard"
import { currentWeather } from "../data/mockIncidents"

const MAP_DOMAIN_FILTERS: { id: RiskMarker["domain"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "양식장" },
]

export function DashboardPage() {
  const [mapDomain, setMapDomain] = useState<RiskMarker["domain"] | "all">("all")
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)
  const filteredMarkers = useMemo(
    () => (mapDomain === "all" ? riskMarkers : riskMarkers.filter((m) => m.domain === mapDomain)),
    [mapDomain],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">GIS 통합 대시보드</h1>
          <p className="text-xs text-white/35">데이터 최종 수신: {lastSyncedAt}</p>
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

      <Card
        title="위험 위치 및 영향 범위 — 제주 전역 GIS"
        subtitle={`기온 ${currentWeather.temperatureC}℃ · 강수 ${currentWeather.rainfallMm}mm · 풍속 ${currentWeather.windSpeedMs}m/s · 습도 ${currentWeather.humidityPercent}% · 갱신 09:47 / 5분 주기`}
        action={
          <div className="flex gap-1.5">
            {MAP_DOMAIN_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMapDomain(f.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  mapDomain === f.id ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
          <JejuRiskMap markers={filteredMarkers} className="relative h-full w-full" />
          <MapToolbox />
          <GisIconRail activeKey={activeRailKey} onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))} />
          {activeRailKey && <GisSidePanel activeKey={activeRailKey} onClose={() => setActiveRailKey(null)} />}
          <GisTimelinePanel />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {serviceStatusCards.map((card) => (
          <ServiceStatusCard key={card.id} card={card} />
        ))}
      </div>

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
    </div>
  )
}
