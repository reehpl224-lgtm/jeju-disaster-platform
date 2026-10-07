import { Link, useNavigate } from "react-router-dom"
import { agencyStatuses } from "../../data/mockDashboard"
import { disasterResponseTeams } from "../../data/mockIncidents"
import { SAMPLE_ACTIONS, SAMPLE_ACTION_TOTALS, SAMPLE_AGENCIES, SAMPLE_SERVICE_STAGES, SAMPLE_TEAMS } from "../../data/sidePanelSamples"
import { LEVEL_RANK, SERVICES, serviceShort, usePanelInput, type InputLevel } from "../../data/panelInput"
import { PartTag, SpRisk } from "./primitives"
import { levelName, spLevel } from "./spUtils"

interface Tile {
  id: string
  title: string
  level: InputLevel | null
  count: number | null
  done: number
  total: number
}

/** R4 · 우측 · 대응현황 — 서비스 9칸 단계 타일 + 조치 진행. 영역마다 입력값이 있으면 그 값, 없으면 샘플(표식). */
export function ResponsePanel() {
  const nav = useNavigate()
  const inp = usePanelInput()
  const stSample = inp.stages === undefined
  const acSample = inp.actions === undefined
  const exSample = inp.responseExtra === undefined
  const fully = stSample && acSample && exSample

  // 서비스 타일 — 입력에 없는 서비스는 값 없음(—)으로 둔다
  const tiles: Tile[] = SERVICES.map((sv) => {
    if (stSample) {
      const x = SAMPLE_SERVICE_STAGES.find((v) => v.id === sv.id)
      return { id: sv.id, title: sv.title, level: (x?.level as InputLevel | undefined) ?? null, count: x?.count ?? null, done: x?.done ?? 0, total: x?.total ?? 0 }
    }
    const x = inp.stages?.find((v) => v.id === sv.id)
    return { id: sv.id, title: sv.title, level: x?.level ?? null, count: x?.count ?? null, done: x?.done ?? 0, total: (x?.done ?? 0) + (x?.doing ?? 0) + (x?.waiting ?? 0) }
  }).sort((a, b) => (b.level ? LEVEL_RANK[b.level] : -1) - (a.level ? LEVEL_RANK[a.level] : -1))
  const top = tiles[0]
  const countOf = (l: InputLevel[]) => tiles.filter((t) => t.level && l.includes(t.level)).length

  // 조치 진행 합계 — 입력이면 서비스별 합산, 샘플이면 샘플 합계
  const sum = stSample
    ? SAMPLE_ACTION_TOTALS
    : { done: inp.stages?.reduce((n, s) => n + s.done, 0) ?? 0, doing: inp.stages?.reduce((n, s) => n + s.doing, 0) ?? 0, waiting: inp.stages?.reduce((n, s) => n + s.waiting, 0) ?? 0 }
  const all = sum.done + sum.doing + sum.waiting

  const actions = acSample
    ? SAMPLE_ACTIONS
    : (inp.actions ?? []).map((a) => ({ service: serviceShort(a.service), text: a.text, state: a.state }))

  // 기관·대응팀 — 실제 목록이 있으면 그 값 → 입력값 → 샘플
  const agencyReal = agencyStatuses.length > 0
  const teamsReal = disasterResponseTeams.length > 0
  const ex = inp.responseExtra
  const connected = agencyReal ? agencyStatuses.filter((a) => a.status === "connected").length : ex ? ex.agenciesConnected : SAMPLE_AGENCIES.connected
  const agencyTotal = agencyReal ? agencyStatuses.length : ex ? ex.agenciesTotal : SAMPLE_AGENCIES.total
  const issue = agencyReal ? agencyStatuses.filter((a) => a.status !== "connected").map((a) => a.agency).join(" · ") : ex ? ex.agencyIssue : SAMPLE_AGENCIES.issue
  const teamCount = teamsReal ? disasterResponseTeams.filter((x) => x.status === "출동중").length : ex ? ex.teams : SAMPLE_TEAMS.count
  const teamState = ex ? ex.teamState : SAMPLE_TEAMS.state

  return (
    <div className="sp">
      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2">최고 단계</b>
          {top.level ? <SpRisk level={top.level}>{levelName(top.level)}</SpRisk> : <span className="sp-risk sp-risk--offline">정보 없음</span>}
          <span className="sp-sub" style={{ color: "var(--foreground)" }}>
            {top.level ? top.title : ""}
          </span>
          <PartTag sample={stSample} fully={fully} />
          <span className="sp-spacer" />
          <span className="sp-note">높은 단계 순</span>
        </div>
        <div className="sp-legend">
          <span><i className="sp-dot sp-bg--alert" />심각 {countOf(["danger"])}</span>
          <span><i className="sp-dot sp-bg--alert" />경계 {countOf(["alert"])}</span>
          <span><i className="sp-dot sp-bg--warning" />주의 {countOf(["warning"])}</span>
          <span><i className="sp-dot sp-bg--caution" />관심 {countOf(["caution"])}</span>
          <span><i className="sp-dot sp-bg--safe" />평시 {countOf(["safe"])}</span>
        </div>
        <div className="sp-stages">
          {tiles.map((s) => (
            <button key={s.id} type="button" className={`sp-stage ${s.level ? `sp-stage--${s.level}` : ""}`} onClick={() => nav(`/${s.id}`)} title={`${s.title} 화면으로`}>
              <small>{s.title}</small>
              <span className={`s sp-c--${s.level ? spLevel(s.level) : "offline"}`}>
                {s.level ? levelName(s.level) : "—"}
                {s.count !== null && <i>{s.count}</i>}
              </span>
              <span className="a">{s.level === null ? "정보 없음" : s.total > 0 ? `조치 ${s.done}/${s.total}` : "—"}</span>
            </button>
          ))}
        </div>
        <p className="sp-note">타일 색 = 서비스의 현재 대응 단계(공통 5단계로 환산) · 타일을 누르면 해당 서비스 체크리스트</p>
      </div>

      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>
            조치 진행 — 전체 서비스
          </b>
          <PartTag sample={stSample} fully={fully} />
          <span className="sp-spacer" />
          <span className="sp-note">{all}건</span>
        </div>
        <div className="sp-segbar" role="img" aria-label="조치 진행 비율">
          {all > 0 && (
            <>
              <i style={{ width: `${(sum.done / all) * 100}%`, background: "var(--risk-safe)" }} />
              <i style={{ width: `${(sum.doing / all) * 100}%`, background: "var(--risk-caution)" }} />
              <i style={{ width: `${(sum.waiting / all) * 100}%`, background: "var(--foreground-subtle)" }} />
            </>
          )}
        </div>
        <div className="sp-legend">
          <span><i className="sp-dot sp-bg--safe" />완료 {sum.done}</span>
          <span><i className="sp-dot sp-bg--caution" />진행 {sum.doing}</span>
          <span><i className="sp-dot" style={{ background: "var(--foreground-subtle)" }} />대기 {sum.waiting}</span>
        </div>
        <div className="sp-row" style={{ marginTop: 4 }}>
          <b className="sp-sub">지금 해야 할 조치</b>
          <PartTag sample={acSample} fully={fully} />
        </div>
        {actions.length === 0 && <p className="sp-note">지금 해야 할 조치가 없습니다</p>}
        <ul className="sp-acts" style={{ margin: 0, padding: 0 }}>
          {actions.map((a, i) => (
            <li key={`${a.text}-${i}`}>
              <span className="sp-tag">{a.service}</span>
              <span className="x">{a.text || "—"}</span>
              <em className={a.state === "진행" ? "sp-lv--caution" : "sp-lv--offline"}>{a.state}</em>
            </li>
          ))}
        </ul>
      </div>

      <div className="sp-duo">
        <div className="sp-card">
          <small>기관 연결</small>
          <b>
            {connected}/{agencyTotal}
          </b>
          {issue && <span className="sp-sub sp-c--caution">{issue}</span>}
          {!agencyReal && <PartTag sample={ex === undefined} fully={fully} />}
        </div>
        <div className="sp-card">
          <small>현장 대응팀</small>
          <b>{teamCount}팀</b>
          <span className="sp-sub">{teamState}</span>
          {!teamsReal && <PartTag sample={ex === undefined} fully={fully} />}
        </div>
      </div>
      <p className="sp-note">
        서비스를 누르면 해당 서비스 체크리스트로 이동{fully ? " · 값은 모두 샘플" : ""} · 값은 <Link to="/panel-input" className="sp-link" style={{ fontSize: 10 }}>패널 입력</Link>에서 넣습니다
      </p>
    </div>
  )
}
