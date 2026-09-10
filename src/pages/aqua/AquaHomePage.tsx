import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { GisIconRail, type GisRailKey } from "../../components/ui/GisIconRail"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { GisTimelinePanel, type GisTimelineTab } from "../../components/ui/GisTimelinePanel"
import { DutyContactPanel } from "../../components/ui/DutyContactPanel"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { MarineObservationPanel } from "../../components/ui/MarineObservationPanel"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import {
  aquaActionLog,
  aquaAgencyRows,
  aquaAlertDraft,
  aquaDataSources,
  aquaFarms,
  aquaJourneys,
  aquaSummary,
  khoaLiveObservations,
} from "../../data/mockAqua"
import { riskMarkers } from "../../data/mockDashboard"
import { cctvCameras } from "../../data/mockCctv"
import { classifyMarineRiskLevel } from "../../data/marineAlertThresholds"

const AQUA_MARKERS = riskMarkers.filter((m) => m.domain === "aqua")
const AQUA_CCTV = cctvCameras.filter((c) => c.domain === "aqua")

const RAIL_CONTENT: Partial<Record<GisRailKey, ReactNode>> = {
  sensor: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {aquaDataSources.map((source) => (
        <li key={source.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{source.name}</p>
            <RiskBadge
              level={source.status === "normal" ? "safe" : source.status === "error" ? "danger" : "warning"}
              label={source.status}
            />
          </div>
          <p className="mt-0.5 text-white/35">
            {source.detail} · 주기 {source.cycle}
          </p>
        </li>
      ))}
    </ul>
  ),
  response: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {aquaAgencyRows.map((row) => (
        <li key={row.id} className="py-2 text-xs">
          <p className="font-medium text-white/80">{row.agency}</p>
          <p className="mt-0.5 text-white/35">
            {row.role} · 승인 {row.approve} · 수행 {row.execute} · 수신 {row.receive}
          </p>
        </li>
      ))}
    </ul>
  ),
  asset: (
    <ul className="flex flex-col gap-2">
      <li className="text-[11px] text-white/35">대표 양식장 {aquaFarms.length}개소 (전체 {aquaSummary.affectedFarms.count}개소 중) · 전체 목록은 영향 양식장 페이지에서 확인</li>
      {aquaFarms.map((farm) => (
        <li key={farm.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{farm.name}</p>
            <RiskBadge level={farm.level} label={farm.riskType} />
          </div>
          <p className="mt-1 text-white/35">{farm.region}</p>
        </li>
      ))}
    </ul>
  ),
  broadcast: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {aquaAlertDraft.audit.map((entry) => (
        <li key={entry.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{entry.title}</p>
            <span className="shrink-0 text-white/35">{entry.time}</span>
          </div>
        </li>
      ))}
    </ul>
  ),
  timeline: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {aquaActionLog.map((entry) => (
        <li key={entry.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white/60">{entry.time}</span>
            <span className="text-white/40">{entry.status}</span>
          </div>
          <p className="mt-0.5 text-white/80">{entry.title}</p>
          <p className="text-white/35">{entry.owner} · {entry.action}</p>
        </li>
      ))}
    </ul>
  ),
  contact: <DutyContactPanel domain="aqua" />,
}

const TIMELINE_TABS: GisTimelineTab[] = [
  {
    key: "timeline",
    label: "타임라인",
    content: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {aquaActionLog.map((entry) => (
          <li key={entry.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white/60">{entry.time}</span>
              <span className="text-white/40">{entry.status}</span>
            </div>
            <p className="mt-0.5 text-white/80">{entry.title}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: "audit",
    label: "경보 이력",
    content: (
      <ul className="flex flex-col divide-y divide-border-subtle">
        {aquaAlertDraft.audit.map((entry) => (
          <li key={entry.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white/60">{entry.time}</span>
            </div>
            <p className="mt-0.5 text-white/80">{entry.title}</p>
          </li>
        ))}
      </ul>
    ),
  },
]

export function AquaHomePage() {
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">양식장 대응 — 저염분수·고수온</h1>
        <p className="mt-1 text-sm text-white/50">AI 하이브리드 예측 기반 저염분수·고수온 경보 및 양식장 e-SOP 대응</p>
      </div>

      <AquaSubNav />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-white/35">실증 대상지</p>
            <p className="mt-0.5 font-medium text-white/80">{aquaSummary.targetArea}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">공간 해상도 목표</p>
            <p className="mt-0.5 font-medium text-white/80">{aquaSummary.spatialResolution}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-white/35">저염분수 위험등급 임계값 (염분 단독 기준)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {aquaSummary.salinityLevels.map((level) => (
                <RiskBadge key={level.label} level={level.level} label={`${level.label} ${level.range}`} />
              ))}
            </div>
            <p className="mt-3 text-xs text-white/35">고수온 위험등급 임계값 (수온 단독 기준)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {aquaSummary.temperatureLevels.map((level) => (
                <RiskBadge key={level.label} level={level.level} label={`${level.label} ${level.range}`} />
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/50">⚠ {aquaSummary.combinedRuleNote}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">AI 탐지 라벨</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {aquaSummary.aiLabels.map((label) => (
                <code key={label} className="rounded bg-inset px-1.5 py-0.5 text-[11px] text-accent">
                  {label}
                </code>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-white/40">활성 위험</p>
          <p className="mt-1 text-xl font-bold text-risk-danger">{aquaSummary.activeRisk.count}건</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.activeRisk.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">승인 대기</p>
          <p className="mt-1 text-xl font-bold text-risk-warning">{aquaSummary.pendingApproval.count}건</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.pendingApproval.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">영향 양식장</p>
          <p className="mt-1 text-xl font-bold text-risk-caution">{aquaSummary.affectedFarms.count}개소</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.affectedFarms.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">데이터 품질</p>
          <p className="mt-1 text-xl font-bold text-risk-safe">{aquaSummary.dataQuality.percent}%</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.dataQuality.detail}</p>
        </Card>
      </div>

      <Card
        title="실시간 해양관측 — 국립해양조사원(KHOA) API"
        subtitle="data.go.kr 공공데이터 실연동 — 정적 프로토타입이라 2026-09-09 확인 시점 스냅샷으로 고정 표시"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {khoaLiveObservations.map((obs) => (
            <div key={obs.id} className="rounded-lg border border-border-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white/80">{obs.stationName}</p>
                <RiskBadge level={classifyMarineRiskLevel(obs.salinityPsu, obs.seaTempC)} />
              </div>
              <p className="mt-0.5 text-[11px] text-white/35">
                {obs.kind} · {obs.stationCode}
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                {obs.seaTempC.toFixed(2)}℃ <span className="text-sm font-normal text-white/40">· {obs.salinityPsu.toFixed(2)} psu</span>
              </p>
              {obs.currentSpeedCms != null && (
                <p className="mt-0.5 text-xs text-white/40">
                  유향 {obs.currentDirDeg}° · 유속 {obs.currentSpeedCms}cm/s
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-white/35">관측 {obs.observedAt}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="실시간 해양관측 — 기상청 API허브"
        subtitle="apihub.kma.go.kr 실연동(sea_obs.php) — 모슬포·협재 등 인근 지점 수온·풍속 (염분은 미제공, 위 KHOA 부이 참고)"
      >
        <MarineObservationPanel />
      </Card>

      <Card title="기상청 단기예보" subtitle="풍속·강수 참고 — 저염분수·고수온 경보 자체는 AI 하이브리드 예측 기준">
        <VilageForecastPanel />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="위험 위치 및 영향 범위 — 양식장 GIS" subtitle="한경·대정 육상양식장 관측 지점" className="xl:col-span-2">
          <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
            <JejuTileMap markers={AQUA_MARKERS} cctvMarkers={AQUA_CCTV} className="relative h-full w-full" />
            <GisIconRail activeKey={activeRailKey} onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))} />
            {activeRailKey && (
              <GisSidePanel activeKey={activeRailKey} onClose={() => setActiveRailKey(null)} content={RAIL_CONTENT} />
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

        <Card title="타임라인">
          <div className="h-[560px]">
            <GisTimelinePanel tabs={TIMELINE_TABS} />
          </div>
        </Card>
      </div>

      <Card title="대응 여정" subtitle={`최근 갱신 ${aquaSummary.lastUpdated}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {aquaJourneys.map((journey) => (
            <Link
              key={journey.id}
              to={journey.href}
              className="flex flex-col justify-between rounded-lg border border-border-subtle bg-inset p-4 transition hover:border-accent"
            >
              <div>
                <p className="text-sm font-semibold text-white/85">{journey.label}</p>
                <p className="mt-1 text-xs text-white/40">{journey.desc}</p>
              </div>
              <span className="mt-3 text-xs font-bold text-accent">여정 진입 →</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
