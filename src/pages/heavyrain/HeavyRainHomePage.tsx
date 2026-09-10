import { useState, type ReactNode } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { GisIconRail, GIS_RAIL_ITEMS, type GisRailKey } from "../../components/ui/GisIconRail"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { WarningsPanel } from "../../components/ui/WarningsPanel"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { HEAVY_RAIN_NAV } from "./heavyRainNav"
import { broadcastLog, heavyRainAiForecast, legacySystems, weatherStations } from "../../data/mockHeavyRain"
import { riskMarkers } from "../../data/mockDashboard"

const HEAVY_RAIN_MARKERS = riskMarkers.filter((m) => m.domain === "heavyRain")
// 호우는 담당자 연락처(DutyContact)·물리 자산현황 데이터가 아직 없어 두 항목은 레일에서 제외
const HEAVY_RAIN_RAIL_ITEMS = GIS_RAIL_ITEMS.filter((item) => item.key === "sensor" || item.key === "response" || item.key === "broadcast")

const LINK_STATUS_LEVEL: Record<(typeof legacySystems)[number]["linkStatus"], "safe" | "caution" | "offline"> = {
  "연계 진행중": "safe",
  "협의 중": "caution",
  "미연계": "offline",
}

const STATION_TYPE_LABEL: Record<(typeof weatherStations)[number]["type"], string> = {
  침수센서: "🌊",
  우량계: "🌧️",
  적설계: "❄️",
  풍속풍향계: "💨",
}

const RAIL_CONTENT: Partial<Record<GisRailKey, ReactNode>> = {
  sensor: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {weatherStations.map((station) => (
        <li key={station.id} className="flex items-center justify-between gap-2 py-2 text-xs">
          <p className="font-medium text-white/80">{station.name}</p>
          <RiskBadge level={station.status} label={station.value} />
        </li>
      ))}
    </ul>
  ),
  response: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {legacySystems.map((system) => (
        <li key={system.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{system.name}</p>
            <RiskBadge level={LINK_STATUS_LEVEL[system.linkStatus]} label={system.linkStatus} />
          </div>
          <p className="mt-0.5 text-white/35">{system.operator}</p>
        </li>
      ))}
    </ul>
  ),
  broadcast: (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {broadcastLog.map((entry) => (
        <li key={entry.id} className="py-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{entry.message}</p>
            <span className="shrink-0 text-white/35">{entry.time}</span>
          </div>
          <p className="text-white/35">{entry.channel}</p>
        </li>
      ))}
    </ul>
  ),
}

export function HeavyRainHomePage() {
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">호우 통합 현황</h1>
        <p className="mt-1 text-sm text-white/50">
          레거시 예·경보시스템 연계 현황 — 새 AI 예측이 아니라 기존 시스템을 컨트롤타워에 통합하는 1차년도 우선 과제
          (태풍은 <span className="text-white/70">별도 시스템</span>에서 관리)
        </p>
      </div>

      <DomainSubNav items={HEAVY_RAIN_NAV} />

      <Card title="위험 위치 및 관측망 — 호우 GIS" subtitle="침수경보·우량계 관측 지점">
        <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
          <JejuTileMap markers={HEAVY_RAIN_MARKERS} className="relative h-full w-full" />
          <GisIconRail
            activeKey={activeRailKey}
            onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))}
            items={HEAVY_RAIN_RAIL_ITEMS}
          />
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

      <Card title="실시간 강풍·호우 특보 — 기상청 API허브" subtitle="apihub.kma.go.kr 실연동(wrn_met_data.php)">
        <WarningsPanel wrnCodes={["R", "W"]} />
      </Card>

      <Card title="기상청 단기예보" subtitle="강수확률·강수형태 참고 — 돌발 강우 조기경보와 함께 확인">
        <VilageForecastPanel />
      </Card>

      <Card
        title="AI 침수 위험 조기경보"
        subtitle={`감지 시각 ${heavyRainAiForecast.detectedAt} · 우량계 실측 추이 기반`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {heavyRainAiForecast.stations.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <p className="text-[11px] font-medium text-white/40">{s.name}</p>
              <p className="text-base font-bold text-risk-warning">{s.observedMm}mm/h</p>
            </div>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            AI 조기경고 · 예보 {heavyRainAiForecast.forecastMm}mm/h 대비 초과
          </span>
        </div>
        <p className="mt-3 text-xs text-white/50">{heavyRainAiForecast.aiNote}</p>
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
          {heavyRainAiForecast.confirmNote}
        </div>
      </Card>

      <Card title="관측망 현황" subtitle="침수센서·우량계·적설계·풍속풍향계">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weatherStations.map((station) => (
            <div key={station.id} className="rounded-lg border border-border-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white/80">
                  <span className="mr-1" aria-hidden>
                    {STATION_TYPE_LABEL[station.type]}
                  </span>
                  {station.name}
                </p>
                <RiskBadge level={station.status} />
              </div>
              <p className="mt-2 text-lg font-bold text-white">{station.value}</p>
              <p className="mt-0.5 text-[11px] text-white/35">최종 수신 {station.updatedAt}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="자동통보 발송 이력" subtitle="재해문자전광판 · 자동음성통보">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {broadcastLog.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-white/80">{entry.message}</p>
                <p className="text-xs text-white/35">{entry.channel}</p>
              </div>
              <span className="shrink-0 text-xs text-white/35">{entry.time}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
