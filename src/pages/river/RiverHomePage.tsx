import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuRiskMap } from "../../components/ui/JejuRiskMap"
import { MapToolbox } from "../../components/ui/MapToolbox"
import { GisIconRail, type GisRailKey } from "../../components/ui/GisIconRail"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { GisTimelinePanel, type GisTimelineTab } from "../../components/ui/GisTimelinePanel"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import {
  riverApprovalHistory,
  riverControlRows,
  riverControlTimeline,
  riverInfra,
  riverJointAgencies,
  riverSensorCheck,
  riverSopStage,
  riverStatuses,
  riverTarget,
} from "../../data/mockRiver"
import { riskMarkers } from "../../data/mockDashboard"

const RIVER_MARKERS = riskMarkers.filter((m) => m.domain === "river")

const RAIL_CONTENT: Partial<Record<GisRailKey, ReactNode>> = {
  sensor: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {riverSensorCheck.map((sensor) => (
        <li key={sensor.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{sensor.name}</p>
            <span className={sensor.status === "정상" ? "text-risk-safe" : "text-risk-danger"}>{sensor.status}</span>
          </div>
          <p className="mt-0.5 text-white/35">
            {sensor.value} · {sensor.detail}
          </p>
        </li>
      ))}
    </ul>
  ),
  response: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {riverJointAgencies.map((agency) => (
        <li key={agency.id} className="flex items-center justify-between gap-2 py-2 text-xs">
          <p className="text-white/80">{agency.agency}</p>
          <span className="text-white/50">{agency.status}</span>
        </li>
      ))}
    </ul>
  ),
  asset: (
    <ul className="flex flex-col gap-2">
      {riverControlRows.map((row) => (
        <li key={row.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
          <p className="font-medium text-white/80">{row.river}</p>
          <p className="mt-0.5 text-white/35">{row.location}</p>
          <p className="mt-1 text-white/50">
            차단기 {row.gate} · 출동 {row.dispatch} · 수신 {row.ack}
          </p>
        </li>
      ))}
    </ul>
  ),
  broadcast: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {riverApprovalHistory.map((entry) => (
        <li key={entry.id} className="flex gap-3 py-2 text-xs">
          <span className="w-10 shrink-0 text-white/35">{entry.time}</span>
          <p className="text-white/80">{entry.title}</p>
        </li>
      ))}
    </ul>
  ),
  timeline: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {riverControlTimeline.map((entry) => (
        <li key={entry.id} className="flex gap-3 py-2 text-xs">
          <span className="w-10 shrink-0 text-white/35">{entry.time}</span>
          <p className="text-white/80">{entry.title}</p>
        </li>
      ))}
    </ul>
  ),
}

const TIMELINE_TABS: GisTimelineTab[] = [
  {
    key: "timeline",
    label: "타임라인",
    content: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {riverControlTimeline.map((entry) => (
          <li key={entry.id} className="flex gap-3 py-2 text-xs">
            <span className="w-10 shrink-0 text-white/35">{entry.time}</span>
            <p className="text-white/80">{entry.title}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: "approval",
    label: "승인 이력",
    content: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {riverApprovalHistory.map((entry) => (
          <li key={entry.id} className="flex gap-3 py-2 text-xs">
            <span className="w-10 shrink-0 text-white/35">{entry.time}</span>
            <p className="text-white/80">{entry.title}</p>
          </li>
        ))}
      </ul>
    ),
  },
]

export function RiverHomePage() {
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">하천 범람 — 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">강우레이더·수위센서 기반 하천 범람 예측 및 경보</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-white/35">실증 대상지</p>
            <p className="mt-0.5 font-medium text-white/80">{riverTarget.area}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">목표</p>
            <p className="mt-0.5 font-medium text-white/80">{riverTarget.accuracyGoal}</p>
            <p className="text-white/60">{riverTarget.leadTimeGoal}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">신설 인프라</p>
            <p className="mt-0.5 font-medium text-white/80">{riverInfra.newBuild.join(" · ")}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">AI 탐지 라벨</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {riverTarget.aiLabels.map((label) => (
                <code key={label} className="rounded bg-inset px-1.5 py-0.5 text-[11px] text-accent">
                  {label}
                </code>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="하천 위험 요약">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {riverStatuses.map((river) => (
            <div key={river.id} className="rounded-lg border border-border-subtle p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white/85">{river.name}</p>
                <RiskBadge level={river.level} solid />
              </div>
              <p className="mt-2 text-xs text-white/40">경보 단계</p>
              <p className="text-sm font-semibold text-white/80">{river.stage}</p>
              <p className="mt-2 text-xs text-white/40">범람 예상 도달</p>
              <p className="text-sm font-semibold text-white/80">{river.eta}</p>
              <p className="mt-2 text-[11px] text-white/30">최종 업데이트 {river.updatedAt}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="위험 위치 및 영향 범위 — 하천 GIS" subtitle="효돈천(돈내코·쇠소깍) 관측 지점">
        <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
          <JejuRiskMap markers={RIVER_MARKERS} className="relative h-full w-full" />
          <MapToolbox />
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
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="경보 승인 이력">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {riverApprovalHistory.map((h) => (
              <li key={h.id} className="flex gap-3 py-2.5 text-sm">
                <span className="w-12 shrink-0 text-xs text-white/35">{h.time}</span>
                <p className="text-white/70">{h.title}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="e-SOP 단계 연결">
          <p className="text-sm font-semibold text-white/85">현재 적용 단계</p>
          <RiskBadge level="danger" label={riverSopStage.current} solid />
          <p className="mt-3 text-sm text-white/60">{riverSopStage.next}</p>
          <Link
            to="/river/control"
            className="mt-4 inline-flex rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            e-SOP 단계 승인으로 이동 →
          </Link>
        </Card>
      </div>
    </div>
  )
}
