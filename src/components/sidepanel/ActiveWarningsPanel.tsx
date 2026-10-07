import { useMemo } from "react"
import { useSidePanelEvents } from "../../data/useSidePanelEvents"
import { CATEGORY_LABEL, DAY, HOUR, type SpCategory, type SpEvent } from "../../data/sidePanelSamples"
import { EventFilterBar } from "./eventFilters"
import { useEventFilters } from "./useEventFilters"
import { SpRisk, SpSample } from "./primitives"
import { fmtHM, fmtDateTime, pad2, spLevel } from "./spUtils"
import type { RiskLevel } from "../../types/domain"

interface GanttRow {
  id: string
  title: string
  where: string
  start: Date
  end?: Date
  level: RiskLevel
}

/** L2 · 좌측 · 발효중 특보 — 분류별 건수 + 발효 시간 간트 + 분류별 목록. 기상청은 해제 시각을 주지 않아 막대 끝은 '미정'. */
export function ActiveWarningsPanel() {
  const { mode, events, nullSources } = useSidePanelEvents()
  const f = useEventFilters()
  const now = useMemo(() => new Date(), [])
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 최근 24시간 사건 중 — 건수·목록은 발령(발효 중)만, 간트는 '해제' 체크 시 해제된 것도 막대로 보여준다
  const dayAgo = now.getTime() - DAY
  const recent = events.filter((e) => e.at.getTime() >= dayAgo && f.pass(e) && (!f.cat || e.category === f.cat))
  const active = recent.filter((e) => e.status === "발령")
  const count = (c: SpCategory) => active.filter((e) => e.category === c).length

  // 간트 축 — 지금이 가운데쯤 오도록 12시간 창(0~24시 안에서)
  const nowH = now.getHours() + now.getMinutes() / 60
  const axisStart = Math.max(0, Math.min(12, Math.floor(nowH) - 6))
  const axisEnd = axisStart + 12
  const pos = (d: Date) => Math.max(0, Math.min(1, ((d.getTime() - dayStart.getTime()) / HOUR - axisStart) / 12))

  const rows: GanttRow[] = recent
    .filter((e) => e.category === "weather")
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((e) => ({ id: e.id, title: e.title.replace(" (기상특보)", ""), where: e.detail.replace(" · 기상청 발표", "").replace(" · 해제", ""), start: e.at, end: e.status === "해제" ? e.until : undefined, level: e.status === "해제" ? "safe" : e.level }))
  const rangeText = `${dayStart.getFullYear()}-${pad2(dayStart.getMonth() + 1)}-${pad2(dayStart.getDate())} ~ ${dayStart.getFullYear()}-${pad2(dayStart.getMonth() + 1)}-${pad2(dayStart.getDate())}`
  const ticks = [axisStart, axisStart + 3, axisStart + 6, axisStart + 9, axisEnd]

  if (mode === "loading") return <p className="pempty">불러오는 중...</p>

  return (
    <div className="sp">
      <EventFilterBar f={f} rangeText={rangeText} />

      <div className="sp-stats">
        {(["disaster", "weather", "message"] as SpCategory[]).map((c) => (
          <div className="sp-stat" key={c}>
            <small style={{ color: "var(--foreground)", fontWeight: 700 }}>{CATEGORY_LABEL[c]}</small>
            <b className={c === "disaster" ? "sp-c--caution" : c === "weather" ? "sp-c--warning" : "sp-c--alert"} style={{ fontSize: 22 }}>
              {count(c)}
            </b>
          </div>
        ))}
      </div>

      <h3 className="sp-h2" style={{ fontSize: 13 }}>
        발효 시간 (오늘 {pad2(axisStart)}~{pad2(axisEnd)}시)
      </h3>
      <div className="sp-gantt">
        {rows.length === 0 ? (
          <p className="sp-note" style={{ textAlign: "center", padding: "12px 0" }}>
            발효 중인 기상특보가 없어 표시할 막대가 없습니다
          </p>
        ) : (
          <div className="sp-g-body">
            <div className="sp-g-axis">
              {ticks.map((t) => (
                <span key={t} style={{ left: `${((t - axisStart) / 12) * 100}%` }}>
                  {pad2(t)}시
                </span>
              ))}
            </div>
            {rows.map((r) => {
              const s = pos(r.start)
              const e = r.end ? pos(r.end) : pos(now)
              return (
                <div className="sp-g-row" key={r.id}>
                  <div className="sp-g-label">
                    <b>{r.title}</b>
                    <small title={r.where}>{r.where}</small>
                  </div>
                  <div className="sp-g-track">
                    <span className={`sp-g-bar ${r.level === "safe" ? "" : `sp-bg--${spLevel(r.level)}`}`} style={{ left: `${s * 100}%`, width: `${Math.max(1.5, (e - s) * 100)}%`, background: r.level === "safe" ? "#5f6f1f" : undefined }} />
                    <span className="sp-g-end" style={{ left: `calc(${e * 100}% + 4px)` }}>
                      {r.end ? `해제 ${fmtHM(r.end)}` : "미정 •"}
                    </span>
                  </div>
                </div>
              )
            })}
            <span className="sp-g-now" style={{ left: `calc(112px + (100% - 112px) * ${pos(now)})` }} />
            <span className="sp-g-nowl" style={{ left: `calc(112px + (100% - 112px) * ${pos(now)})` }}>
              지금
            </span>
            <div style={{ height: 18 }} />
          </div>
        )}
        <p className="sp-note">막대 끝이 '지금'까지 이어지면 미정 · 해제 여부는 기상청 발표를 따릅니다</p>
      </div>

      {(["disaster", "weather", "message"] as SpCategory[]).map((c) => {
        const items = active.filter((e) => e.category === c).sort((a, b) => b.at.getTime() - a.at.getTime())
        if (items.length === 0 && mode === "live") return null
        return (
          <section key={c} className="sp" style={{ gap: 8 }}>
            <h3 className="sp-group-h">
              {CATEGORY_LABEL[c]}
              {mode === "staging" ? <SpSample /> : items.some((e) => e.sample) ? <SpSample noData /> : null}
            </h3>
            {items.length === 0 ? (
              <div className="sp-dashed sp-dashed--center">
                <span className="sp-note">발효 중인 {CATEGORY_LABEL[c]}이(가) 없습니다</span>
              </div>
            ) : (
              items.map((e) => <ActiveRow key={e.id} e={e} />)
            )}
          </section>
        )
      })}

      {active.length === 0 && (
        <div className="sp-dashed sp-dashed--center">
          <b>현재 발효 중인 특보가 없습니다</b>
        </div>
      )}
      <p className="sp-note">해제 여부는 기상청 발표를 따릅니다 · 실시간 특보 탭엔 같은 카드{mode === "staging" && " · 스테이징 환경 — 임의의 값(샘플)을 보여줍니다"}{nullSources.length > 0 && ` · 데이터 없음: ${nullSources.join("·")} — 샘플로 표시합니다`}</p>
    </div>
  )
}

function ActiveRow({ e }: { e: SpEvent }) {
  return (
    <div className="sp-evrow">
      <span className={`sp-ticon sp-lv--${spLevel(e.level)}`} aria-hidden>
        {e.icon}
      </span>
      <div className="sp-evbody">
        <div className="t">
          <span>{e.title.replace(" (기상특보)", "")}</span>
          <SpRisk level={e.level}>{e.status}</SpRisk>
        </div>
        <span className="m">{e.detail.replace(" · 기상청 발표", "")}</span>
        <span className="sp-sub">{fmtDateTime(e.at).slice(0, 16)} {e.category === "message" ? "수신" : "발표"}</span>
        {e.meta && (
          <div className="sp-meta">
            {e.meta.map((m) => (
              <span key={m.label}>
                {m.label}
                <b>{m.value}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
