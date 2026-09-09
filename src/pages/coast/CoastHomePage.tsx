import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { GisIconRail, type GisRailKey } from "../../components/ui/GisIconRail"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { GisTimelinePanel, type GisTimelineTab } from "../../components/ui/GisTimelinePanel"
import { DutyContactPanel } from "../../components/ui/DutyContactPanel"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { COAST_NAV } from "./coastNav"
import {
  coastAgencyStatuses,
  coastAiInsights,
  coastEventDetail,
  coastEvents,
  coastFieldAlerts,
  coastSafetyAssets,
  coastSummary,
} from "../../data/mockCoast"
import { riskMarkers } from "../../data/mockDashboard"
import { cctvCameras } from "../../data/mockCctv"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import { COAST_TYPE_LABEL } from "../../types/coast"

const COAST_CCTV = cctvCameras.filter((c) => c.domain === "coast")

const RAIL_CONTENT: Partial<Record<GisRailKey, ReactNode>> = {
  sensor: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {coastEventDetail.sensorCrossCheck.map((sensor) => (
        <li key={sensor.id} className="flex items-center justify-between gap-2 py-2 text-xs">
          <p className="text-white/80">{sensor.name}</p>
          <span className={sensor.status === "정상" ? "text-risk-safe" : "text-risk-warning"}>{sensor.status}</span>
        </li>
      ))}
    </ul>
  ),
  broadcast: (
    <ul className="flex flex-col gap-2">
      {coastFieldAlerts.map((alert) => (
        <li key={alert.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <RiskBadge level={alert.level} label={alert.location} />
            <span className="text-white/35">{alert.time}</span>
          </div>
          <p className="mt-1 text-white/50">{alert.detail}</p>
        </li>
      ))}
    </ul>
  ),
  response: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {coastAgencyStatuses.map((agency) => (
        <li key={agency.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{agency.agency}</p>
            <RiskBadge level={agency.level} label={agency.status} />
          </div>
          <p className="mt-0.5 text-white/35">{agency.detail}</p>
        </li>
      ))}
    </ul>
  ),
  asset: (
    <ul className="flex flex-col gap-2">
      {coastSafetyAssets.map((asset) => (
        <li key={asset.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{asset.name}</p>
            <span className={asset.status === "정상" ? "text-risk-safe" : "text-risk-danger"}>{asset.status}</span>
          </div>
          <p className="mt-1 text-white/35">
            {asset.location} · {asset.detail}
          </p>
        </li>
      ))}
    </ul>
  ),
  timeline: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {coastEvents.map((event) => (
        <li key={event.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white/60">{event.time}</span>
            <RiskBadge level={event.level} />
          </div>
          <p className="mt-0.5 text-white/80">{event.type}</p>
          <p className="text-white/35">{event.location}</p>
        </li>
      ))}
    </ul>
  ),
  contact: <DutyContactPanel domain="coast" />,
}

const TIMELINE_TABS: GisTimelineTab[] = [
  {
    key: "timeline",
    label: "타임라인",
    content: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {coastEvents.map((event) => (
          <li key={event.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white/60">{event.time}</span>
              <RiskBadge level={event.level} label={event.status} />
            </div>
            <p className="mt-0.5 text-white/80">{event.type}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: "field",
    label: "현장 경보",
    content: (
      <ul className="flex flex-col gap-2">
        {coastFieldAlerts.map((alert) => (
          <li key={alert.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <RiskBadge level={alert.level} label={alert.location} />
              <span className="text-white/35">{alert.time}</span>
            </div>
            <p className="mt-1.5 text-white/50">{alert.detail}</p>
          </li>
        ))}
      </ul>
    ),
  },
]

export function CoastHomePage() {
  const coastMarkers = riskMarkers.filter((m) => m.domain === "coast")
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)

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

      <Card
        title="실측 파고·기상 참고 — 국립해양조사원(KHOA) 해양관측부이"
        subtitle="함덕·삼양·협재 AIoT 스마트폴과는 다른 국가 관측망 지점 — 인근 해역 파고·풍속 참고용"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {khoaBuoyMarineConditions.map((buoy) => (
            <div key={buoy.id} className="rounded-lg border border-border-subtle p-3">
              <p className="text-sm font-semibold text-white/80">{buoy.stationName}</p>
              <p className="mt-0.5 text-[11px] text-white/35">{buoy.stationCode}</p>
              <p className="mt-2 text-lg font-bold text-white">
                파고 {buoy.waveHeightM.toFixed(2)}m <span className="text-sm font-normal text-white/40">· 주기 {buoy.wavePeriodSec}s</span>
              </p>
              <p className="mt-1 text-xs text-white/40">
                풍속 {buoy.windSpeedMs}m/s · 기압 {buoy.pressureHpa}hPa
              </p>
              <p className="mt-1 text-[11px] text-white/35">관측 {buoy.observedAt}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/35">data.go.kr 공공API 실연동 — 정적 프로토타입이라 확인 시점 스냅샷으로 고정 표시</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="GIS 연안 위험 지도" subtitle="지도 기준시각 14:30" className="xl:col-span-2">
          <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
            <JejuTileMap markers={coastMarkers} cctvMarkers={COAST_CCTV} className="relative h-full w-full" />
            <GisIconRail activeKey={activeRailKey} onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))} />
            {activeRailKey && (
              <GisSidePanel activeKey={activeRailKey} onClose={() => setActiveRailKey(null)} content={RAIL_CONTENT} />
            )}
            <GisTimelinePanel tabs={TIMELINE_TABS} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="font-semibold text-white/30">범례</span>
            <RiskBadge level="danger" />
            <RiskBadge level="alert" />
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
