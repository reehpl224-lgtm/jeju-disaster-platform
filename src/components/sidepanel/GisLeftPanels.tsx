import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { IS_STAGING } from "../../data/appMode"
import { useCctvCameras, useCctvLoadState } from "../../data/cctvLive"
import { agencyStatuses, recentActions, riskMarkers } from "../../data/mockDashboard"
import { disasterResponseTeams } from "../../data/mockIncidents"
import { dutyContacts } from "../../data/mockContacts"
import { heatShelters } from "../../data/mockHeat"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { serviceShort, usePanelInput } from "../../data/panelInput"
import { useShelters } from "../../data/sheltersJeju"
import {
  SAMPLE_AGENCIES,
  SAMPLE_GIS_ACTIONS,
  SAMPLE_GIS_CCTV,
  SAMPLE_GIS_FACILITIES,
  SAMPLE_GIS_HEAT,
  SAMPLE_GIS_OBS,
  SAMPLE_GIS_RESOURCES,
  SAMPLE_GIS_RESPONSES,
  SAMPLE_GIS_SHELTERS,
  SAMPLE_GIS_TARGETS,
  SAMPLE_TEAMS,
  type GisRecv,
} from "../../data/sidePanelSamples"
import type { RiskLevel, RiskMarker } from "../../types/domain"
import { SpInputTag, SpRisk, SpSample } from "./primitives"
import { levelName, spLevel } from "./spUtils"

/**
 * 2단계 · GIS 상황 좌측 사이드패널(Figma "2단계 · GIS 상황 사이드패널" T1~T4) — 현황 · 관측·CCTV · 영향·자산 · 대응·연락.
 * 표시 규칙은 종합상황과 같다: 프로토타입·로컬은 있는 값 그대로, 스테이징은 임의의 값(샘플), 데이터 정보가 없으면 "샘플 · 데이터 없음".
 */
export type GisWhich = "status" | "obs" | "impact" | "response"
type Domain = RiskMarker["domain"] | "all"

const DOMAIN_LABEL: Record<string, string> = { river: "하천", coast: "연안", aqua: "저염분" }
const SERVICE_OPTIONS: { id: Domain; label: string }[] = [
  { id: "all", label: "서비스 전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "해안관측" },
  { id: "heavyRain", label: "호우" },
  { id: "typhoon", label: "태풍" },
  { id: "heat", label: "폭염" },
  { id: "wildfire", label: "산불" },
  { id: "tsunami", label: "지진해일" },
  { id: "snow", label: "대설" },
]
const RANK: Record<RiskLevel, number> = { danger: 5, alert: 4, warning: 3, caution: 2, safe: 1, info: 0, offline: -1 }
const LEVELS: RiskLevel[] = ["danger", "alert", "warning", "caution", "safe"]
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`

const Tag = ({ sample }: { sample: "none" | "sample" | "noData" | "input" }) =>
  sample === "sample" ? <SpSample /> : sample === "noData" ? <SpSample noData /> : sample === "input" ? <SpInputTag /> : null

/** 범위·서비스·기준 시각 줄 — 서비스 칩은 지도 분야 칩과 같은 상태 */
function Scope({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  return (
    <div className="sp-pills">
      <span className="sp-pill sp-pill--static">범위 제주 전체</span>
      <label className="sp-pill" style={{ padding: 0 }}>
        <select
          aria-label="서비스 선택"
          value={domain}
          onChange={(e) => onDomain(e.target.value as Domain)}
          style={{ background: "transparent", border: 0, color: "inherit", font: "inherit", padding: "6px 10px", cursor: "pointer" }}
        >
          {SERVICE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id} style={{ background: "#303233" }}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <span className="sp-pill sp-pill--static">기준 {hm(new Date())}{IS_STAGING ? " · 모의" : ""}</span>
    </div>
  )
}

function Card({ title, tag, children }: { title: ReactNode; tag?: ReactNode; children: ReactNode }) {
  return (
    <div className="sp-card sp-card--open spg-dark">
      <div className="sp-row">
        <b className="sp-h2" style={{ fontSize: 13 }}>{title}</b>
        {tag}
      </div>
      {children}
    </div>
  )
}

interface Target {
  id: string
  name: string
  domain: string
  level: RiskLevel
  value: string
  sub: string
}

/** T1 · 현황 — 지도에 표시되는 대상의 위험 요약과 목록 */
function StatusTab({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  const real: Target[] = riskMarkers.map((m) => ({
    id: m.id,
    name: m.name,
    domain: m.domain,
    level: m.level,
    value: m.value ?? m.salinity ?? m.temperature ?? "—",
    sub: DOMAIN_LABEL[m.domain] ?? m.domain,
  }))
  const useSample = IS_STAGING || real.length === 0
  const all: Target[] = useSample ? SAMPLE_GIS_TARGETS : real
  const tag = IS_STAGING ? "sample" : real.length === 0 ? "noData" : "none"
  const list = all.filter((t) => domain === "all" || t.domain === domain).sort((a, b) => RANK[b.level] - RANK[a.level])
  const byDomain = (d: string) => all.filter((t) => t.domain === d).length

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <Card title={`지도 표시 위험 대상 ${list.length}곳`} tag={<Tag sample={tag} />}>
        <div className="sp-pills">
          {LEVELS.map((l) => (
            <span key={l} className="sp-row" style={{ gap: 4 }}>
              <SpRisk level={l}>{levelName(l, "정상")}</SpRisk>
              <b>{list.filter((t) => t.level === l).length}</b>
            </span>
          ))}
        </div>
        <div className="sp-pills">
          {Object.entries(DOMAIN_LABEL).map(([d, label]) => (
            <button
              key={d}
              type="button"
              className="sp-risk sp-risk--warning"
              aria-pressed={domain === d}
              style={{ cursor: "pointer", fontWeight: domain === d ? 700 : 500, boxShadow: domain === d ? "0 0 0 1px var(--risk-warning)" : undefined }}
              onClick={() => onDomain(domain === d ? "all" : (d as Domain))}
            >
              {label} {byDomain(d)}
            </button>
          ))}
        </div>
        <p className="sp-note">서비스 칩 = 지도 분야 칩 · 누르면 서비스 선택 상태</p>
      </Card>
      {list.length === 0 && <p className="sp-note">이 서비스는 지도에 표시되는 대상이 없습니다</p>}
      {list.map((t) => (
        <div className={`sp-card sp-gis-row sp-gis-row--${spLevel(t.level)}`} key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <SpRisk level={t.level}>{levelName(t.level, "정상")}</SpRisk>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 13 }}>{t.name}</b>
            <span className="sp-sub">{t.sub}</span>
          </div>
          <b style={{ fontSize: 12 }}>{t.value}</b>
        </div>
      ))}
      <p className="sp-note">높은 단계 순</p>
    </div>
  )
}

const RECV: Record<GisRecv, { label: string; level: RiskLevel }> = {
  ok: { label: "수신 정상", level: "safe" },
  late: { label: "지연", level: "caution" },
  error: { label: "오류", level: "alert" },
  none: { label: "미연계", level: "offline" },
}

/** T2 · 관측·CCTV — 수집 상태 요약과 지점 목록, 제주시 감시 CCTV */
function ObsTab({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  const cameras = useCctvCameras()
  const load = useCctvLoadState()
  const cctvReal = load.phase === "ready" || load.phase === "partial"
  const cnt = (d: string) => cameras.filter((c) => c.domain === d).length
  const cctv = IS_STAGING || !cctvReal ? SAMPLE_GIS_CCTV : { coast: cnt("coast"), river: cnt("river"), snow: cnt("snow") }
  const cctvTag = IS_STAGING ? "sample" : cctvReal ? "none" : "noData"

  // 지점별 수신 상태 자료가 없다 — 어느 환경이든 샘플
  const points = SAMPLE_GIS_OBS.filter((p) => domain === "all" || p.domain === domain)
  const recvCount = (r: GisRecv) => points.filter((p) => p.recv === r).length

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <Card title={`관측 수집 현황 (지도 대상 ${points.length}곳)`} tag={<SpSample noData />}>
        <div className="sp-stats sp-stats--4">
          {(["ok", "late", "error", "none"] as GisRecv[]).map((r) => (
            <div
              className="sp-stat sp-stat--dark"
              key={r}
              style={{ alignItems: "flex-start", textAlign: "left", padding: "10px 6px", ...(r === "late" ? { borderColor: "var(--risk-caution)", borderWidth: 1.5 } : {}) }}
            >
              <small style={{ whiteSpace: "nowrap", fontSize: 10 }}>{RECV[r].label}</small>
              <b style={{ color: r === "late" ? "var(--risk-caution)" : r === "none" ? "var(--foreground-subtle)" : undefined }}>{recvCount(r)}</b>
            </div>
          ))}
        </div>
        <p className="sp-note">수집 상태는 위험등급 색과 분리 · 지점·장비 합계 중복 제거는 종합상황 R2에서</p>
      </Card>
      {Object.entries(DOMAIN_LABEL).map(([d, label]) => {
        const rows = points.filter((p) => p.domain === d)
        if (rows.length === 0) return null
        return (
          <div key={d} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <b className="sp-sub">{label}</b>
            {rows.map((p) => (
              <div className="sp-card" key={p.id} style={{ background: "var(--background-darker)", flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SpRisk level={RECV[p.recv].level}>{RECV[p.recv].label}</SpRisk>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 13 }}>{p.name}</b>
                  <span className="sp-sub">{p.note}</span>
                </div>
                <b style={{ fontSize: 12 }}>{p.value}</b>
              </div>
            ))}
          </div>
        )
      })}
      <div className="sp-dashed" style={{ gap: 8 }}>
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>제주시 감시 CCTV (공공데이터 API)</b>
          <Tag sample={cctvTag} />
        </div>
        {(
          [
            ["연안(월파) 감시", cctv.coast],
            ["하천 감시", cctv.river],
            ["대설(적설) 감시", cctv.snow],
          ] as [string, number][]
        ).map(([label, n]) => (
          <div className="sp-row" key={label}>
            <span>{label}</span>
            <span className="sp-spacer" />
            <b>{n}대</b>
          </div>
        ))}
        <p className="sp-note">사용 여부만 제공 · 영상은 &quot;영상 보기&quot;에서 재생 → CCTV 통합 조회</p>
      </div>
    </div>
  )
}

type Kind = "all" | "shelter" | "heat" | "mock"
const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "shelter", label: "대피소" },
  { id: "heat", label: "무더위쉼터" },
  { id: "mock", label: "모의 시설·자원" },
]

/** T3 · 영향·자산 — 쓸 수 있는 시설·자원(목록 중심, 좌표 없는 시설은 목록만) */
function ImpactTab({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  const [kind, setKind] = useState<Kind>("all")
  const shelters = useShelters()
  const heatLoaded = useHeatShelters()
  const show = (k: Kind) => kind === "all" || kind === k

  // 대피소 — 받아 둔 행안부 민방위 대피소 목록(앞 3곳)
  const civil = shelters.status === "ready" ? shelters.file.kinds.find((k) => k.id === "civil-defense") : undefined
  const shelterReal = !IS_STAGING && civil !== undefined
  const shelterRows: { name: string; place: string; capacity: number | null; current?: number }[] = shelterReal
    ? civil.items.slice(0, 3).map((i) => ({ name: i.name, place: i.region || i.address, capacity: i.capacity }))
    : SAMPLE_GIS_SHELTERS
  const shelterTitle = shelterReal ? `대피소 (민방위 ${civil.items.length}곳)` : "대피소 (개방 중 3곳)"
  const shelterTag = IS_STAGING ? "sample" : shelterReal ? "none" : "noData"

  // 무더위쉼터 — 받아 둔 행안부 쉼터 목록
  const heatReal = !IS_STAGING && heatLoaded && heatShelters.length > 0
  const heatRows = heatReal ? heatShelters.slice(0, 3).map((h) => ({ name: h.name, place: h.region, capacity: h.capacity })) : SAMPLE_GIS_HEAT
  const heatTag = IS_STAGING ? "sample" : heatReal ? "none" : "noData"

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <div className="sp-pills">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className="sp-pill" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      {show("shelter") && (
        <Card title={shelterTitle} tag={<Tag sample={shelterTag} />}>
          {shelterRows.map((s) => (
            <ShelterRow key={s.name} name={s.name} place={s.place} capacity={s.capacity} current={s.current} />
          ))}
          <p className="sp-note">좌표가 없으면 목록만 표시 · 거리·최단경로를 추정하지 않음{shelterReal ? " · 현재 수용 인원 자료 없음(정원만 표시)" : ""}</p>
        </Card>
      )}
      {kind === "heat" && (
        <Card title={`무더위쉼터${heatReal ? ` (${heatShelters.length}곳)` : ""}`} tag={<Tag sample={heatTag} />}>
          {heatRows.map((s) => (
            <ShelterRow key={s.name} name={s.name} place={s.place} capacity={s.capacity} />
          ))}
        </Card>
      )}
      {show("mock") && (
        <>
          <Card title="하천 모의 시설 (고정 카탈로그 · 실제 시설 아님)" tag={<SpSample noData />}>
            {SAMPLE_GIS_FACILITIES.map((f) => (
              <div className="sp-card spg-row" key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SpRisk level={f.state === "점검 대상" ? "info" : "offline"}>{f.state}</SpRisk>
                <b style={{ fontSize: 13 }}>{f.label}</b>
              </div>
            ))}
          </Card>
          <Card title="인력·장비 (하천 가상 자원 · 실제 보유량 아님)" tag={<SpSample noData />}>
            {SAMPLE_GIS_RESOURCES.map((r) => (
              <div className="sp-row" key={r.label}>
                <span>{r.label}</span>
                <span className="sp-spacer" />
                <b>
                  가용 {r.free} / {r.total}
                </b>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}

function ShelterRow({ name, place, capacity, current }: { name: string; place: string; capacity: number | null; current?: number }) {
  return (
    <div className="sp-card" style={{ background: "var(--background-darker)", flexDirection: "row", alignItems: "center", gap: 10 }}>
      <SpRisk level="safe">개방</SpRisk>
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <b style={{ display: "block", fontSize: 13 }}>{name}</b>
        <span className="sp-sub">
          {place} · {capacity === null ? "수용 정원 미등록" : current !== undefined ? `수용 ${current} / ${capacity}명` : `수용 정원 ${capacity}명`}
        </span>
      </div>
    </div>
  )
}

/** T4 · 대응·연락 — 누가 무엇을 하고 있나(처리는 상세 화면) */
function ResponseTab({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  const inp = usePanelInput()
  const ex = inp.responseExtra

  // 진행 중 대응 — 입력 패널의 '지금 해야 할 조치'를 서비스별로 묶는다. 스테이징은 임의의 값, 입력이 없으면 샘플(데이터 없음)
  const inputActions = !IS_STAGING ? inp.actions : undefined
  const resp: { service: string; state: string; level: RiskLevel; n: number }[] = inputActions
    ? Object.values(
        inputActions.reduce<Record<string, { service: string; state: string; level: RiskLevel; n: number }>>((acc, a) => {
          const k = `${a.service}-${a.state}`
          acc[k] ??= { service: serviceShort(a.service), state: a.state === "진행" ? "조치 진행" : "조치 대기", level: a.state === "진행" ? "caution" : "offline", n: 0 }
          acc[k].n++
          return acc
        }, {}),
      )
    : SAMPLE_GIS_RESPONSES
  const respTag = IS_STAGING ? "sample" : inputActions ? "input" : "noData"

  // 기관·대응팀 — 실제 목록이 있으면 그 값 → 입력값 → 샘플 (종합상황 대응현황과 같은 규칙)
  const agencyReal = !IS_STAGING && agencyStatuses.length > 0
  const teamsReal = !IS_STAGING && disasterResponseTeams.length > 0
  const useEx = !IS_STAGING && ex !== undefined
  const connected = agencyReal ? agencyStatuses.filter((a) => a.status === "connected").length : useEx ? ex.agenciesConnected : SAMPLE_AGENCIES.connected
  const agencyTotal = agencyReal ? agencyStatuses.length : useEx ? ex.agenciesTotal : SAMPLE_AGENCIES.total
  const issue = agencyReal ? agencyStatuses.filter((a) => a.status !== "connected").map((a) => a.agency).join(" · ") : useEx ? ex.agencyIssue : SAMPLE_AGENCIES.issue
  const teamCount = teamsReal ? disasterResponseTeams.filter((t) => t.status === "출동중").length : useEx ? ex.teams : SAMPLE_TEAMS.count
  const teamState = useEx ? ex.teamState : `${SAMPLE_TEAMS.state} 1`
  const exTag = IS_STAGING ? "sample" : useEx ? "input" : "noData"

  // 최근 조치·전파
  const actionsReal = !IS_STAGING && recentActions.length > 0
  const acts = actionsReal ? recentActions.slice(0, 2).map((a) => ({ id: a.id, time: a.time, text: `${a.title} · ${a.owner}` })) : SAMPLE_GIS_ACTIONS
  const actsTag = IS_STAGING ? "sample" : actionsReal ? "none" : "noData"

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <Card title="진행 중 대응 (서비스별)" tag={<Tag sample={respTag} />}>
        {resp.length === 0 && <p className="sp-note">진행 중인 대응이 없습니다</p>}
        {resp.map((r) => (
          <div className="sp-card spg-row" key={`${r.service}-${r.state}`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <SpRisk level={r.level}>{r.state}</SpRisk>
            <b style={{ fontSize: 13 }}>{r.service}</b>
            <span className="sp-spacer" />
            <span className="sp-sub">{r.n}건</span>
          </div>
        ))}
      </Card>
      <div className="sp-duo">
        <div className="sp-card spg-dark">
          <small>기관 연결</small>
          <b>
            {connected}/{agencyTotal}
          </b>
          {issue && <span className="sp-sub sp-c--caution">{issue}</span>}
          {!agencyReal && <Tag sample={exTag} />}
        </div>
        <div className="sp-card spg-dark">
          <small>현장 대응팀</small>
          <b>{teamCount}팀</b>
          <span className="sp-sub sp-c--caution">{teamState}</span>
          {!teamsReal && <Tag sample={exTag} />}
        </div>
      </div>
      <Card title="최근 조치·전파" tag={<Tag sample={actsTag} />}>
        {acts.map((a) => (
          <div className="sp-row" key={a.id} style={{ alignItems: "flex-start" }}>
            <b style={{ fontSize: 12 }}>{a.time}</b>
            <span style={{ flex: "1 1 0" }}>{a.text}</span>
          </div>
        ))}
        <Link className="sp-link" to="/propagation">
          상황전파·보고체계 전체 보기 →
        </Link>
      </Card>
      <Card title="당직·담당 연락">
        {[...dutyContacts.filter((c) => c.domain === "river"), ...dutyContacts.filter((c) => c.domain === "general")].slice(0, 2).map((c) => (
          <div className="sp-row" key={c.id}>
            <span style={{ flex: "1 1 0", minWidth: 0 }}>
              {c.role} {c.name}
            </span>
            <b>{c.phone}</b>
          </div>
        ))}
        <Link className="sp-link" to="/reports">
          이력·보고서 전체 조회 → <span style={{ fontWeight: 500 }}>(보고서 본문은 종합상황에서)</span>
        </Link>
      </Card>
    </div>
  )
}

export function GisLeftPanel({ which, domain, onDomain }: { which: GisWhich; domain: Domain; onDomain: (d: Domain) => void }) {
  if (which === "obs") return <ObsTab domain={domain} onDomain={onDomain} />
  if (which === "impact") return <ImpactTab domain={domain} onDomain={onDomain} />
  if (which === "response") return <ResponseTab domain={domain} onDomain={onDomain} />
  return <StatusTab domain={domain} onDomain={onDomain} />
}
