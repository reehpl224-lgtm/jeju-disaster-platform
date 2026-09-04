import { Link } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../components/ui/Card"
import { KpiCard } from "../components/ui/KpiCard"
import { JejuRiskMap } from "../components/ui/JejuRiskMap"
import { RiskBadge } from "../components/ui/RiskBadge"
import {
  agencyStatuses,
  aiInsights,
  kpiCards,
  lastSyncedAt,
  predictionConfidence,
  recentActions,
  riskMarkers,
  sensorCrossCheck,
  sixHourSeries,
  timeSeries,
} from "../data/mockDashboard"

const AGENCY_STATUS_LABEL: Record<(typeof agencyStatuses)[number]["status"], string> = {
  connected: "● 연결",
  delayed: "⚠ 지연",
  down: "⚠ 장애",
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">GIS 통합 대시보드</h1>
          <p className="text-xs text-slate-400">데이터 최종 수신: {lastSyncedAt}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/monitoring"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            시스템 모니터링
          </Link>
          <Link
            to="/reports"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
        >
          <JejuRiskMap markers={riskMarkers} />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">범례</span>
            <RiskBadge level="danger" />
            <RiskBadge level="warning" />
            <RiskBadge level="caution" />
            <RiskBadge level="safe" />
          </div>
        </Card>

        <Card title="AI 분석 근거 및 데이터 출처" subtitle={`예측 신뢰도: 고신뢰 (${predictionConfidence.percent}%)`}>
          <ul className="flex flex-col gap-3">
            {aiInsights.map((insight) => (
              <li key={insight.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">{insight.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{insight.basis}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-slate-100 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-600">센서 이상 교차검증</p>
            <p className="mt-1">
              정상 {sensorCrossCheck.normal} / 장애 {sensorCrossCheck.fault} / 누락 {sensorCrossCheck.missing}
            </p>
            <p className="mt-1 text-slate-400">장애·누락 데이터는 위험 경보와 별도 표시됩니다.</p>
          </div>
        </Card>
      </div>

      <Card title="센서 시계열 검증 — 강우·수위·해양" subtitle="최근 6시간">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {timeSeries.map((reading) => {
            const over = reading.value >= reading.threshold
            return (
              <div key={reading.label} className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-medium text-slate-400">{reading.label}</p>
                <p className={`mt-1 text-lg font-bold ${over ? "text-risk-warning" : "text-slate-800"}`}>
                  {reading.value}
                  {reading.unit}
                </p>
                <p className="text-[11px] text-slate-400">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="한천수위" stroke="#0284c7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="산지천수위" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="이호수온" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="기관별 대응 상태">
          <ul className="flex flex-col divide-y divide-slate-100">
            {agencyStatuses.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-700">{agency.agency}</p>
                  <p className="text-xs text-slate-400">{agency.role}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${agency.status === "down" ? "text-risk-danger" : "text-risk-safe"}`}
                  >
                    {AGENCY_STATUS_LABEL[agency.status]}
                  </p>
                  <p className="text-[11px] text-slate-400">{agency.lastAction}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="최근 승인·조치 사건" action={<Link to="/reports" className="text-xs font-semibold text-slate-500 hover:underline">전체 이력 조회 →</Link>}>
          <ul className="flex flex-col divide-y divide-slate-100">
            {recentActions.map((action) => (
              <li key={action.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-700">{action.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">{action.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
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
