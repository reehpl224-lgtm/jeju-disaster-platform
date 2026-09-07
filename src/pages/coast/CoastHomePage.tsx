import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuRiskMap } from "../../components/ui/JejuRiskMap"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { COAST_NAV } from "./coastNav"
import { coastAgencyStatuses, coastAiInsights, coastEvents, coastFieldAlerts, coastSummary } from "../../data/mockCoast"
import { riskMarkers } from "../../data/mockDashboard"
import { COAST_TYPE_LABEL } from "../../types/coast"

export function CoastHomePage() {
  const coastMarkers = riskMarkers.filter((m) => m.domain === "coast")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">연안 관제 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">마지막 갱신: {coastSummary.lastUpdated}</p>
      </div>

      <DomainSubNav items={COAST_NAV} />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-white/35">실증 대상지</p>
            <p className="mt-0.5 font-medium text-white/80">{coastSummary.targetArea}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-white/35">신설 인프라</p>
            <p className="mt-0.5 font-medium text-white/80">{coastSummary.infra}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">AI 탐지 라벨</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {coastSummary.aiLabels.map((label) => (
                <code key={label} className="rounded bg-inset px-1.5 py-0.5 text-[11px] text-accent">
                  {label}
                </code>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-risk-caution/30 bg-risk-caution-bg px-3 py-2 text-xs text-risk-caution">
          ⚠ {coastSummary.permitNote}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-white/40">활성 위험 이벤트</p>
          <p className="mt-1 text-xl font-bold text-risk-danger">{coastSummary.activeEvents.count}</p>
          <p className="mt-1 text-xs text-white/35">{coastSummary.activeEvents.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">미확인 이벤트</p>
          <p className="mt-1 text-xl font-bold text-risk-warning">{coastSummary.unconfirmedEvents.count}</p>
          <p className="mt-1 text-xs text-white/35">{coastSummary.unconfirmedEvents.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">공조 진행</p>
          <p className="mt-1 text-xl font-bold text-risk-info">{coastSummary.coordination.count}</p>
          <p className="mt-1 text-xs text-white/35">{coastSummary.coordination.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">장비 연결 상태</p>
          <p className="mt-1 text-xl font-bold text-risk-safe">
            정상 {coastSummary.equipment.normal} / 오류 {coastSummary.equipment.error}
          </p>
          <p className="mt-1 text-xs text-white/35">{coastSummary.equipment.detail}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="GIS 연안 위험 지도" subtitle="지도 기준시각 14:30" className="xl:col-span-2">
          <JejuRiskMap markers={coastMarkers} />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="font-semibold text-white/30">범례</span>
            <RiskBadge level="danger" />
            <RiskBadge level="warning" />
            <RiskBadge level="caution" />
            <RiskBadge level="safe" />
            <RiskBadge level="info" label="공조 진행" />
          </div>
        </Card>

        <Card title="AI 판단 근거 요약">
          <ul className="flex flex-col gap-3">
            {coastAiInsights.map((insight) => (
              <li key={insight.id} className="rounded-lg border border-border-subtle bg-inset p-3">
                <RiskBadge level={insight.level} solid />
                <p className="mt-2 text-sm font-semibold text-white/85">{insight.title}</p>
                <p className="mt-1 text-xs text-white/40">{insight.basis}</p>
                <p className="text-xs text-white/40">{insight.match}</p>
                <Link to="/coast/events" className="mt-2 inline-block text-xs font-bold text-accent">
                  이벤트 상세 검토 →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="위험 이벤트 목록" action={<Link to="/coast/events" className="text-xs font-semibold text-white/50 hover:text-accent">전체 보기 →</Link>}>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {coastEvents.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <RiskBadge level={event.level} solid />
                <div>
                  <p className="font-medium text-white/85">
                    {event.type}{" "}
                    <code className="ml-1 rounded bg-inset px-1 py-0.5 text-[10px] text-accent">
                      {COAST_TYPE_LABEL[event.type] ?? "-"}
                    </code>
                  </p>
                  <p className="text-xs text-white/35">
                    {event.source} · {event.location}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-white/40">
                <p>{event.time}</p>
                <p>{event.status}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="현장 경보 발령 현황">
          <ul className="flex flex-col gap-2.5">
            {coastFieldAlerts.map((alert) => (
              <li key={alert.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
                <div className="flex items-center gap-2">
                  <RiskBadge level={alert.level} />
                  <p className="text-sm font-medium text-white/80">{alert.location}</p>
                </div>
                <div className="text-right text-xs text-white/40">
                  <p>{alert.time}</p>
                  <p>{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="관계기관 공조 상태" action={<Link to="/coast/dispatch" className="text-xs font-semibold text-white/50 hover:text-accent">공조 상세 검토 →</Link>}>
          <ul className="flex flex-col gap-2.5">
            {coastAgencyStatuses.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
                <p className="text-sm font-medium text-white/80">{agency.agency}</p>
                <div className="text-right">
                  <RiskBadge level={agency.level} label={agency.status} />
                  <p className="mt-1 text-xs text-white/35">{agency.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
