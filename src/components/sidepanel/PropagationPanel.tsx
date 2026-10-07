import { Link } from "react-router-dom"
import { reportingChain, sequentialPropagation, simultaneousPropagationGoal } from "../../data/mockPropagation"
import { recentActions } from "../../data/mockDashboard"
import { IS_STAGING } from "../../data/appMode"
import { SAMPLE_CHANNELS, SAMPLE_REACH, SAMPLE_RECENT_ACTIONS } from "../../data/sidePanelSamples"
import { SpSample } from "./primitives"

const STEP_COLOR = ["var(--risk-safe)", "var(--risk-caution)", "var(--risk-warning)"]
const NODES = ["도청", "시 상황실", "읍면동"]

/** R1 · 우측 · 상황전파 — 전파·보고 체계(현업 면담 기준 실데이터) + 전파·경보 수단 상태(연동 전 샘플) */
export function PropagationPanel() {
  // 순차 전파 단계별 도달 시각 — 사건이 있을 때만 값이 들어온다(없으면 '-')
  // 스테이징은 임의의 도달 시각(샘플), 그 밖의 환경은 사건이 있을 때만 값이 있고 없으면 '-'
  const reach = (i: number) => (IS_STAGING ? SAMPLE_REACH[i] : sequentialPropagation[i]?.time ?? "-")
  const actions = IS_STAGING ? SAMPLE_RECENT_ACTIONS : recentActions
  const avail = SAMPLE_CHANNELS.filter((c) => c.state === "safe").length
  const check = SAMPLE_CHANNELS.filter((c) => c.state === "caution").length
  const none = SAMPLE_CHANNELS.filter((c) => c.state === "offline").length

  return (
    <div className="sp">
      <div className="sp-card">
        <div className="sp-row">
          <b className="sp-h2">현재 전파 체계 (순차)</b>
          {IS_STAGING && <SpSample />}
        </div>
        <div className="sp-flow" style={{ margin: "6px 0" }}>
          {NODES.map((n, i) => (
            <span key={n} style={{ display: "contents" }}>
              <span className="col">
                <span className="sp-node">{n}</span>
                <span className="sp-note">도달 {reach(i)}</span>
              </span>
              {i < NODES.length - 1 && <span className="sp-arrow">→</span>}
            </span>
          ))}
        </div>
        <p className="sp-note">단계마다 지연 발생 — 사건이 생기면 단계별 도달 시각이 표시됩니다</p>
      </div>

      <div className="sp-card">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer">목표 (동시 전파)</b>
          <span className="sp-badge-info" title={simultaneousPropagationGoal.status}>
            2차년도 이후
          </span>
        </div>
        <div className="sp-goal" style={{ margin: "4px 0" }}>
          <span className="sp-node sp-node--on">도청</span>
          <div className="stack">
            <span className="sp-node">시 상황실</span>
            <span className="sp-node">읍면동</span>
          </div>
          <p>동시 도달 — 지연 없음</p>
        </div>
        <p className="sp-note">조직·프로세스 변경에 따라 협의 필요</p>
      </div>

      <div className="sp-card">
        <b className="sp-h2">재난 보고체계</b>
        <div className="sp-chain" style={{ marginTop: 6 }}>
          {reportingChain.map((s, i) => (
            <div key={s.id}>
              <span className="no" style={{ color: STEP_COLOR[i], borderColor: STEP_COLOR[i] }}>
                {i + 1}
              </span>
              <b>{s.label.replace(" (", "\n(").split("\n").map((t, k) => <span key={k} style={{ display: "block" }}>{t}</span>)}</b>
              <small>{s.role}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="sp-row">
        <h3 className="sp-h" style={{ margin: 0 }}>
          전파·경보 수단 상태
        </h3>
        <SpSample noData />
      </div>
      <div className="sp-stats">
        <div className="sp-stat">
          <small>가용</small>
          <b className="sp-c--safe">{avail}</b>
        </div>
        <div className="sp-stat">
          <small>점검 필요</small>
          <b className="sp-c--caution">{check}</b>
        </div>
        <div className="sp-stat">
          <small>정보 없음</small>
          <b className="sp-c--offline">{none}</b>
        </div>
      </div>
      <div className="sp-chans">
        {SAMPLE_CHANNELS.map((c) => (
          <div className="sp-chan" key={c.name}>
            <span className="t">
              <span className={`sp-dot sp-bg--${c.state}`} aria-hidden />
              {c.name}
              <em className={`sp-c--${c.state}`}>{c.percent !== null ? `${c.percent}%` : c.note}</em>
            </span>
            {c.percent !== null ? (
              <span className="sp-track">
                <i className={`sp-bg--${c.state}`} style={{ width: `${c.percent}%` }} />
              </span>
            ) : (
              <span className="sp-track sp-track--dashed" />
            )}
          </div>
        ))}
      </div>
      <p className="sp-note">회색 점선 = 정보 없음·미연계 · 값은 연계 후 실시간 표시</p>

      <b className="sp-h2" style={{ color: "var(--foreground-muted)" }}>
        최근 조치 이력{actions.length === 0 ? " · 빈 상태" : ""} {IS_STAGING && <SpSample />}
      </b>
      {actions.length === 0 ? (
        <div className="sp-dashed sp-dashed--center">
          <b>데이터가 없습니다</b>
        </div>
      ) : (
        <ul className="plist">
          {actions.map((a) => (
            <li key={a.id}>
              <div className="row-between">
                <span className="t">{a.title}</span>
                <span className="time">{a.time}</span>
              </div>
              <p className="s">
                {a.owner} · {a.note}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link className="sp-link" to="/propagation">
        전체 보기 → (상황전파·보고체계)
      </Link>
    </div>
  )
}
