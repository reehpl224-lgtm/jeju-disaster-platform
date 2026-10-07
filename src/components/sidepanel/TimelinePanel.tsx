import { useMemo, useState } from "react"
import { useSidePanelEvents } from "../../data/useSidePanelEvents"
import { CATEGORY_ICON, CATEGORY_LABEL, DAY, type SpCategory, type SpEvent } from "../../data/sidePanelSamples"
import { SpLive, SpRisk, SpSample } from "./primitives"
import { WEEKDAY, fmtDateTime, fmtMD, pad2, spLevel } from "./spUtils"
import { EventFilterBar } from "./eventFilters"
import { useEventFilters } from "./useEventFilters"
import type { RiskLevel } from "../../types/domain"

const RANK: Record<string, number> = { safe: 0, offline: 0, info: 0, caution: 1, warning: 2, alert: 3, danger: 3 }
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** L1 · 좌측 · 타임라인 — 최근 7일 막대(색=그날 최고 등급) + 재난·기상 이력. 실데이터가 없으면 샘플로 채운다. */
export function TimelinePanel() {
  const { mode, events, messagesError, messagesAsOf, sampleReason } = useSidePanelEvents()
  const f = useEventFilters()
  const { cat, setCat } = f
  const [day, setDay] = useState<number | null>(null)
  const today = useMemo(() => startOfDay(new Date()), [])

  // 최근 7일(오늘 포함) 경계
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(today.getTime() - (6 - i) * DAY)), [today])
  const inRange = (e: SpEvent) => e.at.getTime() >= days[0].getTime() && e.at.getTime() < today.getTime() + DAY
  const base = events.filter((e) => inRange(e) && f.pass(e))
  const byCat = (c: SpCategory) => base.filter((e) => e.category === c).length
  const catFiltered = cat ? base.filter((e) => e.category === cat) : base
  const dayIndex = (e: SpEvent) => Math.floor((startOfDay(e.at).getTime() - days[0].getTime()) / DAY)
  const perDay = days.map((_, i) => catFiltered.filter((e) => dayIndex(e) === i))
  const maxN = Math.max(1, ...perDay.map((l) => l.length))
  const list = (day === null ? catFiltered : perDay[day]).slice().sort((a, b) => b.at.getTime() - a.at.getTime())
  const rangeText = `${fmtMD(days[0])} ~ ${fmtMD(days[6])}`

  if (mode === "loading") return <p className="pempty">불러오는 중...</p>

  return (
    <div className="sp">
      <EventFilterBar f={f} rangeText={`${days[0].getFullYear()}-${pad2(days[0].getMonth() + 1)}-${pad2(days[0].getDate())} ~ ${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`} />

      <div className="sp-card">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer">최근 7일 · 이벤트 {catFiltered.length}건</b>
          <span className="sp-range">{rangeText} ▦</span>
        </div>
        <div className="sp-days" role="group" aria-label="일별 건수">
          {days.map((d, i) => {
            const items = perDay[i]
            const top = items.reduce<RiskLevel>((m, e) => (RANK[e.level] > RANK[m] ? e.level : m), "safe")
            const h = items.length === 0 ? 3 : Math.max(9, Math.round((items.length / maxN) * 45))
            const isToday = i === 6
            return (
              <button key={d.getTime()} type="button" className="sp-day" aria-pressed={day === i} onClick={() => setDay(day === i ? null : i)} title={`${fmtMD(d)} · ${items.length}건`}>
                <span className="n" style={{ color: items.length === 0 ? "var(--foreground-subtle)" : undefined }}>
                  {items.length}
                </span>
                <span className="w">
                  <span className={`bar ${items.length === 0 ? "" : `sp-bg--${spLevel(top)}`}`} style={{ height: h, background: items.length === 0 ? "var(--foreground-ghost)" : undefined }} />
                </span>
                <span className="d">{isToday ? "오늘" : d.getDate()}</span>
                <span className="k">{WEEKDAY[d.getDay()]}</span>
              </button>
            )
          })}
        </div>
        <p className="sp-note">막대 높이 = 건수 · 색 = 그날 최고 등급 · 날짜를 누르면 그날만 보기</p>
      </div>

      <div className="sp-pills">
        {(Object.keys(CATEGORY_LABEL) as SpCategory[]).map((c) => (
          <button key={c} type="button" className="sp-pill" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
            <span aria-hidden>{CATEGORY_ICON[c]}</span>
            {CATEGORY_LABEL[c]}
            <b className={c === "message" ? "sp-c--alert" : c === "weather" ? "sp-c--warning" : undefined}>{byCat(c)}</b>
          </button>
        ))}
      </div>

      <div className="sp-row">
        <h3 className="sp-h" style={{ margin: 0 }}>
          재난·기상 이력
        </h3>
        {mode === "sample" ? <SpSample /> : <SpLive />}
      </div>
      {mode === "sample" && <p className="sp-note">{sampleReason === "staging" ? "스테이징 환경입니다 — 디자인 확인용 샘플을 보여줍니다(샘플은 실제 상황이 아닙니다)." : "기상청 특보·태풍 정보를 받지 못해 디자인 확인용 샘플을 보여줍니다(샘플은 실제 상황이 아닙니다)."}</p>}
      {mode === "live" && <p className="sp-note">기상청 특보(최근 24시간 발표)·태풍 현황·긴급재난문자(제주 수신 — 받아 둔 스냅샷{messagesAsOf ? `, ${messagesAsOf.slice(0, 10).replace(/-/g, ".")} 기준` : ""})입니다.{messagesError ? " 재난문자 파일을 읽지 못했습니다." : ""}{events.length === 0 && !messagesError && " 지금은 발표된 특보·태풍·문자가 없습니다."}</p>}

      {list.length === 0 ? (
        <div className="sp-dashed sp-dashed--center">
          <b>조건에 맞는 항목이 없습니다</b>
          <span className="sp-note">필터·기간을 바꾸면 다른 이력을 볼 수 있습니다</span>
        </div>
      ) : (
        <div className="sp-tl">
          {list.slice(0, 40).map((e, i) => (
            <TimelineRow key={e.id} e={e} latest={i === 0} />
          ))}
        </div>
      )}
      <p className="sp-note">유형별 아이콘·색: 재난특보(태풍·홍수·지진·산불·산사태) · 기상특보 · 재난문자 / 색 = 위험등급, 해제 = 정상색</p>
    </div>
  )
}

function TimelineRow({ e, latest }: { e: SpEvent; latest: boolean }) {
  const level: RiskLevel = e.status === "해제" ? "safe" : e.level
  return (
    <div className="sp-trow">
      <span className={`sp-ticon sp-lv--${spLevel(level)}`} aria-hidden>
        {e.icon}
      </span>
      <div className="sp-tcard" data-latest={latest ? "" : undefined}>
        <div className="sp-row">
          <span className="time">{fmtDateTime(e.at)}</span>
          <SpRisk level={level}>{e.status}</SpRisk>
        </div>
        <span className="title">{e.title}</span>
        <span className="detail">{e.detail}</span>
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
