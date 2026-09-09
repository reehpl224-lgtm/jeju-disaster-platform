import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { TYPHOON_NAV } from "./typhoonNav"
import { typhoonReports, typhoonSource } from "../../data/mockTyphoon"
import { riskMarkers } from "../../data/mockDashboard"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { TyphoonNameListPanel } from "../../components/ui/TyphoonNameListPanel"
import { TyphoonNowPanel } from "../../components/ui/TyphoonNowPanel"

const TYPHOON_MARKERS = riskMarkers.filter((m) => m.domain === "typhoon")

const STATUS_LEVEL: Record<(typeof typhoonReports)[number]["status"], "caution" | "warning" | "alert" | "safe"> = {
  예비특보: "caution",
  태풍주의보: "warning",
  태풍경보: "alert",
  "특보 해제": "safe",
}

export function TyphoonHomePage() {
  const latest = typhoonReports[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">태풍 정보</h1>
        <p className="mt-1 text-sm text-white/50">{typhoonSource.note}</p>
      </div>

      <DomainSubNav items={TYPHOON_NAV} />

      <Card title={latest.name} subtitle={`발표 ${latest.issuedAt}`}>
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={STATUS_LEVEL[latest.status]} label={latest.status} solid />
          <p className="text-sm text-white/70">{latest.location}</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">이동 속도</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.speedKmh}km/h</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">중심기압</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.pressureHpa}hPa</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">최대풍속</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.maxWindMs}m/s</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-white/35">관련 레거시 시스템: {typhoonSource.relatedLegacySystem}</p>
      </Card>

      <Card
        title="실측 해상 관측 참고 — 국립해양조사원(KHOA) 해양관측부이"
        subtitle="자체 관측장비 없음(기상청 발표 전량 수신)을 보완하는 실측 참고치 — 특보 판단은 기상청 공식 발표 기준을 따름"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {khoaBuoyMarineConditions.map((buoy) => (
            <div key={buoy.id} className="rounded-lg border border-border-subtle p-3">
              <p className="text-sm font-semibold text-white/80">{buoy.stationName}</p>
              <p className="mt-0.5 text-[11px] text-white/35">{buoy.stationCode}</p>
              <p className="mt-2 text-lg font-bold text-white">
                풍속 {buoy.windSpeedMs}m/s <span className="text-sm font-normal text-white/40">· {buoy.windDirDeg}°</span>
              </p>
              <p className="mt-1 text-xs text-white/40">
                기압 {buoy.pressureHpa}hPa · 파고 {buoy.waveHeightM.toFixed(2)}m
              </p>
              <p className="mt-1 text-[11px] text-white/35">관측 {buoy.observedAt}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/35">data.go.kr 공공API 실연동 — 정적 프로토타입이라 확인 시점 스냅샷으로 고정 표시</p>
      </Card>

      <Card title="기상청 단기예보" subtitle="풍속·강수 참고 — 태풍 특보 자체는 기상청 발표 기준">
        <VilageForecastPanel />
      </Card>

      <Card title="실시간 태풍 현황 — API허브" subtitle="apihub.kma.go.kr 실연동(typ_now.php) — 진행 중인 태풍이 없으면 정상적으로 빈 상태">
        <TyphoonNowPanel />
      </Card>

      <Card title="기상청 태풍 이름 목록 — API허브" subtitle="apihub.kma.go.kr 실연동(typ_lst.php)">
        <TyphoonNameListPanel />
      </Card>

      <Card title="접근 위치 — 태풍 GIS" subtitle="기상청 발표 기준 접근 방향(자체 관측망 없음 — 상징적 표시)">
        <div className="relative h-96 w-full overflow-hidden rounded-lg">
          <JejuTileMap markers={TYPHOON_MARKERS} className="relative h-full w-full" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span className="font-semibold text-white/30">범례</span>
          <RiskBadge level="danger" />
          <RiskBadge level="alert" />
          <RiskBadge level="warning" />
          <RiskBadge level="safe" />
        </div>
      </Card>

      <Card title="발표 이력" subtitle="기상청 발표 시각 역순">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {typhoonReports.map((report) => (
            <li key={report.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={STATUS_LEVEL[report.status]} label={report.status} />
                  <p className="font-medium text-white/85">{report.name}</p>
                </div>
                <p className="mt-1 text-xs text-white/40">{report.location}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {report.speedKmh}km/h · {report.pressureHpa}hPa · {report.maxWindMs}m/s
                </p>
              </div>
              <span className="shrink-0 text-xs text-white/35">{report.issuedAt}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
