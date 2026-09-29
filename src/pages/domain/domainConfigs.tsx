import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Risk } from "../../components/board/BoardParts"
import { Box, Checks, DetailLink, Group, Kv, MiniChart, Note, Rows, St, SOURCE_LABEL, Steps, Tl } from "../../components/board/PanelParts"
import { MarineObservationPanel } from "../../components/ui/MarineObservationPanel"
import { RainfallObservationPanel } from "../../components/ui/RainfallObservationPanel"
import { TyphoonNameListPanel } from "../../components/ui/TyphoonNameListPanel"
import { TyphoonNowPanel } from "../../components/ui/TyphoonNowPanel"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { WarningsPanel } from "../../components/ui/WarningsPanel"
import type { CctvCamera, RiskLevel, RiskMarker } from "../../types/domain"
import { cctvCameras } from "../../data/mockCctv"
import * as HR from "../../data/mockHeavyRain"
import * as TY from "../../data/mockTyphoon"
import * as HT from "../../data/mockHeat"
import * as RV from "../../data/mockRiver"
import * as AQ from "../../data/mockAqua"
import * as CO from "../../data/mockCoast"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import { dataSourcesByService, type ServiceDataSources } from "../../data/mockDataSourceCategories"
import {
  aquaPlannedData,
  coastAlertChannels,
  coastInstallReview,
  coastSmsRelay,
  coastVerification,
  riverFieldAlertGoal,
  type PlanItem,
} from "../../data/mockMeetingItems"
import { COAST_COMBINE_RULES } from "../../data/coastAlertThresholds"
import { LeaderBoardBrief } from "./LeaderBrief"
import { aquaBrief, coastBrief, heatBrief, heavyRainBrief, riverBrief, typhoonBrief } from "./leaderBriefs"
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

const SOURCE_GROUPS: { key: "available" | "legacy" | "requestable" | "missing"; title: string; lv: RiskLevel }[] = [
  { key: "available", title: "① 현재 사용 가능", lv: "safe" },
  { key: "legacy", title: "② 제주 레거시(미적용)", lv: "caution" },
  { key: "requestable", title: "③ 요청 가능(실증서비스)", lv: "info" },
  { key: "missing", title: "④ 현재 없는 데이터", lv: "offline" },
]

/** "데이터 수집" 탭 — 상세 화면(xxxDataPage)의 데이터 출처 4단계 구분을 보드 패널 형식으로 요약 */
function DataSources({ s }: { s: ServiceDataSources }) {
  return (
    <>
      <Kv items={SOURCE_GROUPS.map((g) => ({ k: g.title.slice(2), v: `${s[g.key].length}건` }))} />
      {SOURCE_GROUPS.map((g) => (
        <Group key={g.key} title={g.title}>
          <ul className="plist">
            {s[g.key].map((item) => (
              <li key={item.id}>
                <div className="row-between">
                  <span className="t">{item.label}</span>
                  <Risk level={g.lv} label={g.title.slice(0, 1)} />
                </div>
                {item.note && <p className="s">{item.note}</p>}
              </li>
            ))}
          </ul>
        </Group>
      ))}
    </>
  )
}

/** 착수보고회 회의록 기반 계획·검토 항목(PlanItemsCard와 같은 데이터) — 실측값이 아니라 진행 상태만 */
function Plans({ items }: { items: PlanItem[] }) {
  return (
    <ul className="plist">
      {items.map((p) => (
        <li key={p.id}>
          <div className="row-between">
            <span className="t">{p.title}</span>
            <St text={p.status} lv={p.level} />
          </div>
          <p className="s">{p.detail}</p>
        </li>
      ))}
    </ul>
  )
}

/** 위험단계 기준표(TP-P22_002) — 상세 화면의 상태 구간 표와 같은 데이터 */
function StageCriteria({ rows }: { rows: { level: RiskLevel; label: string; cells: string[] }[] }) {
  return (
    <ul className="plist">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="row-between">
            <Risk level={r.level} label={r.label} />
          </div>
          <p className="s">{r.cells.join(" · ")}</p>
        </li>
      ))}
    </ul>
  )
}

// ------------------------------------------------------------------ 공통 조각
interface DispatchLike {
  stage: string
  title: string
  target: string
  targetDetail: string
  sentAt: string
  approver: string
  message: string
  rivers?: string
  district?: string
  channels: { name: string; sent: number; success: number; fail: number; rate: string; lastSent: string; unit?: string }[]
  totalFail: number
}

function Dispatch({ d }: { d: DispatchLike }) {
  const extra: [string, ReactNode][] = []
  if (d.rivers) extra.push(["대상 하천", d.rivers])
  if (d.district) extra.push(["대상 지역", d.district])
  return (
    <>
      <Box title={d.title} lines={[d.message]} />
      <Group title="발송 정보" dummy>
        <Rows
          pairs={[
            ["단계", <St key="s" text={d.stage} lv="alert" />],
            ["대상", <span key="t">{d.target}<br /><span className="s">{d.targetDetail}</span></span>],
            ["발송 시각", d.sentAt],
            ["승인자", d.approver],
            ...extra,
          ]}
        />
      </Group>
      <Group title="채널별 발송 결과" dummy>
        <ul className="plist">
          {d.channels.map((c) => (
            <li key={c.name}>
              <div className="row-between">
                <span className="t">{c.name}</span>
                <span className="t">{c.rate}</span>
              </div>
              <p className="s">
                발송 {c.sent.toLocaleString()}
                {c.unit ?? "건"} · 성공 {c.success.toLocaleString()} ·{" "}
                <span style={{ color: `var(--risk-${c.fail ? "danger" : "safe"})` }}>실패 {c.fail.toLocaleString()}</span> · 최종 {c.lastSent}
              </p>
            </li>
          ))}
        </ul>
      </Group>
      <Note tone="warning">실패 합계 {d.totalFail.toLocaleString()}건 — 재발송 검토</Note>
    </>
  )
}

interface ClosureLike {
  caseId: string
  title: string
  status: string
  confirmedBy: string
  type: string
  location?: string
  duration: string
  durationDetail: string
  agencies: string
  agencyDetail: string
  aiSummary?: { label: string; value: string }[]
  observed: { label: string; value: string }[]
  closureConditions: string[]
  report: { department: string; sop: string; casualties: string; property: string; lesson: string }
}

function Closure({ c }: { c: ClosureLike }) {
  const info: [string, ReactNode][] = [["유형", c.type]]
  if (c.location) info.push(["위치", c.location])
  info.push(
    ["소요 시간", <span key="d">{c.duration}<br /><span className="s">{c.durationDetail}</span></span>],
    ["대응 기관", <span key="a">{c.agencies}<br /><span className="s">{c.agencyDetail}</span></span>],
  )
  return (
    <>
      <Box title={`${c.caseId} · ${c.title}`} lines={[c.confirmedBy]} right={<St text={c.status} lv="safe" />} />
      <Group title="사건 개요" dummy>
        <Rows pairs={info} />
      </Group>
      {c.aiSummary && (
        <Group title="AI 분석 요약" dummy>
          <Rows pairs={c.aiSummary.map((a) => [a.label, a.value] as [string, ReactNode])} />
        </Group>
      )}
      <Group title="관측 결과" dummy>
        <Rows pairs={c.observed.map((o) => [o.label, o.value] as [string, ReactNode])} />
      </Group>
      <Group title="종료 조건" dummy>
        <Checks items={c.closureConditions} />
      </Group>
      <Group title="보고서" dummy>
        <Rows
          pairs={[
            ["작성 부서", c.report.department],
            ["적용 SOP", c.report.sop],
            ["인명 피해", c.report.casualties],
            ["재산 피해", c.report.property],
            ["개선 사항", c.report.lesson],
          ]}
        />
      </Group>
    </>
  )
}

function RelatedCams({ domain }: { domain: CctvCamera["domain"] }) {
  const items = cctvCameras.filter((c) => c.domain === domain)
  if (items.length === 0) return null
  return (
    <Group title={`관련 CCTV (${items.length})`} dummy>
      <ul className="plist">
        {items.map((c) => (
          <li className="row-between" key={c.id}>
            <div>
              <p className="t">{c.name}</p>
              <p className="s">
                {c.operator} · 최종 {c.lastFrameAt.slice(11, 16)}
              </p>
            </div>
            {c.status === "online" ? <Risk level="info" label="연결" /> : <Risk level="offline" label="오프라인" />}
          </li>
        ))}
      </ul>
      <Link className="plist plink" to="/dashboard?tab=cctv" style={{ display: "block" }}>
        CCTV 화면에서 보기 →
      </Link>
    </Group>
  )
}

function Buoys() {
  return (
    <ul className="plist">
      {khoaBuoyMarineConditions.map((b) => (
        <li key={b.id}>
          <div className="row-between">
            <span className="t">
              {b.stationName} <span className="s">({b.stationCode})</span>
            </span>
            <span className="s" style={{ margin: 0 }}>
              {b.observedAt.slice(11)}
            </span>
          </div>
          <p className="s">
            파고 {b.waveHeightM}m · 주기 {b.wavePeriodSec}s · 풍속 {b.windSpeedMs}m/s · 기압 {b.pressureHpa}hPa
          </p>
        </li>
      ))}
    </ul>
  )
}

/** 우측 타임라인 한 줄 (클론 .event) */
function Events({ items }: { items: { icon: string; time: string; lines: string[]; badge?: ReactNode; level?: RiskLevel }[] }) {
  return (
    <ul className="plist">
      {items.map((e, i) => (
        <li key={i}>
          <div className="row-between">
            <span className="time" style={e.level ? { color: `var(--risk-${e.level})` } : undefined}>
              {e.icon} {e.time}
            </span>
            {e.badge}
          </div>
          {e.lines.map((l, j) => (
            <p key={j} className={j === 0 ? "t" : "s"} style={{ marginTop: j === 0 ? 4 : 2 }}>
              {l}
            </p>
          ))}
        </li>
      ))}
    </ul>
  )
}

function Live({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
}
function LiveBlock({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div>
      <p className="pnote">{title}</p>
      <p className="s" style={{ fontSize: 11, color: "var(--foreground-subtle)", marginBottom: 6 }}>
        {note}
      </p>
      {children}
    </div>
  )
}

const LIVE_FORECAST = (
  <LiveBlock title="기상청 단기예보" note="실시간 연동 — 매 조회마다 호출">
    <VilageForecastPanel />
  </LiveBlock>
)
const liveWarnings = (codes: string[], title: string) => (
  <LiveBlock title={title} note="기상청 API허브 wrn_met_data — 최근 24시간 발표">
    <WarningsPanel wrnCodes={codes} />
  </LiveBlock>
)
const LIVE_MARINE = (
  <LiveBlock title="실시간 해양관측" note="기상청 API허브 sea_obs — 파고·풍속·수온">
    <MarineObservationPanel />
  </LiveBlock>
)
const LIVE_MARINE_COAST = (
  <LiveBlock title="실시간 해양관측" note="기상청 API허브 sea_obs — 함덕·협재 인근 지점만">
    <MarineObservationPanel stationNames={["협재", "김녕"]} />
  </LiveBlock>
)

// ================================================================== 호우
export function heavyRainConfig(_isEmpty?: boolean): DomainConfig {
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
          <Risk level={s.status} label={s.value} />
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
      { key: "live", label: "실시간 연동", content: <Live>{liveWarnings(["R", "W"], "실시간 강풍·호우 특보")}{LIVE_FORECAST}</Live> },
    ],
  }
}

// ================================================================== 태풍
export function typhoonConfig(_isEmpty?: boolean): DomainConfig {
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
      <Group title="해양관측부이 (KHOA)">
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
    lines: [`${r.name} · ${r.status}`, r.location, `↗ ${r.speedKmh}km/h · ✳ ${r.pressureHpa}hPa · ≈ ${r.maxWindMs}m/s`],
    badge: <Risk level="safe" label="발령" solid />,
  }))
  return {
    id: "typhoon",
    title: "태풍",
    mapDomain: "typhoon",
    headline: (
      <>
        🌀 <b>{cur.name}</b> · {cur.status} · 제주까지 {trk[0].distanceFromJejuKm}km · 최근접 {trk[3].distanceFromJejuKm}km 예상
      </>
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
      { key: "tl", label: "기상청 발표", content: <Events items={evs} /> },
      { key: "buoy", label: "해양 관측", content: <Buoys /> },
      {
        key: "live",
        label: "실시간 연동",
        content: (
          <Live>
            <LiveBlock title="실시간 태풍 현황" note="기상청 API허브 typ_now">
              <TyphoonNowPanel />
            </LiveBlock>
            <LiveBlock title="태풍 이름 목록" note="기상청 API허브 typ_lst">
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
export function heatConfig(_isEmpty?: boolean): DomainConfig {
  const li = HT.heatLevelInfo
  const home = (
    <LeaderBoardBrief brief={heatBrief()}>
      <Group title="무더위쉼터" dummy>
        <ul className="plist">
          {HT.heatShelters.map((s) => (
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
          { k: "체감온도", v: `${li.feelsLikeC}℃` },
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
    { icon: "🔆", time: `${li.updatedAt} 기준`, lines: [`${li.label} 유지 — 체감 ${li.feelsLikeC}℃`], level: "warning" as RiskLevel },
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
    headline: (
      <>
        🔆 <b>{li.label}</b> · 체감온도 {li.feelsLikeC}℃ ({li.updatedAt} 기준)
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
          <ul className="plist">
            {HT.heatShelters.map((s) => (
              <li className="row-between" key={s.id}>
                <span>
                  {s.name} <span className="s">{s.region}</span>
                </span>
                <span className="t">{s.capacity}명</span>
              </li>
            ))}
          </ul>
        ),
      },
      { key: "live", label: "실시간 연동", content: <Live>{liveWarnings(["H", "K"], "실시간 폭염·열대야 특보")}{LIVE_FORECAST}</Live> },
    ],
  }
}

// ================================================================== 하천범람
export function riverConfig(isEmpty = false): DomainConfig {
  // 상단 헤드라인은 가장 위험한 지점 기준 — 예전엔 "효돈천(쇠소깍) 3단계 · 심각"이 하드코딩돼 평시 리셋 후에도 남아 있었음
  const RANK: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
  const statuses = isEmpty ? RV.riverStatuses : RV.riverStatusesIncident
  const worstRiver = [...statuses].sort((a, b) => RANK.indexOf(b.level) - RANK.indexOf(a.level))[0]
  const rb = isEmpty ? RV.riverRiskBasis : RV.riverRiskBasisIncident
  const approvalHistory = isEmpty ? RV.riverApprovalHistory : RV.riverApprovalHistoryIncident
  const tg = RV.riverTarget
  // 상세 탭(분석·현장통제·출동요청)은 아직 데이터 모드 미연동 — River 상세 페이지(RiverAnalysisPage 등)에서
  // 먼저 연동했고, 이 보드 뷰의 나머지 탭은 "서비스 차례대로" 다음 단계에서 이어서 연동한다.
  const home = (
    <LeaderBoardBrief brief={riverBrief(isEmpty)}>
      <Group title="승인 이력" dummy>
        <Tl entries={approvalHistory} />
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
  const sensorList = (
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
  )
  const tc = RV.riverTideCorrelation
  const im = RV.riverImpact
  const dc = RV.riverDataConfidence
  const analysis = (
    <>
      <Group title={`수위·조위 상관 — ${tc.location}`} dummy>
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
        <p className="pbox" style={{ marginTop: 6 }}>
          {tc.note}
        </p>
      </Group>
      <Group title="영향 범위" dummy>
        <Rows pairs={[["면적", im.area], ["인구", im.population], ["시설", im.facilities], ["대피 경로", im.evacuationRoutes]]} />
      </Group>
      <Group title="센서 교차검증" dummy>
        {sensorList}
      </Group>
      <Group title="CCTV 확인" dummy>
        <Rows
          pairs={RV.riverCctv.map((c) => [c.label, <span key={c.id}>{c.detected} · {c.quality} <span className="s">{c.time}</span></span>] as [string, ReactNode])}
        />
      </Group>
      <Group title={`데이터 신뢰도 — ${dc.overall}`} dummy>
        <Rows
          pairs={[
            ["강우", <St key="a" text={dc.rain} />],
            ["수위", <St key="b" text={dc.waterLevel} />],
            ["레이더", <St key="c" text={dc.radar} />],
            ["영상", <St key="d" text={dc.video} />],
          ]}
        />
        <p className="s" style={{ fontSize: 11 }}>
          {dc.note}
        </p>
      </Group>
      <Group title="위험단계 기준 (TP-P22_002)">
        <StageCriteria rows={RV.riverStageCriteria.map((c) => ({ level: c.level, label: c.label, cells: [`계획홍수량 ${c.flowRatio}`, c.waterState] }))} />
      </Group>
      <Group title="조위 참고 — KHOA 모슬포">
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
    headline: (
      <>
        🏞️ <b>
          {worstRiver.name} {worstRiver.stage}
        </b>{" "}
        — 수위 {rb.waterLevel.value} ({rb.waterLevel.detail})
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
            <LiveBlock title="실시간 우량 관측" note="기상청 API허브 AWS 매분자료">
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
export function aquaConfig(isEmpty = false): DomainConfig {
  const s = isEmpty ? AQ.aquaSummaryEmpty : AQ.aquaSummary
  const rs = isEmpty ? AQ.aquaRiskStateEmpty : AQ.aquaRiskState
  const journeys = isEmpty ? AQ.aquaJourneysEmpty : AQ.aquaJourneys
  // 상세 탭(데이터·AI 예측·양식장·경보·대응)은 아직 데이터 모드 미연동 — Aqua 상세 페이지
  // (AquaHomePage 등)에서 먼저 연동했고, 이 보드 뷰의 나머지 탭은 다음 단계에서 이어서 연동한다.
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
    <LeaderBoardBrief brief={aquaBrief(isEmpty)}>
      <Group title="업무 흐름" dummy>
        <ul className="plist">
          {journeys.map((j) => (
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
      {/* e-SOP 대응·실시간 모니터링은 메뉴 없이 "경보 발송" 아래로 묶임(aquaNav.ts의 also) — 여기서 연다 */}
      <DetailLink to="/aqua/response">e-SOP 대응 상세 화면</DetailLink>
      <DetailLink to="/aqua/monitoring">실시간 모니터링 상세 화면</DetailLink>
    </>
  )
  const rsp = AQ.aquaResponseState
  const response = (
    <>
      <Box title={rsp.title} lines={[rsp.location, `탐지 ${rsp.detectedAt} · 도달 ${rsp.eta}`]} right={<Risk level={rsp.riskLevel} label={rsp.grade} />} />
      <Rows pairs={[["염분", rsp.salinity], ["수온", rsp.temperature], ["영향 반경", rsp.radius]]} />
      <Group title="e-SOP 단계" dummy>
        <Steps items={AQ.aquaStages.map((st) => ({ title: `${st.step}. ${st.label}`, sub: st.status, on: st.status === "진행 중" }))} />
      </Group>
      <Group title="조치 체크리스트" dummy>
        <ul className="plist">
          {AQ.aquaChecklist.map((c) => (
            <li key={c.id}>
              <div className="row-between">
                <span className="t">{c.label}</span>
                <St text={c.status} />
              </div>
              <p className="s">
                {c.owner} · {c.time}
              </p>
            </li>
          ))}
        </ul>
      </Group>
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
      <Group title="해양 관측 실측 (KHOA)">
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
  const responseTab = (
    <>
      {response}
      <Group title="실시간 모니터링">{monitor}</Group>
      <DetailLink to="/aqua/monitoring">실시간 모니터링 상세 화면</DetailLink>
    </>
  )
  const evs = AQ.aquaMonitoringEvents.map((e) => ({ icon: "●", time: e.time, lines: [e.title] }))
  return {
    id: "aqua",
    title: "저염분 고수온",
    mapDomain: "aqua",
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
      "/aqua/response": responseTab,
      "/aqua/closure": clos,
    }),
    right: [
      { key: "tl", label: "모니터링 이벤트", content: <Events items={evs} /> },
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
export function coastConfig(isEmpty = false): DomainConfig {
  const s = isEmpty ? CO.coastSummary : CO.coastSummaryIncident
  const aiInsights = isEmpty ? CO.coastAiInsights : CO.coastAiInsightsIncident
  const fieldAlerts = isEmpty ? CO.coastFieldAlerts : CO.coastFieldAlertsIncident
  // 상세 탭(이벤트 상세·현장 모니터링)은 아직 데이터 모드 미연동 — Coast 상세 페이지
  // (CoastEventDetailPage 등)에서 먼저 연동했고, 이 보드 뷰의 나머지 탭은 다음 단계에서 이어서 연동한다.
  // 상세 대시보드·현장 모니터링 상세 화면이 모두 보여주는 KHOA 보강 검토 — 두 탭에서 같이 쓴다
  const coastKhoaReview = (
    <Group title="KHOA 실측 기반 AI 보강 가능성 검토" dummy>
      <Box title={CO.coastKhoaEnhancementReview.summary} lines={CO.coastKhoaEnhancementReview.usable} right={<Risk level="warning" label={CO.coastKhoaEnhancementReview.feasible} />} />
      <Note tone="caution">실증사 요청 필요: {CO.coastKhoaEnhancementReview.vendorAsk}</Note>
    </Group>
  )
  const home = (
    <LeaderBoardBrief brief={coastBrief(isEmpty)}>
      <Group title="AI 판단" dummy>
        {aiInsights.map((a) => (
          <Box key={a.id} title={a.title} lines={[a.basis, a.match]} right={<Risk level={a.level} />} />
        ))}
      </Group>
      {coastKhoaReview}
      <Group title="현장 경보" dummy>
        <ul className="plist">
          {fieldAlerts.map((f) => (
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
      <Group title="해양관측부이 (KHOA)">
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
      { key: "tl", label: "이벤트", content: <Events items={evs} /> },
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

export const DOMAIN_CONFIGS: Record<string, (isEmpty?: boolean) => DomainConfig> = {
  "heavy-rain": heavyRainConfig,
  typhoon: typhoonConfig,
  heat: heatConfig,
  river: riverConfig,
  aqua: aquaConfig,
  coast: coastConfig,
}

