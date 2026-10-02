import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { LIVE } from "../../components/ui/dataSource"
import { LeaderDetailBrief } from "../domain/LeaderBrief"
import { riverBrief } from "../domain/leaderBriefs"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { GisIconRail } from "../../components/ui/GisIconRail"
import type { GisRailKey } from "../../components/ui/gisRailItems"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { GisTimelinePanel, type GisTimelineTab } from "../../components/ui/GisTimelinePanel"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { RainfallObservationPanel } from "../../components/ui/RainfallObservationPanel"
import { WarningsPanel } from "../../components/ui/WarningsPanel"
import { DutyContactPanel } from "../../components/ui/DutyContactPanel"
import {
  riverApprovalHistory,
  riverControlRows,
  riverControlTimeline,
  riverInfra,
  riverJointAgencies,
  riverRiskBasis,
  riverSensorCheck,
  riverSopStage,
  riverStatuses,
  riverSuddenRainAlert,
  riverTarget,
  riverWaterLevelAiForecast,
} from "../../data/mockRiver"
import { riskMarkers } from "../../data/mockDashboard"
import { cctvCameras } from "../../data/mockCctv"
import { useRiverRun } from "../../data/riverRunHooks"
import { IS_SIMULATION_MODE } from "../../data/appEnv"

const RIVER_MARKERS = riskMarkers.filter((m) => m.domain === "river")
const RIVER_CCTV = cctvCameras.filter((c) => c.domain === "river")

const TIMELINE_EMPTY_NOTE = "시나리오를 시작하고 첫 시점을 진행하면 표시됩니다."

function TimelineList({ entries }: { entries: { id: string; time: string; title: string }[] }) {
  if (entries.length === 0) return <p className="py-4 text-center text-xs text-white/35">{TIMELINE_EMPTY_NOTE}</p>
  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 py-2 text-xs">
          <span className="w-10 shrink-0 text-white/35">{entry.time}</span>
          <p className="text-white/80">{entry.title}</p>
        </li>
      ))}
    </ul>
  )
}

export function RiverHomePage() {
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)
  // riverControlTimeline·riverApprovalHistory는 riverRunState.projectToMock()이 갱신하는 일반 배열이라
  // 이 훅으로 구독하지 않으면 시나리오가 진행돼도 이 화면이 다시 그려지지 않는다(§7-4).
  useRiverRun()

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
    broadcast: <TimelineList entries={riverApprovalHistory} />,
    timeline: <TimelineList entries={riverControlTimeline} />,
    contact: <DutyContactPanel domain="river" />,
  }

  const TIMELINE_TABS: GisTimelineTab[] = [
    { key: "timeline", label: "타임라인", content: <TimelineList entries={riverControlTimeline} /> },
    { key: "approval", label: "승인 이력", content: <TimelineList entries={riverApprovalHistory} /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">하천 범람 — 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">강우레이더·수위센서 기반 하천 범람 예측 및 경보</p>
      </div>

      <LeaderDetailBrief brief={riverBrief()} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="위험 위치 및 영향 범위 — 하천 GIS" subtitle="효돈천(돈내코·쇠소깍) 관측 지점" className="xl:col-span-2" dummy>
          <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
            <JejuTileMap markers={RIVER_MARKERS} cctvMarkers={RIVER_CCTV} className="relative h-full w-full" />
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

        <Card title="타임라인" dummy>
          <div className="h-[560px]">
            <GisTimelinePanel tabs={TIMELINE_TABS} />
          </div>
        </Card>
      </div>

      <Card
        title={IS_SIMULATION_MODE ? "시나리오 분석 — 모의 강우 참고" : "AI 예측 — 돌발 강우 조기경고"}
        subtitle={`감지 시각 ${riverSuddenRainAlert.detectedAt} · ${riverSuddenRainAlert.trendNote}`}
        dummy
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "모의 기준" : "기상청 예보"}</p>
            <p className="mt-1 text-lg font-bold text-white/70">{riverSuddenRainAlert.forecastMm}{IS_SIMULATION_MODE ? "mm/h" : "mm"}</p>
          </div>
          <span className="text-xl text-white/30">→</span>
          <div>
            <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "모의 강우" : "실측"}</p>
            <p className="mt-1 text-lg font-bold text-risk-warning">{riverSuddenRainAlert.observedMm}{IS_SIMULATION_MODE ? "mm/h" : "mm"}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            {IS_SIMULATION_MODE ? "시나리오 참고" : "AI 조기경고"} · 강우레이더 예측 {riverRiskBasis.radar.value} ({riverRiskBasis.radar.confidence})
          </span>
        </div>
        <p className="mt-3 text-xs text-white/50">{riverSuddenRainAlert.aiNote}</p>
        <Link to="/river/analysis" className="mt-3 inline-block text-xs font-bold text-accent">
          상황 분석에서 근거 데이터 자세히 보기 →
        </Link>
      </Card>

      <Card
        title={IS_SIMULATION_MODE ? "시나리오 분석 — Q% 변화 추세" : "AI 예측 — 수위 추이 조기경보"}
        subtitle={riverWaterLevelAiForecast.trendNote}
        dummy
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "변화" : "6시간 전 수위"}</p>
            <p className="mt-1 text-lg font-bold text-white/70">
              {IS_SIMULATION_MODE ? riverRiskBasis.waterLevel.trend : riverWaterLevelAiForecast.sixHourAgoM === null ? "-" : `${riverWaterLevelAiForecast.sixHourAgoM}m`}
            </p>
          </div>
          <span className="text-xl text-white/30">→</span>
          <div>
            <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "현재 Q%" : "현재 수위"}</p>
            <p className="mt-1 text-lg font-bold text-white/70">
              {IS_SIMULATION_MODE ? riverRiskBasis.waterLevel.value : riverWaterLevelAiForecast.currentM === null ? "-" : `${riverWaterLevelAiForecast.currentM}m`}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-safe bg-risk-safe-bg px-3 py-1 text-xs font-bold text-risk-safe">
            {riverWaterLevelAiForecast.status}
          </span>
        </div>
        <p className="mt-3 text-xs text-white/50">{riverWaterLevelAiForecast.aiNote}</p>
        <p className="mt-1 text-[11px] text-white/30">근거: {riverWaterLevelAiForecast.basis}</p>
      </Card>

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

      <Card title="실시간 우량 관측 — 기상청 API허브" subtitle="apihub.kma.go.kr 실연동(AWS 매분자료)" source={LIVE}>
        <RainfallObservationPanel />
      </Card>

      <Card title="기상청 단기예보" subtitle="강수확률·강수형태 참고 — 돌발 강우 조기경보와 함께 확인" source={LIVE}>
        <VilageForecastPanel />
      </Card>

      <Card title="실시간 호우특보 — 기상청 API허브" subtitle="apihub.kma.go.kr 실연동(wrn_met_data.php) — 하천 범람의 주 원인인 호우·강풍 특보" source={LIVE}>
        <WarningsPanel wrnCodes={["R", "W"]} />
      </Card>

      <Card title="하천 위험 요약" subtitle="카드를 누르면 해당 하천의 현장 통제 현황으로 이동합니다" dummy>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {riverStatuses.map((river) => (
            <Link
              key={river.id}
              to="/river/control"
              className="block rounded-lg border border-border-subtle p-4 transition hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white/85">{river.name}</p>
                <RiskBadge level={river.level} solid />
              </div>
              <p className="mt-2 text-xs text-white/40">경보 단계</p>
              <p className="text-sm font-semibold text-white/80">{river.stage}</p>
              <p className="mt-2 text-xs text-white/40">범람 예상 도달</p>
              <p className="text-sm font-semibold text-white/80">{river.eta}</p>
              <p className="mt-2 text-[11px] text-white/30">최종 업데이트 {river.updatedAt}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="경보 승인 이력" dummy>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {riverApprovalHistory.map((h) => (
              <li key={h.id} className="flex gap-3 py-2.5 text-sm">
                <span className="w-12 shrink-0 text-xs text-white/35">{h.time}</span>
                <p className="text-white/70">{h.title}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="e-SOP 단계 연결" dummy>
          <p className="text-sm font-semibold text-white/85">현재 적용 단계</p>
          <RiskBadge level={riverSopStage.level} label={riverSopStage.current} solid />
          <p className="mt-3 text-sm text-white/60">{riverSopStage.next}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["/river/alert", "경보 승인으로 이동"],
                ["/river/dispatch", "출동 승인으로 이동"],
              ] as const
            ).map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="inline-flex rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent-soft"
              >
                {label} →
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
