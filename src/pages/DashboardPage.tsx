import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../components/ui/Card"
import { KpiCard } from "../components/ui/KpiCard"
import { JejuRiskMap } from "../components/ui/JejuRiskMap"
import { MapToolbox } from "../components/ui/MapToolbox"
import { RiskBadge } from "../components/ui/RiskBadge"
import { WeatherTimeline } from "../components/ui/WeatherTimeline"
import type { RiskMarker } from "../types/domain"
import {
  agencyStatuses,
  aiInsights,
  dashboardSensors,
  kpiCards,
  lastSyncedAt,
  predictionConfidence,
  recentActions,
  riskMarkers,
  sensorCrossCheck,
  sixHourSeries,
  timeSeries,
  weatherTimeline,
  weatherTimelineNow,
} from "../data/mockDashboard"

const AGENCY_STATUS_LABEL: Record<(typeof agencyStatuses)[number]["status"], string> = {
  connected: "● 연결",
  delayed: "⚠ 지연",
  down: "⚠ 장애",
}

const MAP_DOMAIN_FILTERS: { id: RiskMarker["domain"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "양식장" },
]

export function DashboardPage() {
  const [mapDomain, setMapDomain] = useState<RiskMarker["domain"] | "all">("all")
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.id} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title="위험 위치 및 영향 범위 — 제주 전역 GIS"
          subtitle="레이어: 강우·수위·해류 · 갱신 09:47 / 5분 주기"
          className="xl:col-span-2"
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
          <div className="relative">
            <MapToolbox />
            <JejuRiskMap markers={filteredMarkers} />
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
      </div>

      <Card title="기상 타임라인" subtitle="강우·해양 위험 강도 추이 (최근 관측 기준)">
        <WeatherTimeline points={weatherTimeline} now={weatherTimelineNow} />
      </Card>

      <Card title="센서 정보" subtitle="관측소별 실시간 값">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {dashboardSensors.map((sensor) => (
            <li key={sensor.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <p className="font-medium text-white/80">{sensor.name}</p>
                <p className="text-xs text-white/35">
                  {sensor.type} · {sensor.location}
                </p>
              </div>
              <div className="text-right">
                <RiskBadge level={sensor.status} label={sensor.value} />
                <p className="mt-1 text-[11px] text-white/35">최종 갱신 {sensor.updatedAt}</p>
              </div>
            </li>
          ))}
        </ul>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="기관별 대응 상태">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {agencyStatuses.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-white/80">{agency.agency}</p>
                  <p className="text-xs text-white/35">{agency.role}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${agency.status === "down" ? "text-risk-danger" : "text-risk-safe"}`}
                  >
                    {AGENCY_STATUS_LABEL[agency.status]}
                  </p>
                  <p className="text-[11px] text-white/35">{agency.lastAction}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="최근 승인·조치 사건"
          action={
            <Link to="/reports" className="text-xs font-semibold text-white/50 hover:text-accent">
              전체 이력 조회 →
            </Link>
          }
        >
          <ul className="flex flex-col divide-y divide-border-subtle">
            {recentActions.map((action) => (
              <li key={action.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white/80">{action.title}</p>
                  <span className="shrink-0 text-xs text-white/35">{action.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-white/35">
                  담당: {action.owner} · {action.note}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
