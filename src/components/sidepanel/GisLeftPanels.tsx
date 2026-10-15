import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { IS_STAGING } from "../../data/appMode"
import { cctvStatusLabel, useCctvCameras, useCctvLoadState } from "../../data/cctvLive"
import { agencyStatuses, recentActions } from "../../data/mockDashboard"
import { disasterResponseTeams } from "../../data/mockIncidents"
import { dutyContacts } from "../../data/mockContacts"
import { heatShelters } from "../../data/mockHeat"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { serviceShort, usePanelInput } from "../../data/panelInput"
import { useShelters } from "../../data/sheltersJeju"
import {
  SAMPLE_AGENCIES,
  SAMPLE_GIS_ACTIONS,
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
import { ObsMoreDialog, type ObsItem } from "./ObsMoreDialog"
import { SpInputTag, SpRisk, SpSample } from "./primitives"
import { levelName, spLevel } from "./spUtils"

/**
 * 2단계 · GIS 상황 좌측 사이드패널(Figma "2단계 · GIS 상황 사이드패널" T1~T4) — 현황 · 관측·CCTV · 영향·자산 · 대응·연락.
 * 표시 규칙(스테이징·프로토타입 공통): 받은 실제 값이 있으면 그 값. 없을 때만 스테이징은 임의의 값("샘플"), 프로토타입·로컬은 값을 비우고 "데이터 없음".
 */
export type GisWhich = "status" | "obs" | "impact" | "response"
type Domain = RiskMarker["domain"] | "all"

const DOMAIN_LABEL: Record<string, string> = { river: "하천", coast: "연안", aqua: "저염분", heavyRain: "호우", typhoon: "태풍", heat: "폭염", wildfire: "산불", tsunami: "지진해일", snow: "대설" }
// [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 화면 목록에서 뺌 — 복원하려면 filter 제거
const VISIBLE_DOMAINS = Object.entries(DOMAIN_LABEL).filter(([d]) => d !== "heat" && d !== "wildfire")
const SERVICE_OPTIONS: { id: Domain; label: string }[] = [
  { id: "all", label: "서비스 전체" },
  { id: "river", label: "하천" },
  { id: "coast", label: "연안" },
  { id: "aqua", label: "해안관측" },
  { id: "heavyRain", label: "호우" },
  { id: "typhoon", label: "태풍" },
  // [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 화면에서 뺌 — 복원하려면 아래 주석을 해제
  // { id: "heat", label: "폭염" },
  // { id: "wildfire", label: "산불" },
  { id: "tsunami", label: "지진해일" },
  { id: "snow", label: "대설" },
]
const RANK: Record<RiskLevel, number> = { danger: 5, alert: 4, warning: 3, caution: 2, safe: 1, info: 0, offline: -1 }
// 위험 단계 태그는 심각·경계·주의·정상 4단계만 — 징후(관심)는 단계가 아니라 정상 안의 참고 표시라 정상으로 센다
const LEVELS: RiskLevel[] = ["danger", "alert", "warning", "safe"]
/** 정상은 처음 이만큼만 보이고, "더보기"를 누를 때마다 이만큼씩 더 보인다 */
const SAFE_FIRST = 3
const SAFE_MORE = 5
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`

/** 실제 값이 없을 때의 표식 — 스테이징은 "샘플", 프로토타입·로컬은 "데이터 없음"(값을 비운다) */
const MISSING: "sample" | "noData" = IS_STAGING ? "sample" : "noData"

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
      <span className="sp-pill sp-pill--static">기준 {hm(new Date())}</span>
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
function StatusTab({ domain, onDomain, markers }: { domain: Domain; onDomain: (d: Domain) => void; markers: RiskMarker[] }) {
  const real: Target[] = markers.map((m) => ({
    id: m.id,
    name: m.name,
    domain: m.domain,
    level: m.level === "caution" ? "safe" : m.level,
    value: m.value ?? m.salinity ?? m.temperature ?? "—",
    sub: DOMAIN_LABEL[m.domain] ?? m.domain,
  }))
  const all: Target[] = real.length === 0 ? (IS_STAGING ? SAMPLE_GIS_TARGETS : []) : real
  const tag = real.length === 0 ? MISSING : "none"
  const list = all.filter((t) => domain === "all" || t.domain === domain).sort((a, b) => RANK[b.level] - RANK[a.level])
  // 심각 > 경계 > 주의 > 정상 순. 정상은 3건까지만 먼저 보여주고 "더보기"를 누르면 5건씩 늘린다(서비스를 바꾸면 처음으로)
  const [more, setMore] = useState({ domain, shown: SAFE_FIRST })
  const safeShown = more.domain === domain ? more.shown : SAFE_FIRST
  const staged = list.filter((t) => t.level !== "safe")
  const safe = list.filter((t) => t.level === "safe")
  const rows = [...staged, ...safe.slice(0, safeShown)]
  const safeLeft = safe.length - safeShown
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
          {VISIBLE_DOMAINS.map(([d, label]) => (
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
      {rows.map((t) => (
        <div className={`sp-card sp-gis-row sp-gis-row--${spLevel(t.level)}`} key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <SpRisk level={t.level}>{levelName(t.level, "정상")}</SpRisk>
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 13 }}>{t.name}</b>
            <span className="sp-sub">{t.sub}</span>
            {/* 값이 긴 문장이면 이름 칸을 좁히지 않도록 아래 줄로 내린다 */}
            {t.value.length > 12 && <span className="sp-sub" style={{ display: "block", color: "var(--foreground)" }}>{t.value}</span>}
          </div>
          {t.value.length <= 12 && <b style={{ fontSize: 12, flex: "none" }}>{t.value}</b>}
        </div>
      ))}
      {safeLeft > 0 && (
        <button type="button" className="sp-more" onClick={() => setMore({ domain, shown: safeShown + SAFE_MORE })}>
          더보기 (정상 {Math.min(SAFE_MORE, safeLeft)}건 더 · 남은 {safeLeft}건)
        </button>
      )}
      <p className="sp-note">높은 단계 순 · 정상은 {SAFE_FIRST}건씩 먼저 보이고 더보기를 누르면 {SAFE_MORE}건씩 늘어납니다</p>
    </div>
  )
}

const RECV: Record<GisRecv, { label: string; level: RiskLevel }> = {
  ok: { label: "수신 정상", level: "safe" },
  late: { label: "지연", level: "caution" },
  error: { label: "오류", level: "alert" },
  none: { label: "미연계", level: "offline" },
}

/** CCTV 분야 이름 — CCTV 통합 조회의 '분야' 목록과 같다. 관측 목록에서는 이 분야가 항목 구분값(하천·연안·저염분·대설)으로 들어간다 */
const CCTV_FIELD_LABEL: Record<string, string> = { river: "하천", coast: "월파(연안)", snow: "적설(대설)", aqua: "해안관측", general: "일반" }
/** 항목 목록이 이 건수를 넘으면 5건만 보이고 '더보기'로 상세 페이지를 연다 */
const LIST_LIMIT = 5
/** 관측·CCTV 목록의 항목 — 서비스 항목에 CCTV 분야 '일반'(도심·관광지 관제용, 서비스 항목에 속하지 않음)을 더한다 */
const OBS_GROUPS: [string, string][] = [...VISIBLE_DOMAINS, ["general", "일반"]]

/** T2 · 관측·CCTV — 수집 상태 요약과 지점 목록, 제주시 감시 CCTV */
function ObsTab({ domain, onDomain }: { domain: Domain; onDomain: (d: Domain) => void }) {
  const cameras = useCctvCameras()
  const load = useCctvLoadState()
  const cctvReal = load.phase === "ready" || load.phase === "partial"
  // '더보기'로 연 항목 — 팝업이 그 항목의 관측 지점과 CCTV를 모두 보여 준다
  const [moreOf, setMoreOf] = useState<string | null>(null)

  // 지점별 수신 상태 자료가 없다 — 어느 환경이든 샘플(스테이징 "샘플", 프로토타입 "샘플 · 데이터 없음")
  const points = (IS_STAGING ? SAMPLE_GIS_OBS : []).filter((p) => domain === "all" || p.domain === domain)
  const recvCount = (r: GisRecv) => points.filter((p) => p.recv === r).length
  // 한 항목의 목록 — 관측 지점을 먼저, 같은 분야의 CCTV를 뒤에(CCTV 분야 이름이 구분값)
  const obsItems = (d: string): ObsItem[] => [
    ...points
      .filter((p) => p.domain === d)
      .map((p) => ({ key: p.id, level: RECV[p.recv].level, tag: RECV[p.recv].label, name: p.name, sub: p.note, value: p.value })),
    ...cameras
      .filter((c) => c.domain === d)
      .map((c) => ({
        key: c.id,
        level: (c.status === "online" ? "safe" : "offline") as RiskLevel,
        tag: cctvStatusLabel(c),
        name: c.name,
        sub: `${CCTV_FIELD_LABEL[c.domain]} · CCTV · ${c.operator}`,
        value: "CCTV",
        cam: c,
      })),
  ]

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <Card title={IS_STAGING ? `관측 수집 현황 (지도 대상 ${points.length}곳)` : "관측 수집 현황"} tag={<Tag sample={MISSING} />}>
        <div className="sp-stats sp-stats--4">
          {(["ok", "late", "error", "none"] as GisRecv[]).map((r) => (
            <div
              className="sp-stat sp-stat--dark"
              key={r}
              style={{ alignItems: "flex-start", textAlign: "left", padding: "10px 6px", ...(r === "late" ? { borderColor: "var(--risk-caution)", borderWidth: 1.5 } : {}) }}
            >
              <small style={{ whiteSpace: "nowrap", fontSize: 10 }}>{RECV[r].label}</small>
              <b style={{ color: r === "late" ? "var(--risk-caution)" : r === "none" ? "var(--foreground-subtle)" : undefined }}>{IS_STAGING ? recvCount(r) : "—"}</b>
            </div>
          ))}
        </div>
        <p className="sp-note">{IS_STAGING ? "수집 상태는 위험등급 색과 분리 · 지점·장비 합계 중복 제거는 종합상황 R2에서" : "지점별 수신 상태 자료가 연계되지 않았습니다"}</p>
      </Card>
      {OBS_GROUPS.map(([d, label]) => {
        if (domain !== "all" && d !== domain) return null
        const items = obsItems(d)
        if (items.length === 0 && d !== "general") return null
        const rest = items.length - LIST_LIMIT
        return (
          <div key={d} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <b className="sp-sub">{label}</b>
            {items.length === 0 && <p className="sp-note">{IS_STAGING || cctvReal ? "해당 CCTV 없음" : "CCTV 목록 연계 전"}</p>}
            {items.slice(0, LIST_LIMIT).map((it) => (
              <div className="sp-card" key={it.key} style={{ background: "var(--background-darker)", flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SpRisk level={it.level}>{it.tag}</SpRisk>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 13 }}>{it.name}</b>
                  <span className="sp-sub">{it.sub}</span>
                </div>
                <b style={{ fontSize: 12 }}>{it.value}</b>
              </div>
            ))}
            {rest > 0 && (
              <button
                type="button"
                onClick={() => setMoreOf(d)}
                style={{ alignSelf: "center", fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "4px 14px", cursor: "pointer" }}
              >
                더보기 (+{rest}건)
              </button>
            )}
          </div>
        )
      })}
      <p className="sp-note">
        {cctvReal ? "CCTV는 제주시 공공데이터 API 목록 — " : "CCTV 목록을 받는 중이거나 연계 전 — "}사용 여부만 제공 · 영상은 &quot;영상 보기&quot;에서 재생 → CCTV 통합 조회
      </p>
      {moreOf && (
        <ObsMoreDialog
          title={OBS_GROUPS.find(([d]) => d === moreOf)?.[1] ?? ""}
          items={obsItems(moreOf)}
          cctvTo={cameras.some((c) => c.domain === moreOf) ? `/dashboard?tab=cctv&cctv=${moreOf}` : undefined}
          onClose={() => setMoreOf(null)}
        />
      )}
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
  const shelterReal = civil !== undefined
  const shelterRows: { name: string; place: string; capacity: number | null; current?: number }[] = shelterReal
    ? civil.items.slice(0, 3).map((i) => ({ name: i.name, place: i.region || i.address, capacity: i.capacity }))
    : IS_STAGING
      ? SAMPLE_GIS_SHELTERS
      : []
  const shelterTitle = shelterReal ? `대피소 (민방위 ${civil.items.length}곳)` : IS_STAGING ? "대피소 (개방 중 3곳)" : "대피소"
  const shelterTag = shelterReal ? "none" : MISSING

  // 무더위쉼터 — 받아 둔 행안부 쉼터 목록
  const heatReal = heatLoaded && heatShelters.length > 0
  const heatRows = heatReal ? heatShelters.slice(0, 3).map((h) => ({ name: h.name, place: h.region, capacity: h.capacity })) : IS_STAGING ? SAMPLE_GIS_HEAT : []
  const heatTag = heatReal ? "none" : MISSING

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
          {shelterRows.length === 0 && <p className="sp-note">받아 둔 대피소 목록이 없습니다</p>}
          <p className="sp-note">좌표가 없으면 목록만 표시 · 거리·최단경로를 추정하지 않음{shelterReal ? " · 현재 수용 인원 자료 없음(정원만 표시)" : ""}</p>
        </Card>
      )}
      {kind === "heat" && (
        <Card title={`무더위쉼터${heatReal ? ` (${heatShelters.length}곳)` : ""}`} tag={<Tag sample={heatTag} />}>
          {heatRows.length === 0 && <p className="sp-note">받아 둔 무더위쉼터 목록이 없습니다</p>}
          {heatRows.map((s) => (
            <ShelterRow key={s.name} name={s.name} place={s.place} capacity={s.capacity} />
          ))}
        </Card>
      )}
      {show("mock") && (
        <>
          <Card title="하천 모의 시설 (고정 카탈로그 · 실제 시설 아님)" tag={<Tag sample={MISSING} />}>
            {!IS_STAGING && <p className="sp-note">연계된 시설 자료가 없습니다</p>}
            {(IS_STAGING ? SAMPLE_GIS_FACILITIES : []).map((f) => (
              <div className="sp-card spg-row" key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <SpRisk level={f.state === "점검 대상" ? "info" : "offline"}>{f.state}</SpRisk>
                <b style={{ fontSize: 13 }}>{f.label}</b>
              </div>
            ))}
          </Card>
          <Card title="인력·장비 (하천 가상 자원 · 실제 보유량 아님)" tag={<Tag sample={MISSING} />}>
            {!IS_STAGING && <p className="sp-note">연계된 인력·장비 자료가 없습니다</p>}
            {(IS_STAGING ? SAMPLE_GIS_RESOURCES : []).map((r) => (
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

  // 진행 중 대응 — 입력 패널의 '지금 해야 할 조치'를 서비스별로 묶는다. 입력이 없으면 샘플(스테이징 "샘플", 프로토타입 "데이터 없음")
  const inputActions = inp.actions
  const resp: { service: string; state: string; level: RiskLevel; n: number }[] = inputActions
    ? Object.values(
        inputActions.reduce<Record<string, { service: string; state: string; level: RiskLevel; n: number }>>((acc, a) => {
          const k = `${a.service}-${a.state}`
          acc[k] ??= { service: serviceShort(a.service), state: a.state === "진행" ? "조치 진행" : "조치 대기", level: a.state === "진행" ? "caution" : "offline", n: 0 }
          acc[k].n++
          return acc
        }, {}),
      )
    : IS_STAGING
      ? SAMPLE_GIS_RESPONSES
      : []
  const respTag = inputActions ? "input" : MISSING

  // 기관·대응팀 — 실제 목록이 있으면 그 값 → 입력값 → 샘플 (종합상황 대응현황과 같은 규칙)
  const agencyReal = agencyStatuses.length > 0
  const teamsReal = disasterResponseTeams.length > 0
  const useEx = ex !== undefined
  const connected = agencyReal ? agencyStatuses.filter((a) => a.status === "connected").length : useEx ? ex.agenciesConnected : IS_STAGING ? SAMPLE_AGENCIES.connected : null
  const agencyTotal = agencyReal ? agencyStatuses.length : useEx ? ex.agenciesTotal : IS_STAGING ? SAMPLE_AGENCIES.total : null
  const issue = agencyReal ? agencyStatuses.filter((a) => a.status !== "connected").map((a) => a.agency).join(" · ") : useEx ? ex.agencyIssue : IS_STAGING ? SAMPLE_AGENCIES.issue : ""
  const teamCount = teamsReal ? disasterResponseTeams.filter((t) => t.status === "출동중").length : useEx ? ex.teams : IS_STAGING ? SAMPLE_TEAMS.count : null
  const teamState = useEx ? ex.teamState : IS_STAGING ? `${SAMPLE_TEAMS.state} 1` : ""
  const exTag = useEx ? "input" : MISSING

  // 최근 조치·전파
  const actionsReal = recentActions.length > 0
  const acts = actionsReal ? recentActions.slice(0, 2).map((a) => ({ id: a.id, time: a.time, text: `${a.title} · ${a.owner}` })) : IS_STAGING ? SAMPLE_GIS_ACTIONS : []
  const actsTag = actionsReal ? "none" : MISSING

  return (
    <div className="sp">
      <Scope domain={domain} onDomain={onDomain} />
      <Card title="진행 중 대응 (서비스별)" tag={<Tag sample={respTag} />}>
        {resp.length === 0 && <p className="sp-note">{inputActions || IS_STAGING ? "진행 중인 대응이 없습니다" : "받은 대응 자료가 없습니다"}</p>}
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
            {connected ?? "—"}/{agencyTotal ?? "—"}
          </b>
          {issue && <span className="sp-sub sp-c--caution">{issue}</span>}
          {!agencyReal && <Tag sample={exTag} />}
        </div>
        <div className="sp-card spg-dark">
          <small>현장 대응팀</small>
          <b>{teamCount ?? "—"}팀</b>
          <span className="sp-sub sp-c--caution">{teamState}</span>
          {!teamsReal && <Tag sample={exTag} />}
        </div>
      </div>
      <Card title="최근 조치·전파" tag={<Tag sample={actsTag} />}>
        {acts.length === 0 && <p className="sp-note">최근 조치 기록이 없습니다</p>}
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

export function GisLeftPanel({ which, domain, onDomain, markers }: { which: GisWhich; domain: Domain; onDomain: (d: Domain) => void; /** 지도에 찍히는 점 전체 */ markers: RiskMarker[] }) {
  if (which === "obs") return <ObsTab domain={domain} onDomain={onDomain} />
  if (which === "impact") return <ImpactTab domain={domain} onDomain={onDomain} />
  if (which === "response") return <ResponseTab domain={domain} onDomain={onDomain} />
  return <StatusTab domain={domain} onDomain={onDomain} markers={markers} />
}
