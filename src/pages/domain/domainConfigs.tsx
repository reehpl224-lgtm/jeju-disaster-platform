import type { ReactNode } from "react"
import { Risk } from "../../components/board/BoardParts"
import { CollectionStatusBadge } from "../../components/ui/CollectionStatusBadge"
import { Box, Checks, DetailLink, Group, Kv, MiniChart, Note, Rows, St, Steps, Tl } from "../../components/board/PanelParts"
import { SOURCE_LABEL } from "../../components/board/panelStatus"
import { MarineObservationPanel } from "../../components/ui/MarineObservationPanel"
import { RainfallObservationPanel } from "../../components/ui/RainfallObservationPanel"
import { TyphoonNameListPanel } from "../../components/ui/TyphoonNameListPanel"
import { TyphoonNowPanel } from "../../components/ui/TyphoonNowPanel"
import { FireWeatherPanel, QuakePanel, SnowForecastPanel } from "../../components/ui/HazardLivePanels"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { WarningsPanel } from "../../components/ui/WarningsPanel"
import type { RiskLevel, RiskMarker } from "../../types/domain"
import * as HR from "../../data/mockHeavyRain"
import * as TY from "../../data/mockTyphoon"
import * as HT from "../../data/mockHeat"
import * as RV from "../../data/mockRiver"
import { IS_SIMULATION_MODE } from "../../data/appEnv"
import { riverFlowRatioAnalysis } from "../../data/riverFlowRatioAnalysis"
import { getRunState } from "../../data/riverRunState"
import * as AQ from "../../data/mockAqua"
import * as CO from "../../data/mockCoast"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import {
  aquaPlannedData,
  coastAlertChannels,
  coastInstallReview,
  coastSmsRelay,
  coastVerification,
  riverFieldAlertGoal,
} from "../../data/mockMeetingItems"
import { COAST_COMBINE_RULES } from "../../data/coastAlertThresholds"
import { KHOA_BUOY_SNAPSHOT, KHOA_OBS_SNAPSHOT, KHOA_TIDE_SNAPSHOT } from "../../components/ui/dataSource"
import { LeaderBoardBrief } from "./LeaderBrief"
import { aquaBrief, coastBrief, hazardBrief, heatBrief, heavyRainBrief, riverBrief, typhoonBrief } from "./leaderBriefs"
import { HAZARDS, type HazardId } from "../../data/mockHazards"
import { sampleShelters } from "../../data/placeholderSamples"
import { aquaAdvisories, type AdvisoryItem } from "../../data/aquaAdvisories"
import { coastalEcology, villageFisheries } from "../../data/aquaImpactTargets"
import { hazardNav } from "../hazard/hazardNav"
import { RiverForecastBlock, RiverPointsBlock, TideBlock } from "../dashboard/PilotBatchBlocks"
import { Buoys, Closure, DataSources, Dispatch, Events, Live, LiveBlock, Plans, RelatedCams, SampleNote, StageCriteria } from "./domainParts"
import { AQUA_NAV } from "../aqua/aquaNav"
import { COAST_NAV } from "../coast/coastNav"
import { HEAT_NAV } from "../heat/heatNav"
import { HEAVY_RAIN_NAV } from "../heavyrain/heavyRainNav"
import { RIVER_NAV } from "../river/riverNav"
import { TYPHOON_NAV } from "../typhoon/typhoonNav"

/**
 * 도메인 화면 6종의 클론 프레임 내용 — demo-10-clone/jeju/gen_domains.py를 앱 mock 데이터 직접 참조로 옮긴 것.
 * 좌측 세로 탭 = 앱 도메인 하위 메뉴 이름·순서 그대로. 각 탭은 그 앱 화면이 쓰는 데이터의 요약이고,
 * 승인·발송·출동 요청 같은 동작은 "상세 화면 →" 링크로 기존 화면에서 한다.
 * 실시간 API 패널(기상청 예보·특보·해양관측·우량 등)은 우측 "실시간 연동" 탭에 둔다.
 */

export interface DomainTab {
  key: string
  label: string
  /** 기존 상세 화면 경로 — 동작(승인·발송 등)은 거기서 한다 */
  to: string
  content: ReactNode
}
export interface DomainRightTab {
  key: string
  label: string
  content: ReactNode
}
export interface DomainConfig {
  id: string
  title: string
  mapDomain: RiskMarker["domain"]
  /** 우측 타임라인 상단 "특보 요약" — codes: 기상청 특보 종류, advisories: 기상청 외 기관 특보 */
  wrn: { codes?: string[]; advisories?: AdvisoryItem[] }
  headline: ReactNode
  tabs: DomainTab[]
  right: DomainRightTab[]
}

/**
 * 보드 좌측 탭을 도메인 메뉴 목록(xxxNav.ts)에서 만든다 — 상세 화면 사이드바(DomainSidebar)와 같은 목록을
 * 쓰므로 두 메뉴의 라벨·순서가 다시 어긋나지 않는다(2026-09-28). 첫 탭은 "대시보드"(상세 대시보드 요약),
 * 이어서 nav[1..]("홈" 제외) 순서 그대로. content는 경로(to)별로 넘긴다.
 */
function navTabs(nav: { to: string; label: string }[], home: ReactNode, content: Record<string, ReactNode>): DomainTab[] {
  const prefix = nav[0].to
  return [
    { key: "home", label: "대시보드", to: `${prefix}/dashboard`, content: home },
    ...nav.slice(1).map((item) => ({
      key: item.to.slice(prefix.length + 1),
      label: item.label,
      to: item.to,
      content: content[item.to] ?? <p className="s">상세 화면에서 확인하세요.</p>,
    })),
  ]
}

const LIVE_FORECAST = (
  <LiveBlock title="기상청 단기예보" note="실시간 연동 — 매 조회마다 호출">
    <VilageForecastPanel />
  </LiveBlock>
)
const liveWarnings = (codes: string[], title: string) => (
  <LiveBlock title={title} note="기상청 API허브 wrn_met_data — 최근 24시간 발표" simulated={IS_SIMULATION_MODE}>
    <WarningsPanel wrnCodes={codes} />
  </LiveBlock>
)
const LIVE_MARINE = (
  <LiveBlock title="실시간 해양관측" note="기상청 API허브 sea_obs — 파고·풍속·수온" simulated={IS_SIMULATION_MODE}>
    <MarineObservationPanel />
  </LiveBlock>
)
const LIVE_MARINE_COAST = (
  <LiveBlock title="실시간 해양관측" note="기상청 API허브 sea_obs — 함덕·협재 인근 지점만" simulated={IS_SIMULATION_MODE}>
    <MarineObservationPanel stationNames={["협재", "김녕"]} />
  </LiveBlock>
)

// ================================================================== 호우
export function heavyRainConfig(): DomainConfig {
  const f = HR.heavyRainAiForecast
  // 대시보드·상세 분석·데이터 수집 상세 화면이 모두 보여주는 관측소 목록 — 세 탭에서 같이 쓴다
  const stationList = (
    <ul className="plist">
      {HR.weatherStations.map((s) => (
        <li className="row-between" key={s.id}>
          <div>
            <p className="t">{s.name}</p>
            <p className="s">
              {s.type} · {s.updatedAt}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Risk level={s.status} label={s.value} />
            <CollectionStatusBadge status={s.collectionStatus} />
          </div>
        </li>
      ))}
    </ul>
  )
  const home = (
    <LeaderBoardBrief brief={heavyRainBrief()}>
      <Group title="관측소 현황" dummy>
        {stationList}
      </Group>
      <Group title="재해문자전광판·자동음성 송출" dummy>
        <Tl entries={HR.broadcastLog.map((b) => ({ time: b.time, title: `[${b.channel}] ${b.message}` }))} />
      </Group>
    </LeaderBoardBrief>
  )
  const analysis = (
    <>
      <Group title="강우 추이 (15분 간격)" dummy>
        <MiniChart
          data={HR.heavyRainTrend}
          keys={["rainfallMm", "cumulativeMm"]}
          colors={["#0054a3", "#f2731a"]}
          names={["15분 강우(mm)", "누적(mm)"]}
          xkey="time"
          refLine={{ y: f.forecastMm, label: `예보 ${f.forecastMm}mm/h` }}
        />
      </Group>
      <Group title="누적 강우 순위" dummy>
        <ul className="plist">
          {HR.heavyRainTopStations.map((t) => (
            <li className="row-between" key={t.rank}>
              <span>
                <b>{t.rank}</b> {t.stationName} <span className="s">{t.region}</span>
              </span>
              <span className="t">{t.cumulativeMm}mm</span>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="AI 조기경보 근거" dummy>
        <p className="pbox">{f.aiNote}</p>
        <Note tone="caution">{f.confirmNote}</Note>
      </Group>
      <Group title="관측망 근거 데이터" dummy>
        {stationList}
      </Group>
    </>
  )
  const ad = HR.heavyRainAlertDispatch
  const evs = [
    { icon: "🔔", time: ad.sentAt.slice(0, 5), lines: [ad.title, ad.target], badge: <Risk level="safe" label="발령" solid /> },
    {
      icon: "⚠",
      time: f.detectedAt,
      lines: [`실측 강우 예보(${f.forecastMm}mm/h) 초과 감지`, ...f.stations.map((s) => `${s.name} ${s.observedMm}mm/h`)],
      level: "warning" as RiskLevel,
    },
    ...HR.broadcastLog.map((b) => ({ icon: "📢", time: b.time, lines: [b.message], badge: <Risk level="offline" label={b.channel} /> })),
  ].sort((a, b) => b.time.localeCompare(a.time))
  return {
    id: "heavy-rain",
    title: "호우",
    mapDomain: "heavyRain",
    wrn: { codes: ["R", "W"] },
    headline: (
      <>
        ☔ 예보 <b>{f.forecastMm}mm/h</b> 초과 · 한천 침수센서 경보 발령
      </>
    ),
    tabs: navTabs(HEAVY_RAIN_NAV, home, {
      "/heavy-rain/data": (
        <>
          <DataSources s={dataSourcesByService.heavyRain} />
          <Group title="관측소 수집 현황" dummy>
            {stationList}
          </Group>
        </>
      ),
      "/heavy-rain/analysis": analysis,
      "/heavy-rain/alert": <Dispatch d={ad} />,
      "/heavy-rain/closure": <Closure c={HR.heavyRainClosure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      {
        key: "legacy",
        label: "연계 시스템",
        content: (
          <ul className="plist">
            {HR.legacySystems.map((s) => (
              <li key={s.id}>
                <div className="row-between">
                  <span className="t">{s.name}</span>
                  <St text={s.linkStatus} />
                </div>
                <p className="s">
                  {s.operator} · {s.note}
                </p>
              </li>
            ))}
          </ul>
        ),
      },
      {
        key: "live",
        label: "실시간 연동",
        content: (
          <Live>
            {liveWarnings(["R", "W"], "실시간 강풍·호우 특보")}
            <LiveBlock title="실시간 우량 관측" note="기상청 API허브 AWS 매분자료" simulated={IS_SIMULATION_MODE}>
              <RainfallObservationPanel />
            </LiveBlock>
            {LIVE_FORECAST}
          </Live>
        ),
      },
    ],
  }
}

// ================================================================== 태풍
export function typhoonConfig(): DomainConfig {
  const rp = TY.typhoonReports
  const cur = rp[0]
  const trk = TY.typhoonForecastTrack
  const typLevel = (status: string): RiskLevel => (status === "태풍경보" ? "alert" : status === "태풍주의보" ? "warning" : "caution")
  // 대시보드·경로 분석 상세 화면이 모두 보여주는 기상청 발표 이력 — 두 탭에서 같이 쓴다
  const reportHistory = (
    <Group title="발표 이력" dummy>
      <ul className="plist">
        {rp.map((r) => (
          <li className="row-between" key={r.id}>
            <span>
              {r.issuedAt.slice(5)} · {r.location}
            </span>
            <Risk level={typLevel(r.status)} label={r.status} />
          </li>
        ))}
      </ul>
    </Group>
  )
  const home = (
    <LeaderBoardBrief brief={typhoonBrief()}>
      {reportHistory}
      <Group title="해양관측부이 (KHOA)" source={KHOA_BUOY_SNAPSHOT}>
        <Buoys />
      </Group>
    </LeaderBoardBrief>
  )
  const analysis = (
    <>
      <Group title="예상 경로 — 제주와의 거리" dummy>
        <MiniChart
          data={trk.map((p) => ({ ...p, t: p.time.slice(5, 13).replace("-", "/") }))}
          keys={["distanceFromJejuKm", "maxWindMs"]}
          colors={["#f8390d", "#4f9be0"]}
          names={["제주까지 거리(km)", "최대풍속(m/s)"]}
          xkey="t"
        />
      </Group>
      <Group title="예상 경로" dummy>
        <ul className="plist">
          {trk.map((p) => (
            <li key={p.time}>
              <div className="row-between">
                <span className="t">{p.time.slice(5)}</span>
                <span className="t">
                  {p.distanceFromJejuKm}km · {p.maxWindMs}m/s
                </span>
              </div>
              <p className="s">{p.note}</p>
            </li>
          ))}
        </ul>
      </Group>
      {reportHistory}
      <Group title="관련 레거시 시스템">
        <p className="pbox">{TY.typhoonSource.relatedLegacySystem}</p>
      </Group>
    </>
  )
  const evs = rp.map((r) => ({
    icon: "🌀",
    time: r.issuedAt.slice(5),
    lines: [`기상청 발표 · ${r.name} · ${r.status}`, r.location, `↗ ${r.speedKmh}km/h · ✳ ${r.pressureHpa}hPa · ≈ ${r.maxWindMs}m/s`],
    badge: <Risk level="safe" label="발령" solid />,
  }))
  return {
    id: "typhoon",
    title: "태풍",
    mapDomain: "typhoon",
    wrn: { codes: ["T"] },
    headline: cur ? (
      <>
        🌀 <b>{cur.name}</b> · {cur.status}
        {trk[0] && <> · 제주까지 {trk[0].distanceFromJejuKm}km</>}
        {trk.length > 0 && <> · 최근접 {Math.min(...trk.map((p) => p.distanceFromJejuKm))}km 예상</>}
      </>
    ) : (
      <>🌀 발표 중인 태풍 없음</>
    ),
    tabs: navTabs(TYPHOON_NAV, home, {
      "/typhoon/data": (
        <>
          <DataSources s={dataSourcesByService.typhoon} />
          <Group title="관측망 현황">
            <p className="pbox">
              {TY.typhoonSource.note}
              <br />
              <span className="s">연계 레거시: {TY.typhoonSource.relatedLegacySystem}</span>
            </p>
          </Group>
        </>
      ),
      "/typhoon/analysis": analysis,
      "/typhoon/alert": <Dispatch d={TY.typhoonAlertDispatch} />,
      "/typhoon/closure": <Closure c={TY.typhoonClosure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      { key: "buoy", label: "해양 관측", content: <Buoys /> },
      {
        key: "live",
        label: "실시간 연동",
        content: (
          <Live>
            <LiveBlock title="실시간 태풍 현황" note="기상청 API허브 typ_now" simulated={IS_SIMULATION_MODE}>
              <TyphoonNowPanel />
            </LiveBlock>
            <LiveBlock title="태풍 이름 목록" note="기상청 API허브 typ_lst" simulated={IS_SIMULATION_MODE}>
              <TyphoonNameListPanel />
            </LiveBlock>
            {liveWarnings(["T"], "실시간 태풍 특보")}
            {LIVE_MARINE}
            {LIVE_FORECAST}
          </Live>
        ),
      },
    ],
  }
}

// ================================================================== 폭염
export function heatConfig(): DomainConfig {
  const li = HT.heatLevelInfo
  // 쉼터 원본이 비어 있으면 임의 샘플로 레이아웃을 보여준다(샘플 안내 표시, 원본에 값이 들어오면 자동으로 사라짐)
  const sheltersSample = HT.heatShelters.length === 0
  const shelters = sheltersSample ? sampleShelters : HT.heatShelters
  const home = (
    <LeaderBoardBrief brief={heatBrief()}>
      <Group title="무더위쉼터" dummy>
        {sheltersSample && <SampleNote />}
        <ul className="plist">
          {shelters.map((s) => (
            <li className="row-between" key={s.id}>
              <div>
                <p className="t">{s.name}</p>
                <p className="s">
                  {s.address} · {s.type}
                </p>
              </div>
              <span className="t">{s.capacity}명</span>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="이동 경로 안내" dummy>
        <ul className="plist">
          {HT.heatRouteTips.map((r) => (
            <li key={r.id}>
              <div className="row-between">
                <span className="t">{r.name}</span>
                {r.kind === "cool" ? <Risk level="safe" label="그늘길" /> : <Risk level="warning" label="주의 구간" />}
              </div>
              <p className="s">{r.detail}</p>
            </li>
          ))}
        </ul>
      </Group>
    </LeaderBoardBrief>
  )
  const analysis = (
    <>
      <Kv
        items={[
          { k: "현재 특보", v: li.label },
          { k: "체감온도", v: li.feelsLikeC === null ? "-" : `${li.feelsLikeC}℃` },
        ]}
        over={["체감온도"]}
      />
      <Group title="최근 5일 기온" dummy>
        <MiniChart
          data={HT.heatTrend}
          keys={["maxTempC", "feelsLikeC"]}
          colors={["#f9cd00", "#f2731a"]}
          names={["최고기온(℃)", "체감온도(℃)"]}
          xkey="date"
          refLine={{ y: 33, label: "주의보 33℃" }}
        />
      </Group>
      <p className="pbox">{li.criteria}</p>
    </>
  )
  const d = HT.heatAlertDispatch
  const evs = [
    { icon: "🔔", time: d.sentAt, lines: [d.title, d.message], badge: <Risk level="safe" label="발송" solid /> },
    { icon: "🔆", time: `${li.updatedAt} 기준`, lines: [li.feelsLikeC === null ? `${li.label} — 관측값 없음` : `${li.label} 유지 — 체감 ${li.feelsLikeC}℃`], level: li.level },
    ...[...HT.heatTrend].reverse().map((t) => ({
      icon: "🌡",
      time: t.date,
      lines: [`최고 ${t.maxTempC}℃ · 체감 ${t.feelsLikeC}℃`],
      level: (t.feelsLikeC >= 33 ? "warning" : undefined) as RiskLevel | undefined,
    })),
  ]
  return {
    id: "heat",
    title: "폭염",
    mapDomain: "heat",
    wrn: { codes: ["H", "K"] },
    headline: (
      <>
        🔆 <b>{li.label}</b>{li.feelsLikeC !== null && <> · 체감온도 {li.feelsLikeC}℃ ({li.updatedAt} 기준)</>}
      </>
    ),
    tabs: navTabs(HEAT_NAV, home, {
      "/heat/data": (
        <>
          <DataSources s={dataSourcesByService.heat} />
          <Group title="관측망 현황">
            <p className="pbox">
              자체 실측 장비 없음 — 기상청 폭염특보·단기예보를 그대로 표출합니다.
              <br />
              <span className="s">무더위쉼터 위치·정원은 데이터 소스가 아닌 자산현황이라 별도 관리 — 대시보드 탭 참고</span>
            </p>
          </Group>
        </>
      ),
      "/heat/analysis": analysis,
      "/heat/alert": <Dispatch d={d} />,
      "/heat/closure": <Closure c={HT.heatClosure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      {
        key: "shelter",
        label: "무더위쉼터",
        content: (
          <>
            {sheltersSample && <SampleNote />}
            <ul className="plist">
              {shelters.map((s) => (
                <li className="row-between" key={s.id}>
                  <span>
                    {s.name} <span className="s">{s.region}</span>
                  </span>
                  <span className="t">{s.capacity}명</span>
                </li>
              ))}
            </ul>
          </>
        ),
      },
      { key: "live", label: "실시간 연동", content: <Live>{liveWarnings(["H", "K"], "실시간 폭염·열대야 특보")}{LIVE_FORECAST}</Live> },
    ],
  }
}

// ================================================================== 하천범람
export function riverConfig(): DomainConfig {
  // 상단 헤드라인은 가장 위험한 지점 기준 — 예전엔 "효돈천(쇠소깍) 3단계 · 심각"이 하드코딩돼 평시 리셋 후에도 남아 있었음
  const RANK: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
  const worstRiver = [...RV.riverStatuses].sort((a, b) => RANK.indexOf(b.level) - RANK.indexOf(a.level))[0]
  const rb = RV.riverRiskBasis
  const run = getRunState()
  const flowRatio = riverFlowRatioAnalysis(run)
  const ratioRows = (["돈내코", "쇠소깍"] as const).map((location) => {
    const reading = flowRatio.latest[location]
    const stage = RV.riverStatuses.find((status) => status.name.includes(location))?.stage ?? "-"
    return [location, reading ? `${reading.flowRatioPercent}% · ${stage} · 관측 ${reading.observedAt}` : "관측 없음"] as [string, ReactNode]
  })
  const tg = RV.riverTarget
  const home = (
    <LeaderBoardBrief brief={riverBrief()}>
      <Group title="승인 이력" dummy>
        <Tl entries={RV.riverApprovalHistory} />
      </Group>
      <Group title="감시 대상" dummy>
        <Rows
          pairs={[
            ["대상", tg.area],
            ["정확도 목표", tg.accuracyGoal],
            ["선행시간 목표", tg.leadTimeGoal],
            ["레거시 센서", `${RV.riverInfra.legacy.total}개 (제주시 ${RV.riverInfra.legacy.jeju} · 서귀포시 ${RV.riverInfra.legacy.seogwipo})`],
          ]}
        />
      </Group>
      <RelatedCams domain="river" />
    </LeaderBoardBrief>
  )
  // 상황 분석·데이터 수집 상세 화면이 같이 보여주는 수위 센서 목록
  const sensorList = RV.riverSensorCheck.length > 0 ? (
    <ul className="plist">
      {RV.riverSensorCheck.map((s) => (
        <li key={s.id}>
          <div className="row-between">
            <span className="t">{s.name}</span>
            <St text={s.status} />
          </div>
          <p className="s">
            {s.value} · {s.detail}
          </p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="pbox">수위 센서 수집 자료가 없습니다. Q% 시나리오와 별도인 수집상태 엑셀에서 센서 현황을 입력할 수 있습니다.</p>
  )
  const tc = RV.riverTideCorrelation
  const im = RV.riverImpact
  const dc = RV.riverDataConfidence
  const observedSiteCount = Object.values(flowRatio.latest).filter(Boolean).length
  const riskSiteCount = Object.values(run.pointState).filter((point) => point && point.level !== "safe").length
  const impactValue = (value: string) => value === "해당 없음" || value === "-" ? "영향 모델 미연동" : value
  const confidenceValue = (value: string) => value === "-" ? "미수신" : <St text={value} />
  const analysis = (
    <>
      <Group title="계획홍수량 대비 비율(Q%) 추이 — 시나리오" dummy>
        <Rows pairs={ratioRows} />
        {flowRatio.series.length > 0 ? (
          <>
            <MiniChart
              data={flowRatio.series}
              keys={["donnaeko", "soesokkak"]}
              colors={["#8ec21f", "#0054a3"]}
              names={["돈내코 Q%", "쇠소깍 Q%"]}
              xkey="time"
              showDots
            />
            <p className="s" style={{ fontSize: 11, marginTop: 4 }}>현재 시나리오 시각까지의 입력값입니다. 다음 관측 전에는 지점별 직전 값을 유지합니다.</p>
          </>
        ) : (
          <p className="pbox">시나리오를 업로드하고 첫 시점을 진행하면 Q% 값과 변화가 여기에 표시됩니다.</p>
        )}
      </Group>
      <Group title={`수위·조위 상관 — ${tc.location}`} dummy>
        {tc.series.length > 0 ? (
          <>
            <MiniChart
              data={tc.series}
              keys={["waterLevelM", "tideLevelM"]}
              colors={["#0054a3", "#8ec21f"]}
              names={["수위(m)", "조위(m)"]}
              xkey="time"
              refLine={{ y: tc.boundaryLevelM, label: `경계 ${tc.boundaryLevelM}m` }}
            />
            <p className="s" style={{ fontSize: 11, marginTop: 4 }}>
              {tc.series.find((p) => p.predicted)?.time}부터 예측값 · 다음 만조 {tc.nextHighTide}
            </p>
            <p className="pbox" style={{ marginTop: 6 }}>{tc.note}</p>
          </>
        ) : (
          <p className="pbox">수위·조위 관측 자료가 없어 상관 그래프를 표시할 수 없습니다. 이 파일럿은 계획홍수량 대비 비율(Q%)만 입력받습니다.</p>
        )}
      </Group>
      <Group title="영향 범위" dummy>
        <Rows pairs={[
          ["Q% 위험 지점", run.playheadIndex >= 0 ? `${riskSiteCount}/2곳` : "첫 관측 전"],
          ["면적", impactValue(im.area)],
          ["인구", impactValue(im.population)],
          ["시설", impactValue(im.facilities)],
          ["대피 경로", im.evacuationRoutes === "-" ? "경로 정보 미연동" : im.evacuationRoutes],
        ]} />
        <p className="s" style={{ fontSize: 11, marginTop: 4 }}>위험 지점 수는 현재 Q% 등급에서 계산합니다. 면적·인구·시설·경로는 공간 영향 자료가 있어야 산출할 수 있습니다.</p>
      </Group>
      <Group title="센서 교차검증" dummy>
        {sensorList}
        <p className="s" style={{ fontSize: 11, marginTop: 4 }}>Q%만으로 실제 수위(m)나 센서 통신 상태를 추정하지 않습니다.</p>
      </Group>
      <Group title="CCTV 확인" dummy>
        {RV.riverCctv.length > 0 ? (
          <Rows pairs={RV.riverCctv.map((c) => [c.label, <span key={c.id}>{c.detected} · {c.quality} <span className="s">{c.time}</span></span>] as [string, ReactNode])} />
        ) : (
          <p className="pbox">현장 CCTV 영상·탐지 정보가 연결되지 않았습니다. Q% 판정에는 영상 확인 결과를 사용하지 않습니다.</p>
        )}
      </Group>
      <Group title={`데이터 신뢰도 — ${dc.overall === "-" ? "산정 불가" : dc.overall}`} dummy>
        <Rows
          pairs={[
            ["Q% 시나리오 입력", `${observedSiteCount}/2곳`],
            ["강우", confidenceValue(dc.rain)],
            ["수위", confidenceValue(dc.waterLevel)],
            ["레이더", confidenceValue(dc.radar)],
            ["영상", confidenceValue(dc.video)],
          ]}
        />
        <p className="s" style={{ fontSize: 11 }}>Q% 입력 여부는 확인할 수 있지만, 다른 관측망이 없어 교차검증 신뢰도는 산정할 수 없습니다. {dc.note}</p>
      </Group>
      <Group title="위험단계 기준 (TP-P22_002)">
        <StageCriteria rows={RV.riverStageCriteria.map((c) => ({ level: c.level, label: c.label, cells: [`계획홍수량 ${c.flowRatio}`, c.waterState] }))} />
      </Group>
      <Group title="조위 참고 — KHOA 모슬포" source={KHOA_TIDE_SNAPSHOT}>
        <p className="s">
          {RV.khoaMoseulpoTide.distanceNote} · 최근 {RV.khoaMoseulpoTide.series.at(-1)?.tideLevelCm}cm (
          {RV.khoaMoseulpoTide.series.at(-1)?.time})
        </p>
      </Group>
      <Group title="레거시 연계 데이터">
        <Rows
          pairs={[
            ["제주시 침수정보센서", `${RV.riverInfra.legacy.jeju}개소`],
            ["서귀포시 침수정보센서", `${RV.riverInfra.legacy.seogwipo}개소`],
            ["총 연계 규모", `${RV.riverInfra.legacy.total}개소`],
          ]}
        />
        <p className="s" style={{ fontSize: 11 }}>
          {RV.riverInfra.legacy.note}
        </p>
      </Group>
    </>
  )
  const control = (
    <>
      <ul className="plist">
        {RV.riverControlRows.map((r) => (
          <li key={r.id}>
            <div className="row-between">
              <span className="t">{r.river}</span>
              <span className="t" style={{ color: `var(--risk-${r.stage.includes("심각") ? "danger" : "warning"})` }}>
                {r.stage}
              </span>
            </div>
            <p className="s">{r.location}</p>
            <p className="mt" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              차단기 <St text={r.gate} /> 출동 <St text={r.dispatch} /> 수신 <St text={r.ack} />
            </p>
          </li>
        ))}
      </ul>
      <Group title="조치 실패" dummy>
        {RV.riverControlFailures.map((f) => (
          <Box key={f.id} title={f.title} lines={[`${f.time} · ${f.cause}`, f.action]} right={<Risk level="danger" label="실패" />} />
        ))}
      </Group>
      <Group title="전파 현황" dummy>
        <Rows pairs={RV.riverPropagation.map((p) => [p.channel, <St key={p.channel} text={p.status} lv={p.status.includes("미전달") ? "warning" : "safe"} />] as [string, ReactNode])} />
      </Group>
      <Group title="공동 대응 기관" dummy>
        <Rows pairs={RV.riverJointAgencies.map((j) => [j.agency, <St key={j.id} text={j.status} />] as [string, ReactNode])} />
      </Group>
      <Group title="단계별 타임라인" dummy>
        <Tl entries={RV.riverControlTimeline} />
      </Group>
    </>
  )
  const dr = RV.riverDispatchRequest
  const disp = (
    <>
      <Box
        title={dr.target}
        lines={[`도달 예상 ${dr.eta}`, dr.impact, `요청 ${dr.requestedAt} · ${dr.requester}`]}
        right={<Risk level={dr.level} label={dr.stage.replace("⚠ ", "")} />}
      />
      <Group title="위험 분석" dummy>
        <Checks items={dr.analysis} />
      </Group>
      <Group title="처리 과정" dummy>
        <Tl entries={dr.process} />
      </Group>
    </>
  )
  const evs = [...RV.riverControlTimeline].reverse().map((e) => {
    const bad = e.title.includes("심각") || e.title.includes("오류") || e.title.includes("미배정")
    return { icon: e.title.includes("심각") ? "●" : "○", time: e.time, lines: [e.title], level: (bad ? "danger" : undefined) as RiskLevel | undefined }
  })
  return {
    id: "river",
    title: "하천범람",
    mapDomain: "river",
    wrn: { codes: ["R", "W"] },
    headline: (
      <>
        🏞️ <b>
          {worstRiver.name} {worstRiver.stage}
        </b>{" "}
        {run.timeline.length > 0
          ? `— Q% ${(["돈내코", "쇠소깍"] as const).map((location) => `${location} ${flowRatio.latest[location]?.flowRatioPercent ?? "관측 없음"}${flowRatio.latest[location] ? "%" : ""}`).join(" · ")}`
          : `— 수위 ${rb.waterLevel.value} (${rb.waterLevel.detail})`}
      </>
    ),
    tabs: navTabs(RIVER_NAV, home, {
      "/river/data": (
        <>
          <DataSources s={dataSourcesByService.river} />
          <Group title="실측 센서 수집 현황" dummy>
            {sensorList}
          </Group>
        </>
      ),
      "/river/analysis": analysis,
      "/river/alert": (
        <>
          <Dispatch d={RV.riverAlertDispatch} />
          <Group title="현장 직접 경보 목표">
            <Plans items={riverFieldAlertGoal} />
          </Group>
        </>
      ),
      "/river/control": control,
      "/river/monitoring": (
        <>
          <LiveBlock title="실시간 우량 관측" note="기상청 API허브 AWS 매분자료" simulated={IS_SIMULATION_MODE}>
            <RainfallObservationPanel />
          </LiveBlock>
          <RiverPointsBlock />
          <RiverForecastBlock />
          <TideBlock />
        </>
      ),
      "/river/dispatch": disp,
      "/river/closure": <Closure c={RV.riverClosure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      {
        key: "joint",
        label: "공동 대응 기관",
        content: <Rows pairs={RV.riverJointAgencies.map((j) => [j.agency, <St key={j.id} text={j.status} />] as [string, ReactNode])} />,
      },
      {
        key: "live",
        label: "실시간 연동",
        content: (
          <Live>
            <LiveBlock title="실시간 우량 관측" note="기상청 API허브 AWS 매분자료" simulated={IS_SIMULATION_MODE}>
              <RainfallObservationPanel />
            </LiveBlock>
            {liveWarnings(["R", "W"], "실시간 호우특보")}
            {LIVE_FORECAST}
          </Live>
        ),
      },
    ],
  }
}

// ================================================================== 저염분 고수온
export function aquaConfig(): DomainConfig {
  const s = AQ.aquaSummary
  const rs = AQ.aquaRiskState
  const levels = (arr: { level: RiskLevel; label: string; range: string }[]) => (
    <ul className="plist">
      {arr.map((x) => (
        <li className="row-between" key={x.label}>
          <Risk level={x.level} label={x.label} />
          <span>{x.range}</span>
        </li>
      ))}
    </ul>
  )
  // 상세 대시보드·AI 예측 상세 화면이 모두 보여주는 KHOA 보강 검토 — 두 탭에서 같이 쓴다
  const khoaReview = (
    <Group title="KHOA 실측 기반 AI 보강 가능성 검토" dummy>
      <Box title={AQ.aquaKhoaEnhancementReview.summary} lines={AQ.aquaKhoaEnhancementReview.usable} right={<Risk level="safe" label={AQ.aquaKhoaEnhancementReview.feasible} />} />
      <Note tone="caution">실증사 요청 필요: {AQ.aquaKhoaEnhancementReview.vendorAsk}</Note>
    </Group>
  )
  const home = (
    <LeaderBoardBrief brief={aquaBrief()}>
      <Group title="업무 흐름" dummy>
        <ul className="plist">
          {AQ.aquaJourneys.map((j) => (
            <li key={j.id}>
              <p className="t">{j.label}</p>
              <p className="s">{j.desc}</p>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="염분 기준">{levels(s.salinityLevels)}</Group>
      <Group title="수온 기준">{levels(s.temperatureLevels)}</Group>
      <p className="pbox">{s.combinedRuleNote}</p>
      <Group title="감시 대상" dummy>
        <Rows pairs={[["해역", s.targetArea], ["공간 해상도", s.spatialResolution], ["AI 라벨", s.aiLabels.join(" · ")]]} />
      </Group>
      {khoaReview}
      <RelatedCams domain="aqua" />
    </LeaderBoardBrief>
  )
  const data = (
    <>
      <ul className="plist">
        {AQ.aquaDataSources.map((d) => (
          <li key={d.id}>
            <div className="row-between">
              <span className="t">{d.name}</span>
              <St text={SOURCE_LABEL[d.status] ?? d.status} lv={d.status === "normal" ? "safe" : d.status === "delayed" ? "warning" : "danger"} />
            </div>
            <p className="s">
              {d.detail} · 주기 {d.cycle} · 갱신 {d.updatedAt} · 품질 {d.qualityScore ?? "—"}
            </p>
            <p className="s">{d.note}</p>
          </li>
        ))}
      </ul>
      <Group title="수집 이상" dummy>
        {AQ.aquaDataIssues.map((i) => (
          <Box
            key={i.id}
            title={i.title}
            lines={[i.cause, `영향: ${i.impact}`]}
            right={<St text={SOURCE_LABEL[i.type] ?? i.type} lv={i.type === "delayed" ? "warning" : "danger"} />}
          />
        ))}
      </Group>
      <Group title="조치 이력" dummy>
        <ul className="plist">
          {AQ.aquaActionLog.map((a) => (
            <li key={a.id}>
              <div className="row-between">
                <span>
                  <span className="time">{a.time}</span> {a.title}
                </span>
                <St text={a.status} />
              </div>
              <p className="s">
                {a.owner} · {a.action}
              </p>
            </li>
          ))}
        </ul>
      </Group>
    </>
  )
  const pred = (
    <>
      <Box title={rs.level} lines={[rs.headline, `신뢰도 ${rs.confidence}% · 갱신 ${rs.updatedAt}`]} right={<Risk level={rs.riskLevel} label={rs.level} />} />
      <Kv
        items={[
          { k: "저염분수 도달", v: rs.lowSalinity.eta, d: `${rs.lowSalinity.time} · ${rs.lowSalinity.location}` },
          { k: "고수온 도달", v: rs.highTemp.eta, d: `${rs.highTemp.time} · ${rs.highTemp.location}` },
          { k: "영향 양식장", v: `${rs.affectedFarmCount}개소`, d: rs.affectedFarmDelta },
        ]}
        over={["저염분수 도달"]}
      />
      <Group title="모델별 신뢰도" dummy>
        <Rows pairs={AQ.aquaModelConfidence.map((m) => [m.name, `${m.percent}%`] as [string, ReactNode])} />
      </Group>
      <Group title="입력 데이터 품질" dummy>
        <ul className="plist">
          {AQ.aquaQualityMetrics.map((q) => (
            <li key={q.id}>
              <div className="row-between">
                <span className="t">{q.name}</span>
                <Risk level={q.level} label={`${q.percent}%`} />
              </div>
              <p className="s">{q.note}</p>
            </li>
          ))}
        </ul>
      </Group>
      {khoaReview}
    </>
  )
  const ft = AQ.aquaFarmTotals
  const farms = (
    <>
      <Kv
        items={[
          { k: "위험권 전체", v: `${ft.total}개소` },
          { k: "심각", v: ft.danger },
          { k: "경계", v: ft.alert },
          { k: "주의 · 관심", v: `${ft.warning} · ${ft.caution}` },
        ]}
        over={["심각"]}
      />
      <Group title="대표 양식장" dummy>
        <ul className="plist">
          {AQ.aquaFarms.map((f) => (
            <li key={f.id}>
              <div className="row-between">
                <span className="t">{f.name}</span>
                <Risk level={f.level} />
              </div>
              <p className="s">
                {f.region} · {f.species} · {f.riskType}
              </p>
              <p className="s">
                도달 {f.etaHours}시간 후{f.salinity !== undefined && ` · 염분 ${f.salinity}psu`}
                {f.temperature !== undefined && ` · 수온 ${f.temperature}℃`}
                {f.tempSustainedDays !== undefined && ` · ${f.tempSustainedDays}일 지속`}
              </p>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="마을어장 — 소라·전복·홍해삼(샘플)" dummy>
        <ul className="plist">
          {villageFisheries.map((t) => (
            <li key={t.id}>
              <div className="row-between">
                <span className="t">{t.name}</span>
                <Risk level={t.level} label={t.riskType} />
              </div>
              <p className="s">
                {t.region} · {t.species}
              </p>
              <p className="s">
                염분 {t.salinity}psu · 수온 {t.temperature}℃
              </p>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="연안 생태 — 연산호·해조류(샘플)" dummy>
        <ul className="plist">
          {coastalEcology.map((t) => (
            <li key={t.id}>
              <div className="row-between">
                <span className="t">{t.name}</span>
                <Risk level={t.level} label={t.riskType} />
              </div>
              <p className="s">
                {t.region} · {t.species}
              </p>
              <p className="s">
                염분 {t.salinity}psu · 수온 {t.temperature}℃
              </p>
            </li>
          ))}
        </ul>
      </Group>
    </>
  )
  const ad = AQ.aquaAlertDraft
  const alert = (
    <>
      <Box title={`${ad.riskType} ${ad.grade} 경보 초안`} lines={[`${ad.region} · ${ad.effectiveAt} · 유효 ${ad.validFor}`]} right={<Risk level={ad.riskLevel} label={ad.grade} />} />
      <Group title="영향" dummy>
        <Rows
          pairs={[
            ["현재 등급", ad.currentGrade],
            ["영향 양식장", `${ad.affectedFarms}개소`],
            ["영향 인구", ad.affectedPopulation],
            ["도달 예상", ad.eta],
            ["영향 해역", ad.affectedArea],
          ]}
        />
      </Group>
      <Group title="발송 채널" dummy>
        <Rows
          pairs={[
            ["채널", ad.channels.join(" · ")],
            ["문자 대상", `${ad.smsTarget.toLocaleString()}명`],
            ["앱 대상", `${ad.appTarget.toLocaleString()}명`],
            ["현장 단말", `${ad.fieldDevices}대`],
            ["상황판", ad.boards],
          ]}
        />
      </Group>
      <Group title="근거 검증" dummy>
        <Rows pairs={[["모델 신뢰도", `${ad.confidence}%`], ["위성 일치", ad.satelliteMatch], ["현장 편차", ad.fieldDelta]]} />
      </Group>
      <Group title="승인 단계" dummy>
        <Steps items={ad.approvalSteps.map((a) => ({ title: a.stage, sub: `${a.owner} · ${a.time}` }))} />
      </Group>
      <Group title="감사 기록" dummy>
        <Tl entries={ad.audit} />
      </Group>
      {/* e-SOP 대응은 운영 > e-SOP 대응(/esop)으로 옮김 — aquaNav.ts 참고 */}
      <DetailLink to="/aqua/response">e-SOP 대응 상세 화면</DetailLink>
    </>
  )
  const monitor = (
    <>
      <ul className="plist">
        {Object.values(AQ.aquaMonitoringState).map((v) => (
          <li key={v.label}>
            <div className="row-between">
              <span className="t">{v.label}</span>
              <Risk level={v.level} label={v.tag} />
            </div>
            <p className="s">{v.value}</p>
          </li>
        ))}
      </ul>
      <Group title="해양 관측 실측 (KHOA)" source={KHOA_OBS_SNAPSHOT}>
        <ul className="plist">
          {AQ.khoaLiveObservations.map((o) => (
            <li key={o.id}>
              <div className="row-between">
                <span className="t">
                  {o.stationName}{" "}
                  <span className="s">
                    {o.stationCode} · {o.kind}
                  </span>
                </span>
                <span className="s" style={{ margin: 0 }}>
                  {o.observedAt.slice(11)}
                </span>
              </div>
              <p className="s">
                수온 {o.seaTempC}℃ · 염분 {o.salinityPsu}psu{o.currentSpeedCms != null && ` · 유속 ${o.currentSpeedCms}cm/s`}
              </p>
            </li>
          ))}
        </ul>
      </Group>
    </>
  )
  const cs = AQ.aquaClosureSummary
  const cp = AQ.aquaClosurePrediction
  const rt = AQ.aquaRetraining
  const clos = (
    <>
      <Box title={cs.type} lines={[cs.location, `${cs.startedAt} → ${cs.endedAt} (${cs.duration})`]} right={<Risk level="safe" label="해제" />} />
      <Rows pairs={[["최종 등급", cs.finalGrade]]} />
      <Group title="대응 경과" dummy>
        <Tl entries={AQ.aquaClosureTimeline} />
      </Group>
      <Group title="예측 검증" dummy>
        <Rows pairs={[["예측 염분", cp.predictedSalinity], ["실측 염분", cp.actualSalinity], ["오차", cp.error]]} />
        <Checks items={cp.reasoning} />
      </Group>
      <Group title="재학습" dummy>
        <Rows pairs={[["대상", rt.target], ["상태", rt.status], ["갱신", rt.updatedAt]]} />
      </Group>
    </>
  )
  // 2026-09-28: 모든 서비스에 "데이터 수집" 메뉴가 생기면서 데이터 수집은 별도 탭으로 분리, AI 예측은 단독 탭.
  // e-SOP 대응+실시간 모니터링은 계속 한 탭(aquaNav.ts의 also) — 모니터링 상세 화면으로 가는 링크는 본문에 둔다.
  const normalSources = AQ.aquaDataSources.filter((x) => x.status === "normal").length
  const dataTab = (
    <>
      <DataSources s={dataSourcesByService.aqua} />
      <Group title="수집 상태" dummy>
        <Kv
          items={[
            { k: "전체 소스", v: `${AQ.aquaDataSources.length}개` },
            { k: "정상 수집", v: `${normalSources}개` },
            { k: "지연·누락·오류", v: `${AQ.aquaDataSources.length - normalSources}개` },
            { k: "데이터 품질 점수", v: `${s.dataQuality.percent}%` },
          ]}
          over={["지연·누락·오류"]}
        />
      </Group>
      <Group title="수집 대상별 데이터 소스">{data}</Group>
      <Group title="연계 예정 데이터">
        <Plans items={aquaPlannedData} />
      </Group>
    </>
  )
  const evs = AQ.aquaMonitoringEvents.map((e) => ({ icon: "●", time: e.time, lines: [e.title] }))
  return {
    id: "aqua",
    title: "저염분 고수온",
    mapDomain: "aqua",
    wrn: { advisories: aquaAdvisories },
    headline: (
      <>
        🌡️ <b>{rs.level}</b> · {rs.headline} · 신뢰도 {rs.confidence}%
      </>
    ),
    tabs: navTabs(AQUA_NAV, home, {
      "/aqua/data": dataTab,
      "/aqua/prediction": pred,
      "/aqua/farms": farms,
      "/aqua/alerts": alert,
      "/aqua/monitoring": monitor, // 상세 화면 링크는 보드(DomainBoardPage)가 탭마다 붙인다
      "/aqua/closure": clos,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      {
        key: "agency",
        label: "기관 현황",
        content: (
          <ul className="plist">
            {AQ.aquaAgencyRows.map((a) => (
              <li key={a.id}>
                <p className="t">{a.agency}</p>
                <p className="s">{a.role}</p>
                <p className="mt" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  승인 <St text={a.approve} /> 실행 <St text={a.execute} /> 수신 <St text={a.receive} />
                </p>
              </li>
            ))}
          </ul>
        ),
      },
      { key: "live", label: "실시간 연동", content: <Live>{LIVE_MARINE}{LIVE_FORECAST}</Live> },
    ],
  }
}

// ================================================================== 연안 안전관리
export function coastConfig(): DomainConfig {
  const s = CO.coastSummary
  // 상세 대시보드·현장 모니터링 상세 화면이 모두 보여주는 KHOA 보강 검토 — 두 탭에서 같이 쓴다
  const coastKhoaReview = (
    <Group title="KHOA 실측 기반 AI 보강 가능성 검토" dummy>
      <Box title={CO.coastKhoaEnhancementReview.summary} lines={CO.coastKhoaEnhancementReview.usable} right={<Risk level="warning" label={CO.coastKhoaEnhancementReview.feasible} />} />
      <Note tone="caution">실증사 요청 필요: {CO.coastKhoaEnhancementReview.vendorAsk}</Note>
    </Group>
  )
  const home = (
    <LeaderBoardBrief brief={coastBrief()}>
      <Group title="AI 판단" dummy>
        {CO.coastAiInsights.map((a) => (
          <Box key={a.id} title={a.title} lines={[a.basis, a.match]} right={<Risk level={a.level} />} />
        ))}
      </Group>
      {coastKhoaReview}
      <Group title="현장 경보" dummy>
        <ul className="plist">
          {CO.coastFieldAlerts.map((f) => (
            <li key={f.id}>
              <div className="row-between">
                <span className="t">{f.location}</span>
                <Risk level={f.level} />
              </div>
              <p className="s">
                {f.time} · {f.detail}
              </p>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="AIoT 스마트폴" dummy>
        <ul className="plist">
          {CO.coastSafetyAssets.map((a) => (
            <li key={a.id}>
              <div className="row-between">
                <span className="t">{a.name}</span>
                <St text={a.status} />
              </div>
              <p className="s">{a.detail}</p>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="감시 대상" dummy>
        <Rows pairs={[["해수욕장", s.targetArea], ["인프라", s.infra], ["AI 라벨", s.aiLabels.join(" · ")]]} />
        <p className="s" style={{ fontSize: 11 }}>
          {s.permitNote}
        </p>
      </Group>
      <RelatedCams domain="coast" />
    </LeaderBoardBrief>
  )
  const d = CO.coastEventDetail
  const detail = (
    <>
      <Box title={d.type} lines={[d.id, `탐지 ${d.detectedAt} · ${d.grade}`]} right={<Risk level={d.level} label={d.status} />} />
      <Rows
        pairs={[
          ["출처", d.source],
          ["구역", d.zone],
          ["위치", d.location],
          ["반경", d.radius],
          ["검토자", <span key="r">{d.reviewer} <St text={d.reviewStatus} /></span>],
        ]}
      />
      <Group title="주변 위험 요소" dummy>
        <Rows
          pairs={[
            ["인접 연안", d.nearbyCoast],
            ["이안류 구간", d.ripCurrentZone],
            ["관련 하천", d.relatedRiver],
            ["양식시설", d.nearbyFarms],
            ["월파 구간", d.waveZone],
          ]}
        />
      </Group>
      <Group title="관측" dummy>
        <Kv
          items={[
            { k: "강우", v: d.rainSummary.value, d: d.rainSummary.detail },
            { k: "파고", v: d.waveSummary.value, d: d.waveSummary.detail },
            { k: "이안류 위험", v: d.ripCurrentRisk.value, d: `${d.ripCurrentRisk.detail} · ${d.ripCurrentRisk.confidence}` },
          ]}
        />
      </Group>
      <Group title="영상 탐지" dummy>
        <p className="pbox">
          {d.detection.class}
          <br />
          <span className="s">{d.detection.confidence}</span>
        </p>
      </Group>
      <Group title="센서 교차검증" dummy>
        <Rows pairs={d.sensorCrossCheck.map((x) => [x.name, <St key={x.id} text={x.status} lv={x.status === "정상" ? "safe" : "warning"} />] as [string, ReactNode])} />
      </Group>
      <Group title="위험도 변화 타임라인" dummy>
        <Tl entries={d.timeline} />
      </Group>
      <Group title="기관 공조 상태" dummy>
        <Rows pairs={d.agencyStatus.map((a) => [a.agency, <St key={a.id} text={a.status} />] as [string, ReactNode])} />
      </Group>
      <Group title="현장 조치" dummy>
        <Rows pairs={[["출동", d.fieldActions.dispatch], ["통제", d.fieldActions.control], ["경보", d.fieldActions.alert]]} />
      </Group>
    </>
  )
  // 경보 발송 상세 화면 구성: 승인 대기 이벤트 → 선택 이벤트 AI 판단 근거 → 현장 경보 채널
  const pending = CO.coastEvents.filter((e) => e.status === "미확인")
  const alerts = (
    <>
      <p className="pnote">승인 대기 이벤트</p>
      <ul className="plist">
        {pending.length === 0 && <li className="pempty">승인 대기 이벤트 없음 — 평시 감시 중</li>}
        {pending.map((e) => (
          <li key={e.id}>
            <div className="row-between">
              <span className="t">
                {e.type} · {e.location}
              </span>
              <Risk level={e.level} />
            </div>
            <p className="s">
              {e.time} · {e.source}
            </p>
            <p className="mt">
              <St text={e.status} />
            </p>
          </li>
        ))}
      </ul>
      <Group title="선택 이벤트 — AI 판단 근거" dummy>
        <Rows
          pairs={[
            ["이벤트", d.id],
            ["이안류 위험", `${d.ripCurrentRisk.value} · ${d.ripCurrentRisk.confidence}`],
            ["영상 탐지", `${d.detection.class} · ${d.detection.confidence}`],
          ]}
        />
      </Group>
      <Group title="현장 경보 채널">
        <Plans items={coastAlertChannels} />
      </Group>
    </>
  )
  const dp = CO.coastDispatch
  const rq = dp.request
  const dispatch = (
    <>
      <Box title={dp.summary.title} lines={[dp.summary.location, `탐지 ${dp.summary.detectedAt}`]} right={<Risk level={dp.summary.level} />} />
      <Kv
        items={[
          { k: "AI 신뢰도", v: `${dp.confidence}%` },
          { k: "이안류", v: dp.ripCurrent },
          { k: "영향 반경", v: dp.radius },
          { k: "인근 방문객", v: dp.nearbyVisitors },
        ]}
      />
      <p className="pbox" style={{ marginTop: 8 }}>
        {dp.aiReason}
        <br />
        <span className="s">{dp.weather}</span>
      </p>
      <Group title="출동 요청" dummy>
        <Rows
          pairs={[
            ["상태", <St key="s" text={rq.status} lv="caution" />],
            ["수신 기관", rq.agency],
            ["요청 시각", rq.sentAt],
            ["우선순위", rq.priority],
            ["투입 선박", rq.vessel],
            ["도착 예상", rq.eta],
            ["소방 연계", rq.fireLinked],
            ["상황판 공유", rq.boardShared],
          ]}
        />
      </Group>
      <Note tone="caution">{dp.fallback}</Note>
      <Group title="관계 기관 SMS 전파">
        <Plans items={coastSmsRelay} />
      </Group>
    </>
  )
  const monitor = (
    <>
      <ul className="plist">
        {CO.coastMonitoringDomains.map((m) => (
          <li key={m.id}>
            <div className="row-between">
              <span className="t">{m.label}</span>
              <Risk level={m.level} label={m.status} />
            </div>
            <p className="s">{m.detail}</p>
          </li>
        ))}
      </ul>
      <Group title="해양관측부이 (KHOA)" source={KHOA_BUOY_SNAPSHOT}>
        <Buoys />
      </Group>
      <Group title="위험단계 기준 (TP-P22_002)">
        <StageCriteria rows={CO.coastStageCriteria.map((c) => ({ level: c.level, label: c.label, cells: [`파고 ${c.waveHeight}`, `풍속 ${c.windSpeed}`, c.tide] }))} />
      </Group>
      <Group title="지표 결합 규칙 (임의 설정 — 공식 기준 확정 시 수정)">
        <Checks items={COAST_COMBINE_RULES} />
      </Group>
      {coastKhoaReview}
      <Group title="성능 검증 계획">
        <Plans items={coastVerification} />
      </Group>
      <Group title="설치·장비 사전 검토">
        <Plans items={coastInstallReview} />
      </Group>
    </>
  )
  const evs = CO.coastEvents.map((e) => ({
    icon: e.level === "danger" ? "⚠" : "●",
    time: e.time,
    lines: [`${e.type} — ${e.location}`, e.source],
    badge: <St text={e.status} />,
    level: e.level,
  }))
  return {
    id: "coast",
    title: "연안 안전관리",
    mapDomain: "coast",
    wrn: { codes: ["V", "O", "N"] },
    headline: (
      <>
        🌊 진행 중 이벤트 <b>{s.activeEvents.count}건</b> · {s.activeEvents.detail} · 미확인 {s.unconfirmedEvents.count}건
      </>
    ),
    tabs: navTabs(COAST_NAV, home, {
      "/coast/data": (
        <>
          <DataSources s={dataSourcesByService.coast} />
          <Group title="AIoT 스마트폴 수집 현황" dummy>
            <ul className="plist">
              {CO.coastSafetyAssets.map((a) => (
                <li key={a.id}>
                  <div className="row-between">
                    <span className="t">{a.name}</span>
                    <St text={a.status} />
                  </div>
                  <p className="s">
                    {a.location} · {a.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Group>
        </>
      ),
      "/coast/events": detail,
      "/coast/alerts": alerts,
      "/coast/dispatch": dispatch,
      "/coast/monitoring": monitor,
      "/coast/closure": <Closure c={CO.coastClosure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={evs} /> },
      {
        key: "agency",
        label: "기관 공조",
        content: (
          <ul className="plist">
            {CO.coastAgencyStatuses.map((a) => (
              <li key={a.id}>
                <div className="row-between">
                  <span className="t">{a.agency}</span>
                  <Risk level={a.level} label={a.status} />
                </div>
                <p className="s">{a.detail}</p>
              </li>
            ))}
          </ul>
        ),
      },
      { key: "live", label: "실시간 연동", content: <Live>{LIVE_MARINE_COAST}{liveWarnings(["V", "O", "N"], "실시간 풍랑·해일 특보")}{LIVE_FORECAST}</Live> },
    ],
  }
}

// ================================================================== 산불·지진해일·대설
/** 호우·태풍처럼 보드 + 상세 5화면을 한 정의(mockHazards.ts)로 만든다. 자체 관측이 없어 실시간 공개 데이터만 보여준다 */
export function hazardConfig(id: HazardId): DomainConfig {
  const h = HAZARDS[id]
  const liveRef =
    h.live === "quake" ? (
      <LiveBlock title="최근 지진 — USGS" note="무료 공개 API — 규모 4.5 이상·동아시아·서태평양(참고)">
        <QuakePanel limit={6} />
      </LiveBlock>
    ) : (
      <>
        {(["jeju", "halla"] as const).map((site) => (
          <LiveBlock
            key={site}
            title={`${h.live === "fire" ? "산불 기상조건(습도·풍속)" : "적설·기온 예보"} · ${site === "jeju" ? "제주시" : "한라산"}`}
            note="Open-Meteo 시간별 예보 — 참고용"
          >
            {h.live === "fire" ? <FireWeatherPanel site={site} /> : <SnowForecastPanel site={site} />}
          </LiveBlock>
        ))}
      </>
    )
  const legacyList = (
    <ul className="plist">
      {h.legacy.length === 0 && <li className="pempty">데이터가 없습니다.</li>}
      {h.legacy.map((s) => (
        <li key={s.id}>
          <div className="row-between">
            <span className="t">{s.name}</span>
            <St text={s.linkStatus} />
          </div>
          <p className="s">
            {s.operator} · {s.note}
          </p>
        </li>
      ))}
    </ul>
  )
  const home = (
    <LeaderBoardBrief brief={hazardBrief(id)}>
      <Group title="레거시·외부 시스템 연계">{legacyList}</Group>
    </LeaderBoardBrief>
  )
  return {
    id: h.id,
    title: h.title,
    mapDomain: h.id,
    wrn: { codes: h.wrnCodes },
    headline: <>{h.headline}</>,
    tabs: navTabs(hazardNav(id), home, {
      [`${h.path}/data`]: <DataSources s={dataSourcesByService[id]} />,
      [`${h.path}/analysis`]: <Live>{liveWarnings(h.wrnCodes, h.wrnTitle)}{liveRef}</Live>,
      [`${h.path}/alert`]: <Dispatch d={h.dispatch} />,
      [`${h.path}/closure`]: <Closure c={h.closure} />,
    }),
    right: [
      { key: "tl", label: "타임라인", content: <Events items={[]} /> },
      { key: "legacy", label: "연계 시스템", content: legacyList },
      { key: "live", label: "실시간 연동", content: <Live>{liveWarnings(h.wrnCodes, h.wrnTitle)}{liveRef}{LIVE_FORECAST}</Live> },
    ],
  }
}

export const DOMAIN_CONFIGS: Record<string, () => DomainConfig> = {
  "heavy-rain": heavyRainConfig,
  typhoon: typhoonConfig,
  heat: heatConfig,
  wildfire: () => hazardConfig("wildfire"),
  tsunami: () => hazardConfig("tsunami"),
  snow: () => hazardConfig("snow"),
  river: riverConfig,
  aqua: aquaConfig,
  coast: coastConfig,
}

