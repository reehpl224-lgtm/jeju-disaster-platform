import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Risk } from "../../components/board/BoardParts"
import { Box, Checks, Group, Kv, MiniChart, Note, Rows, St, SOURCE_LABEL, Steps, Tl } from "../../components/board/PanelParts"
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
      <Group title="발송 정보">
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
      <Group title="채널별 발송 결과">
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
      <Group title="사건 개요">
        <Rows pairs={info} />
      </Group>
      {c.aiSummary && (
        <Group title="AI 분석 요약">
          <Rows pairs={c.aiSummary.map((a) => [a.label, a.value] as [string, ReactNode])} />
        </Group>
      )}
      <Group title="관측 결과">
        <Rows pairs={c.observed.map((o) => [o.label, o.value] as [string, ReactNode])} />
      </Group>
      <Group title="종료 조건">
        <Checks items={c.closureConditions} />
      </Group>
      <Group title="보고서">
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
    <Group title={`관련 CCTV (${items.length})`}>
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

// ================================================================== 호우
export function heavyRainConfig(): DomainConfig {
  const f = HR.heavyRainAiForecast
  const home = (
    <>
      <Box title={`예보 ${f.forecastMm}mm/h 대비 실측 초과`} lines={[`감지 ${f.detectedAt}`]} right={<Risk level="warning" label="AI 조기경고" />} />
      <ul className="plist">
        {f.stations.map((s) => (
          <li className="row-between" key={s.id}>
            <span>{s.name}</span>
            <span className="t" style={{ color: "var(--risk-warning)" }}>
              실측 {s.observedMm}mm/h
            </span>
          </li>
        ))}
      </ul>
      <p className="pbox" style={{ marginTop: 8 }}>
        {f.aiNote}
      </p>
      <Note tone="caution">{f.confirmNote}</Note>
      <Group title="관측소 현황">
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
      </Group>
      <Group title="재해문자전광판·자동음성 송출">
        <Tl entries={HR.broadcastLog.map((b) => ({ time: b.time, title: `[${b.channel}] ${b.message}` }))} />
      </Group>
    </>
  )
  const analysis = (
    <>
      <Group title="강우 추이 (15분 간격)">
        <MiniChart
          data={HR.heavyRainTrend}
          keys={["rainfallMm", "cumulativeMm"]}
          colors={["#0054a3", "#f2731a"]}
          names={["15분 강우(mm)", "누적(mm)"]}
          xkey="time"
          refLine={{ y: f.forecastMm, label: `예보 ${f.forecastMm}mm/h` }}
        />
      </Group>
      <Group title="누적 강우 순위">
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
    tabs: [
      { key: "home", label: "대시보드", to: "/heavy-rain/dashboard", content: home },
      { key: "analysis", label: "상세 분석", to: "/heavy-rain/analysis", content: analysis },
      { key: "alert", label: "경보 발송", to: "/heavy-rain/alert", content: <Dispatch d={ad} /> },
      { key: "closure", label: "종료 보고", to: "/heavy-rain/closure", content: <Closure c={HR.heavyRainClosure} /> },
    ],
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
export function typhoonConfig(): DomainConfig {
  const rp = TY.typhoonReports
  const cur = rp[0]
  const trk = TY.typhoonForecastTrack
  const home = (
    <>
      <Box title={cur.name} lines={[cur.location, `발표 ${cur.issuedAt}`]} right={<Risk level="alert" label={cur.status} />} />
      <Kv
        items={[
          { k: "이동 속도", v: `${cur.speedKmh}km/h` },
          { k: "중심 기압", v: `${cur.pressureHpa}hPa` },
          { k: "최대 풍속", v: `${cur.maxWindMs}m/s` },
          { k: "제주까지", v: `${trk[0].distanceFromJejuKm}km` },
        ]}
      />
      <p className="pbox" style={{ marginTop: 8 }}>
        {TY.typhoonSource.note}
        <br />
        <span className="s">연계: {TY.typhoonSource.relatedLegacySystem}</span>
      </p>
      <Group title="해양관측부이 (KHOA)">
        <Buoys />
      </Group>
    </>
  )
  const analysis = (
    <>
      <Group title="예상 경로 — 제주와의 거리">
        <MiniChart
          data={trk.map((p) => ({ ...p, t: p.time.slice(5, 13).replace("-", "/") }))}
          keys={["distanceFromJejuKm", "maxWindMs"]}
          colors={["#f8390d", "#4f9be0"]}
          names={["제주까지 거리(km)", "최대풍속(m/s)"]}
          xkey="t"
        />
      </Group>
      <Group title="예상 경로">
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
      <Group title="발표 이력">
        <ul className="plist">
          {rp.map((r) => (
            <li className="row-between" key={r.id}>
              <span>
                {r.issuedAt.slice(5)} · {r.location}
              </span>
              <Risk level={r.status === "태풍경보" ? "alert" : r.status === "태풍주의보" ? "warning" : "caution"} label={r.status} />
            </li>
          ))}
        </ul>
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
    tabs: [
      { key: "home", label: "대시보드", to: "/typhoon/dashboard", content: home },
      { key: "analysis", label: "경로 분석", to: "/typhoon/analysis", content: analysis },
      { key: "alert", label: "대비 발령", to: "/typhoon/alert", content: <Dispatch d={TY.typhoonAlertDispatch} /> },
      { key: "closure", label: "종료 보고", to: "/typhoon/closure", content: <Closure c={TY.typhoonClosure} /> },
    ],
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
export function heatConfig(): DomainConfig {
  const li = HT.heatLevelInfo
  const home = (
    <>
      <Box
        title={li.label}
        lines={[`체감온도 ${li.feelsLikeC}℃ · ${li.updatedAt} 기준`, li.criteria]}
        right={<Risk level={li.level} label={li.label} />}
      />
      <Group title="무더위쉼터">
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
      <Group title="이동 경로 안내">
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
    </>
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
      <Group title="최근 5일 기온">
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
    tabs: [
      { key: "home", label: "대시보드", to: "/heat/dashboard", content: home },
      { key: "analysis", label: "특보 현황", to: "/heat/analysis", content: analysis },
      { key: "alert", label: "안내 발송", to: "/heat/alert", content: <Dispatch d={d} /> },
      { key: "closure", label: "해제 보고", to: "/heat/closure", content: <Closure c={HT.heatClosure} /> },
    ],
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
export function riverConfig(): DomainConfig {
  const rb = RV.riverRiskBasis
  const sr = RV.riverSuddenRainAlert
  const tg = RV.riverTarget
  const home = (
    <>
      <ul className="plist">
        {RV.riverStatuses.map((s) => (
          <li key={s.id}>
            <div className="row-between">
              <span className="t">{s.name}</span>
              <Risk level={s.level} label={s.stage} />
            </div>
            <p className="s">
              범람 도달 {s.eta} · 갱신 {s.updatedAt}
            </p>
          </li>
        ))}
      </ul>
      <Note>
        {RV.riverSopStage.current} — {RV.riverSopStage.next}
      </Note>
      <Group title="위험 판단 근거">
        <Kv
          items={[
            { k: "강우량", v: rb.rainfall.value, d: `${rb.rainfall.detail} ${rb.rainfall.trend}` },
            { k: "수위", v: rb.waterLevel.value, d: `${rb.waterLevel.detail} ${rb.waterLevel.trend}` },
            { k: "레이더", v: rb.radar.value, d: `${rb.radar.detail} · ${rb.radar.confidence}` },
            { k: "토양 포화도", v: rb.saturation.value, d: rb.saturation.detail },
          ]}
          over={["강우량", "수위"]}
        />
      </Group>
      <Group title="돌발 강우 감지">
        <Box
          title={`예보 ${sr.forecastMm}mm → 실측 ${sr.observedMm}mm`}
          lines={[`감지 ${sr.detectedAt} · ${sr.trendNote}`, sr.aiNote]}
          right={<Risk level="danger" label="초과" />}
        />
        <Note tone="caution">{sr.confirmNote}</Note>
      </Group>
      <Group title="승인 이력">
        <Tl entries={RV.riverApprovalHistory} />
      </Group>
      <Group title="감시 대상">
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
    </>
  )
  const tc = RV.riverTideCorrelation
  const im = RV.riverImpact
  const dc = RV.riverDataConfidence
  const analysis = (
    <>
      <Group title={`수위·조위 상관 — ${tc.location}`}>
        <MiniChart
          data={tc.series}
          keys={["waterLevelM", "tideLevelM"]}
          colors={["#0054a3", "#8ec21f"]}
          names={["수위(m)", "조위(m)"]}
          xkey="time"
          refLine={{ y: tc.boundaryLevelM, label: `경계 ${tc.boundaryLevelM}m` }}
        />
        <p className="s" style={{ fontSize: 11, marginTop: 4 }}>
          15:00 이후 예측값 · 다음 만조 {tc.nextHighTide}
        </p>
        <p className="pbox" style={{ marginTop: 6 }}>
          {tc.note}
        </p>
      </Group>
      <Group title="영향 범위">
        <Rows pairs={[["면적", im.area], ["인구", im.population], ["시설", im.facilities], ["대피 경로", im.evacuationRoutes]]} />
      </Group>
      <Group title="센서 교차검증">
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
      </Group>
      <Group title="CCTV 확인">
        <Rows
          pairs={RV.riverCctv.map((c) => [c.label, <span key={c.id}>{c.detected} · {c.quality} <span className="s">{c.time}</span></span>] as [string, ReactNode])}
        />
      </Group>
      <Group title={`데이터 신뢰도 — ${dc.overall}`}>
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
      <Group title="조치 실패">
        {RV.riverControlFailures.map((f) => (
          <Box key={f.id} title={f.title} lines={[`${f.time} · ${f.cause}`, f.action]} right={<Risk level="danger" label="실패" />} />
        ))}
      </Group>
      <Group title="전파 현황">
        <Rows pairs={RV.riverPropagation.map((p) => [p.channel, <St key={p.channel} text={p.status} lv={p.status.includes("미전달") ? "warning" : "safe"} />] as [string, ReactNode])} />
      </Group>
    </>
  )
  const dr = RV.riverDispatchRequest
  const disp = (
    <>
      <Box
        title={dr.target}
        lines={[`도달 예상 ${dr.eta}`, dr.impact, `요청 ${dr.requestedAt} · ${dr.requester}`]}
        right={<Risk level="alert" label={dr.stage.replace("⚠ ", "")} />}
      />
      <Group title="위험 분석">
        <Checks items={dr.analysis} />
      </Group>
      <Group title="처리 과정">
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
        🏞️ <b>효돈천(쇠소깍) 3단계 · 심각</b> — 수위 {rb.waterLevel.value} ({rb.waterLevel.detail})
      </>
    ),
    tabs: [
      { key: "home", label: "대시보드", to: "/river/dashboard", content: home },
      { key: "analysis", label: "상황 분석", to: "/river/analysis", content: analysis },
      { key: "alert", label: "경보 발송", to: "/river/alert", content: <Dispatch d={RV.riverAlertDispatch} /> },
      { key: "control", label: "현장 통제", to: "/river/control", content: control },
      { key: "dispatch", label: "출동 요청", to: "/river/dispatch", content: disp },
      { key: "closure", label: "종료 보고", to: "/river/closure", content: <Closure c={RV.riverClosure} /> },
    ],
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
  const home = (
    <>
      <Kv
        items={[
          { k: "활성 위험", v: `${s.activeRisk.count}건`, d: s.activeRisk.detail },
          { k: "승인 대기", v: `${s.pendingApproval.count}건`, d: s.pendingApproval.detail },
          { k: "영향 양식장", v: `${s.affectedFarms.count}개소`, d: s.affectedFarms.detail },
          { k: "데이터 품질", v: `${s.dataQuality.percent}%`, d: s.dataQuality.detail },
        ]}
        over={["활성 위험"]}
      />
      <Group title="업무 흐름">
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
      <Group title="감시 대상">
        <Rows pairs={[["해역", s.targetArea], ["공간 해상도", s.spatialResolution], ["AI 라벨", s.aiLabels.join(" · ")]]} />
      </Group>
      <RelatedCams domain="aqua" />
    </>
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
      <Group title="수집 이상">
        {AQ.aquaDataIssues.map((i) => (
          <Box
            key={i.id}
            title={i.title}
            lines={[i.cause, `영향: ${i.impact}`]}
            right={<St text={SOURCE_LABEL[i.type] ?? i.type} lv={i.type === "delayed" ? "warning" : "danger"} />}
          />
        ))}
      </Group>
      <Group title="조치 이력">
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
      <Box title={rs.level} lines={[rs.headline, `신뢰도 ${rs.confidence}% · 갱신 ${rs.updatedAt}`]} right={<Risk level="alert" label="고위험" />} />
      <Kv
        items={[
          { k: "저염분수 도달", v: rs.lowSalinity.eta, d: `${rs.lowSalinity.time} · ${rs.lowSalinity.location}` },
          { k: "고수온 도달", v: rs.highTemp.eta, d: `${rs.highTemp.time} · ${rs.highTemp.location}` },
          { k: "영향 양식장", v: `${rs.affectedFarmCount}개소`, d: rs.affectedFarmDelta },
        ]}
        over={["저염분수 도달"]}
      />
      <Group title="모델별 신뢰도">
        <Rows pairs={AQ.aquaModelConfidence.map((m) => [m.name, `${m.percent}%`] as [string, ReactNode])} />
      </Group>
      <Group title="입력 데이터 품질">
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
      <Group title="대표 양식장">
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
      <Box title={`${ad.riskType} ${ad.grade} 경보 초안`} lines={[`${ad.region} · ${ad.effectiveAt} · 유효 ${ad.validFor}`]} right={<Risk level="danger" label={ad.grade} />} />
      <Group title="영향">
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
      <Group title="발송 채널">
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
      <Group title="근거 검증">
        <Rows pairs={[["모델 신뢰도", `${ad.confidence}%`], ["위성 일치", ad.satelliteMatch], ["현장 편차", ad.fieldDelta]]} />
      </Group>
      <Group title="승인 단계">
        <Steps items={ad.approvalSteps.map((a) => ({ title: a.stage, sub: `${a.owner} · ${a.time}` }))} />
      </Group>
      <Group title="감사 기록">
        <Tl entries={ad.audit} />
      </Group>
    </>
  )
  const rsp = AQ.aquaResponseState
  const response = (
    <>
      <Box title={rsp.title} lines={[rsp.location, `탐지 ${rsp.detectedAt} · 도달 ${rsp.eta}`]} right={<Risk level="danger" label={rsp.grade} />} />
      <Rows pairs={[["염분", rsp.salinity], ["수온", rsp.temperature], ["영향 반경", rsp.radius]]} />
      <Group title="e-SOP 단계">
        <Steps items={AQ.aquaStages.map((st) => ({ title: `${st.step}. ${st.label}`, sub: st.status, on: st.status === "진행 중" }))} />
      </Group>
      <Group title="조치 체크리스트">
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
      <Group title="대응 경과">
        <Tl entries={AQ.aquaClosureTimeline} />
      </Group>
      <Group title="예측 검증">
        <Rows pairs={[["예측 염분", cp.predictedSalinity], ["실측 염분", cp.actualSalinity], ["오차", cp.error]]} />
        <Checks items={cp.reasoning} />
      </Group>
      <Group title="재학습">
        <Rows pairs={[["대상", rt.target], ["상태", rt.status], ["갱신", rt.updatedAt]]} />
      </Group>
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
    tabs: [
      { key: "home", label: "홈", to: "/aqua/dashboard", content: home },
      { key: "data", label: "데이터 수집", to: "/aqua/data", content: data },
      { key: "prediction", label: "AI 예측", to: "/aqua/prediction", content: pred },
      { key: "farms", label: "영향 양식장", to: "/aqua/farms", content: farms },
      { key: "alerts", label: "경보 승인", to: "/aqua/alerts", content: alert },
      { key: "response", label: "e-SOP 대응", to: "/aqua/response", content: response },
      { key: "monitoring", label: "실시간 모니터링", to: "/aqua/monitoring", content: monitor },
      { key: "closure", label: "종료 보고", to: "/aqua/closure", content: clos },
    ],
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
export function coastConfig(): DomainConfig {
  const s = CO.coastSummary
  const home = (
    <>
      <Kv
        items={[
          { k: "진행 중 이벤트", v: `${s.activeEvents.count}건`, d: s.activeEvents.detail },
          { k: "미확인", v: `${s.unconfirmedEvents.count}건`, d: s.unconfirmedEvents.detail },
          { k: "기관 공조", v: `${s.coordination.count}건`, d: s.coordination.detail },
          { k: "장비", v: `정상 ${s.equipment.normal} · 오류 ${s.equipment.error}`, d: s.equipment.detail },
        ]}
        over={["미확인"]}
      />
      <Group title="AI 판단">
        {CO.coastAiInsights.map((a) => (
          <Box key={a.id} title={a.title} lines={[a.basis, a.match]} right={<Risk level={a.level} />} />
        ))}
      </Group>
      <Group title="현장 경보">
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
      <Group title="AIoT 스마트폴">
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
      <Group title="감시 대상">
        <Rows pairs={[["해수욕장", s.targetArea], ["인프라", s.infra], ["AI 라벨", s.aiLabels.join(" · ")]]} />
        <p className="s" style={{ fontSize: 11 }}>
          {s.permitNote}
        </p>
      </Group>
      <RelatedCams domain="coast" />
    </>
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
      <Group title="주변 위험 요소">
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
      <Group title="관측">
        <Kv
          items={[
            { k: "강우", v: d.rainSummary.value, d: d.rainSummary.detail },
            { k: "파고", v: d.waveSummary.value, d: d.waveSummary.detail },
            { k: "이안류 위험", v: d.ripCurrentRisk.value, d: `${d.ripCurrentRisk.detail} · ${d.ripCurrentRisk.confidence}` },
          ]}
        />
      </Group>
      <Group title="영상 탐지">
        <p className="pbox">
          {d.detection.class}
          <br />
          <span className="s">{d.detection.confidence}</span>
        </p>
      </Group>
      <Group title="센서 교차검증">
        <Rows pairs={d.sensorCrossCheck.map((x) => [x.name, <St key={x.id} text={x.status} lv={x.status === "정상" ? "safe" : "warning"} />] as [string, ReactNode])} />
      </Group>
      <Group title="현장 조치">
        <Rows pairs={[["출동", d.fieldActions.dispatch], ["통제", d.fieldActions.control], ["경보", d.fieldActions.alert]]} />
      </Group>
    </>
  )
  const alerts = (
    <>
      <ul className="plist">
        {CO.coastEvents.map((e) => (
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
      <Group title="선택 이벤트 경과">
        <Tl entries={d.timeline} />
      </Group>
      <Group title="기관 상태">
        <Rows pairs={d.agencyStatus.map((a) => [a.agency, <St key={a.id} text={a.status} />] as [string, ReactNode])} />
      </Group>
    </>
  )
  const dp = CO.coastDispatch
  const rq = dp.request
  const dispatch = (
    <>
      <Box title={dp.summary.title} lines={[dp.summary.location, `탐지 ${dp.summary.detectedAt}`]} right={<Risk level="danger" label={dp.summary.level} />} />
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
      <Group title="출동 요청">
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
    tabs: [
      { key: "home", label: "연안 관제", to: "/coast/dashboard", content: home },
      { key: "events", label: "위험 이벤트", to: "/coast/events", content: detail },
      { key: "alerts", label: "경보 승인", to: "/coast/alerts", content: alerts },
      { key: "dispatch", label: "현장 공조", to: "/coast/dispatch", content: dispatch },
      { key: "monitoring", label: "현장 모니터링", to: "/coast/monitoring", content: monitor },
      { key: "closure", label: "종료 보고", to: "/coast/closure", content: <Closure c={CO.coastClosure} /> },
    ],
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
      { key: "live", label: "실시간 연동", content: <Live>{LIVE_MARINE}{liveWarnings(["V", "O", "N"], "실시간 풍랑·해일 특보")}{LIVE_FORECAST}</Live> },
    ],
  }
}

export const DOMAIN_CONFIGS: Record<string, () => DomainConfig> = {
  "heavy-rain": heavyRainConfig,
  typhoon: typhoonConfig,
  heat: heatConfig,
  river: riverConfig,
  aqua: aquaConfig,
  coast: coastConfig,
}

