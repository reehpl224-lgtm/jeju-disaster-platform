import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { IS_STAGING } from "../../data/appMode"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { heatShelters } from "../../data/mockHeat"
import { boardRoute } from "../../data/boardSamples"
import { BOARD_STATES, bd, type Badge, type BoardService, type BoardStateId, type DashLeft, type LogItem, type RightPanel } from "../../data/boardTypes"
import { SpLive, SpRisk, SpSample } from "../sidepanel/primitives"

/**
 * 서비스 보드 좌·우 사이드패널(Figma "3단계 · {서비스} — 서비스 보드 (좌 3묶음 + 우 대응 패널)").
 * 좌측 3묶음 = 대시보드 · 관측·판단 · 이력·보고, 우측 = 상태(평시 → 감지 → 진행 → 종료)에 따라 바뀌는 대응 패널.
 * 프로토타입·로컬은 평시(값 없음) 기본 상태, 스테이징은 상태를 골라 임의의 값(샘플)을 본다.
 */
const Pill = ({ b }: { b: Badge }) => <SpRisk level={b.level}>{b.label}</SpRisk>

function Card({ title, badge, children, tag }: { title: ReactNode; badge?: ReactNode; tag?: ReactNode; children: ReactNode }) {
  return (
    <div className="sp-card sp-card--open spg-dark">
      <div className="sp-row">
        <b className="sp-h2" style={{ fontSize: 13 }}>
          {title}
        </b>
        {tag}
        {badge && <span className="sp-spacer" />}
        {badge}
      </div>
      {children}
    </div>
  )
}

const STEPS = ["감지", "확인", "판단", "경보", "대응", "종료"]

// ================================================================== 좌측 · 대시보드
export function BoardDashboard({ service, state, live }: { service: BoardService; state: BoardStateId; /** 실제 특보를 얹은 값(프로토타입 평시) */ live?: DashLeft }) {
  const heatLoaded = useHeatShelters()
  const base: DashLeft = live ?? (state === "calm" || state === "closed" ? service.dash.calm : service.dash[state])
  // 받아 둔 무더위쉼터 자료(행안부)가 있으면 그 개수를 쓴다(자료가 있는 항목만 실값 — 스테이징의 샘플 상태에서도 쉼터 개수는 실값).
  // 브리핑 문구는 평시일 때만 바꾼다(샘플 상태의 문구는 샘플 그대로)
  const d: DashLeft =
    service.id === "heat" && heatLoaded && heatShelters.length > 0
      ? {
          ...base,
          tiles: base.tiles.map((t) => (t.label === "무더위쉼터" ? { ...t, value: `${heatShelters.length}개소`, sub: "행안부 스냅샷" } : t)),
          brief: state === "calm" ? base.brief.map(([k, v]) => [k, k === "대응" ? `안내 발송 없음 · 무더위쉼터 ${heatShelters.length}곳(행안부 스냅샷)` : v] as [string, string]) : base.brief,
        }
      : base
  return (
    <div className="sp">
      <div className="sp-pills">
        {d.chips.map((c) => (
          <span className="sp-pill sp-pill--static" key={c}>
            {c}
          </span>
        ))}
      </div>

      <Card title={d.status.title} tag={d.status.live ? <SpLive /> : undefined} badge={d.status.badge && <Pill b={d.status.badge} />}>
        {d.status.heading && <b style={{ fontSize: 13 }}>{d.status.heading}</b>}
        {d.status.lines?.map((l) => (
          <p className="sp-sub" key={l}>
            {l}
          </p>
        ))}
        {d.status.rows?.map((r) => (
          <div className="sp-row bd-row" key={r.name}>
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 13 }}>{r.name}</b>
              {r.sub && <span className="sp-sub">{r.sub}</span>}
            </div>
            <Pill b={r.badge} />
          </div>
        ))}
        {d.status.note && <p className="sp-note">{d.status.note}</p>}
      </Card>

      {d.event && (
        <Card title={d.event.title} badge={<Pill b={d.event.badge} />}>
          {d.event.item ? (
            <>
              <div className="sp-row bd-row">
                <b style={{ fontSize: 13, flex: "1 1 0" }}>{d.event.item.name}</b>
                <Pill b={d.event.item.badge} />
              </div>
              <p className="sp-sub">{d.event.item.sub}</p>
              {d.event.link && <span className="sp-link">{d.event.link}</span>}
            </>
          ) : (
            <>
              <b style={{ fontSize: 13 }}>{d.event.title}</b>
              {d.event.detail && <p className="sp-sub">{d.event.detail}</p>}
            </>
          )}
        </Card>
      )}

      {d.steps && (
        <Card title="e-SOP 단계">
          <div className="sp-pills">
            {STEPS.map((s, i) => (
              <span className={`bd-step${i === d.steps!.active ? " is-active" : ""}${i < d.steps!.done ? " is-done" : ""}`} key={s}>
                <i aria-hidden>{i === d.steps!.active ? "●" : i < d.steps!.done ? "✓" : "○"}</i>
                {s}
              </span>
            ))}
          </div>
          <p className="sp-note">{d.steps.note}</p>
        </Card>
      )}

      <div className="bd-tiles">
        {d.tiles.map((t) => (
          <div className={`bd-tile${t.tone ? ` bd-tile--${t.tone}` : ""}`} key={t.label}>
            <small>
              {t.label} {t.live && <SpLive />}
            </small>
            <b>{t.value}</b>
            <span className="sp-sub">{t.sub || " "}</span>
          </div>
        ))}
      </div>

      <Card title="브리핑 (요약)">
        {d.brief.map(([k, v]) => (
          <p className="bd-brief" key={k}>
            <b>{k}</b> {v}
          </p>
        ))}
        <span className="sp-link">{d.briefLink}</span>
      </Card>

      {d.ext && (
        <Card title={d.ext.title} badge={<Pill b={d.ext.badge} />}>
          <p className="sp-sub">{d.ext.detail}</p>
        </Card>
      )}
    </div>
  )
}

// ================================================================== 좌측 · 이력·보고
export function BoardHistory({ service, state }: { service: BoardService; state: BoardStateId }) {
  const h = service.history
  if (state !== "closed") {
    return (
      <div className="sp">
        <div className="sp-card sp-card--open spg-dark">
          <div className="sp-row">
            <b className="sp-h2" style={{ fontSize: 13 }}>
              종료된 사건 없음
            </b>
            <span className="sp-spacer" />
            <Pill b={bd("이력 없음", "offline")} />
          </div>
          <p className="sp-sub" style={{ fontSize: 12, color: "var(--foreground)" }}>
            종료된 사건이 없습니다. 사건이 종료되면 종료 보고서가 이곳에 쌓입니다.
          </p>
        </div>
        <Link className="sp-link" to={boardRoute(service, "closure")}>
          이력·보고 상세 화면 →
        </Link>
      </div>
    )
  }
  return (
    <div className="sp">
      <div className="sp-card sp-card--open spg-dark">
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13, flex: "1 1 0" }}>
            {h.id}
          </b>
          <Pill b={h.badge} />
        </div>
        <p className="sp-note">{h.owner}</p>
      </div>
      {h.sections.map((s) => (
        <Card key={s.title} title={s.title}>
          {s.rows.map(([k, v]) => (
            <div className="bd-kv" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </Card>
      ))}
      <Card title="종료 조건">
        {h.conditions.map((c) => (
          <p className="bd-brief" key={c.text}>
            <span className={c.ok ? "sp-c--safe" : "sp-c--offline"}>{c.ok ? "✓" : "○"}</span> {c.text}
          </p>
        ))}
      </Card>
      {h.report.length > 0 && (
        <Card title="보고서">
          {h.report.map(([k, v]) => (
            <div className="bd-kv" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </Card>
      )}
      <Link className="sp-link" to={boardRoute(service, "closure")}>
        이력·보고 상세 화면 →
      </Link>
    </div>
  )
}

// ================================================================== 우측 · 대응 패널
const nowHM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}
const isBad = (t: string) => /오류|실패|응답 없음/.test(t)

function ResponseBody({ service, state, r, onClose }: { service: BoardService; state: BoardStateId; r: RightPanel; onClose?: () => void }) {
  const [done, setDone] = useState<number[]>([])
  const [memos, setMemos] = useState<LogItem[]>([])
  const [memo, setMemo] = useState("")
  const [acts, setActs] = useState<LogItem[]>([])
  const left = r.todo.items.length - done.length
  const logAll = [...memos, ...acts, ...r.log]

  const handle = (i: number, label: string, title: string) => {
    setDone((d) => (d.includes(i) ? d : [...d, i]))
    setActs((a) => [{ time: nowHM(), tag: "조치", text: `${label} — ${title}` }, ...a])
  }
  const addMemo = () => {
    const text = memo.trim()
    if (!text) return
    setMemos((m) => [{ time: nowHM(), tag: "메모", text }, ...m])
    setMemo("")
  }

  return (
    <div className="sp">
      {r.trigger && (
        <div className="bd-trigger">
          <p>
            <b className="sp-c--warning">특보</b> <b>{r.trigger.name}</b> {r.trigger.live && <SpLive />}
          </p>
          <p className="sp-sub">{r.trigger.advice}</p>
        </div>
      )}

      <Card title="지금 해야 할 일" badge={<Pill b={left === r.todo.items.length ? r.todo.badge : bd(left === 0 ? "모두 처리" : `${left}건 대기`, left === 0 ? "safe" : r.todo.badge.level)} />}>
        {r.todo.items.length === 0 && (
          <>
            <b style={{ fontSize: 13 }}>대응이 필요한 항목이 없습니다</b>
            <p className="sp-note">결재 대기 · 수신 실패 · 현장 조치가 생기면 이곳에 표시됩니다</p>
          </>
        )}
        {r.todo.items.map((t, i) => (
          <div className={`bd-todo${t.fail ? " is-fail" : ""}${done.includes(i) ? " is-done" : ""}`} key={t.title}>
            <div className="sp-row" style={{ alignItems: "flex-start" }}>
              <span className={`bd-tag${t.fail ? " is-fail" : ""}`}>{t.tag}</span>
              <b style={{ fontSize: 13, lineHeight: "18px" }}>{t.title}</b>
            </div>
            {t.detail && <p className="sp-sub">{t.detail}</p>}
            <div className="sp-row" style={{ flexWrap: "wrap" }}>
              {done.includes(i) ? (
                <span className="sp-c--safe" style={{ fontWeight: 700 }}>
                  ✓ 처리됨
                </span>
              ) : (
                t.actions?.map((a) => (
                  <button key={a.label} type="button" className={`bd-btn bd-btn--${a.kind}`} onClick={() => handle(i, a.label, t.title)}>
                    {a.label}
                  </button>
                ))
              )}
              {t.link && (
                <Link className="sp-link" to={boardRoute(service, t.link.route)}>
                  {t.link.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card title="진행 중 조치" badge={<Pill b={r.doing.badge} />}>
        {r.doing.stats && (
          <div className="bd-stats">
            {r.doing.stats.map((s) => (
              <div className={`bd-stat${s.bad ? " is-bad" : ""}`} key={s.label}>
                <small>{s.label}</small>
                <b>{s.value}</b>
              </div>
            ))}
          </div>
        )}
        {r.doing.items.length === 0 && r.doing.empty && (
          <p className="sp-sub" style={{ fontSize: r.doing.empty.length > 40 ? 10 : 12, lineHeight: "15px", color: r.doing.empty.length > 40 ? "var(--foreground-subtle)" : "var(--foreground)" }}>
            {r.doing.empty}
          </p>
        )}
        {r.doing.items.map((d) => (
          <div className="sp-row bd-do" key={d.title}>
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <b style={{ fontSize: 12, lineHeight: "18px" }}>{d.title}</b>
              {d.detail && <span className="sp-sub" style={{ display: "block" }}>{d.detail}</span>}
            </div>
            {d.badge && <Pill b={d.badge} />}
          </div>
        ))}
      </Card>

      {r.ready && (
        <Card title="준비 상태" tag={<SpSample noData={!IS_STAGING} />}>
          {!IS_STAGING && <p className="sp-sub" style={{ fontSize: 12, color: "var(--foreground)" }}>준비 상태 자료가 연계되지 않았습니다</p>}
          {(IS_STAGING ? r.ready : []).map((x) => (
            <div className="sp-row bd-do" key={x.title}>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <b style={{ fontSize: 12, lineHeight: "18px" }}>{x.title}</b>
                <span className="sp-sub" style={{ display: "block" }}>{x.sub}</span>
              </div>
              <Pill b={x.badge} />
            </div>
          ))}
        </Card>
      )}

      <Card title="조치 기록">
        {logAll.length === 0 && <p className="sp-sub" style={{ fontSize: 12, color: "var(--foreground)" }}>기록된 조치가 없습니다. 감지·판단·조치가 시각과 함께 쌓입니다.</p>}
        {logAll.map((l, i) => (
          <div className="bd-log" key={`${l.time}-${l.text}-${i}`}>
            <b className={isBad(l.text) ? "sp-c--alert" : i === 0 ? "sp-c--warning" : undefined}>{l.time}</b>
            <span className="sp-tag">{l.tag}</span>
            <span>{l.text}</span>
          </div>
        ))}
        <form
          className="bd-memo"
          onSubmit={(e) => {
            e.preventDefault()
            addMemo()
          }}
        >
          <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="조치 메모 남기기 (예: 현장 확인 완료)" aria-label="조치 메모" />
          <button type="submit" className="bd-btn bd-btn--line">
            기록
          </button>
        </form>
      </Card>

      {state === "progress" && (
        <button type="button" className="bd-end" disabled={left > 0 || !onClose} onClick={onClose}>
          {left > 0 ? `상황 종료 처리 → · 조치 필요 ${left}건이 남아 있습니다` : "상황 종료 처리 →"}
        </button>
      )}
    </div>
  )
}

/** 우측 대응 패널 — 스테이징에는 상태(평시·감지·진행·종료)를 고르는 데모 스위치가 붙는다 */
export function BoardResponsePanel({ service, state, onState, live }: { service: BoardService; state: BoardStateId; onState: (s: BoardStateId) => void; live?: RightPanel }) {
  const r = live ?? service.right[state]
  return (
    <aside className="dock dock--right">
      <section className="panel panel--right" style={{ borderRadius: "1rem" }}>
        <div className="panel__head">
          <h2 className="panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            대응 · {service.title}
            {IS_STAGING && state !== "calm" && <SpSample />}
          </h2>
          <Pill b={r.head} />
        </div>
        {IS_STAGING && (
          <div className="bd-switch" role="group" aria-label="샘플 상태(스테이징 데모)">
            <small>샘플 상태</small>
            {BOARD_STATES.map((s) => (
              <button key={s.id} type="button" aria-pressed={state === s.id} onClick={() => onState(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="panel__scroll">
          {/* 상태가 바뀌면 처리·메모 기록을 새로 시작한다 */}
          <ResponseBody key={`${service.id}-${state}-${live ? "live" : ""}`} service={service} state={state} r={r} onClose={IS_STAGING ? () => onState("closed") : undefined} />
        </div>
      </section>
    </aside>
  )
}
