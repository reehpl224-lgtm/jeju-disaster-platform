import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { SAMPLE_SENSOR_ALERTS, SAMPLE_SENSOR_SUMMARY, SAMPLE_SERVICE_SENSORS, SAMPLE_TREND_CARDS, SAMPLE_TREND_RANK, type SpTrendCard, type SpTrendRank } from "../../data/sidePanelSamples"
import { LEVEL_RANK, SERVICES, serviceShort, serviceTitle, trendDirection, trendPosition, usePanelInput, type InputLevel } from "../../data/panelInput"
import type { RiskLevel } from "../../types/domain"
import { PartTag, SpRisk } from "./primitives"
import { levelName, spLevel } from "./spUtils"

const SEG_INDEX: Record<string, number> = { safe: 0, caution: 1, warning: 2, alert: 3, danger: 3 }
const SEG_COLOR = ["var(--risk-safe)", "var(--risk-caution)", "var(--risk-warning)", "var(--risk-alert)", "var(--risk-alert)"]

interface SvcTile {
  id: string
  title: string
  count: number | null
  level: InputLevel | null
}

/** R2 · 우측 · 센서정보 — 전체 서비스 센서 현황. 영역마다 입력값이 있으면 그 값, 없으면 샘플(표식). 서비스가 늘면 타일만 늘어난다. */
export function SensorSummaryPanel() {
  const nav = useNavigate()
  const inp = usePanelInput()
  const sumSample = inp.sensorSummary === undefined
  const svcSample = inp.serviceSensors === undefined
  const alSample = inp.sensorAlerts === undefined
  const fully = sumSample && svcSample && alSample

  const s = inp.sensorSummary ?? { normal: SAMPLE_SENSOR_SUMMARY.normal, delayed: SAMPLE_SENSOR_SUMMARY.delayed, error: SAMPLE_SENSOR_SUMMARY.error, unlinked: SAMPLE_SENSOR_SUMMARY.unlinked }
  const total = s.normal + s.delayed + s.error + s.unlinked
  const pct = (n: number) => (total > 0 ? `${(n / total) * 100}%` : "0%")

  const tiles: SvcTile[] = SERVICES.map((sv) => {
    if (svcSample) {
      const x = SAMPLE_SERVICE_SENSORS.find((v) => v.id === sv.id)
      return { id: sv.id, title: sv.title, count: x?.count ?? null, level: (x?.level as InputLevel | undefined) ?? null }
    }
    const x = inp.serviceSensors?.find((v) => v.id === sv.id)
    return { id: sv.id, title: sv.title, count: x?.count ?? null, level: x?.level ?? null }
  }).sort((a, b) => (b.level ? LEVEL_RANK[b.level] : -1) - (a.level ? LEVEL_RANK[a.level] : -1) || (b.count ?? 0) - (a.count ?? 0))
  const sensorTotal = tiles.reduce((n, t) => n + (t.count ?? 0), 0)

  const alerts = alSample
    ? SAMPLE_SENSOR_ALERTS.map((a) => ({ name: a.name, service: a.service, reason: a.reason, value: a.value, level: a.level as RiskLevel, badge: a.badge }))
    : (inp.sensorAlerts ?? []).map((a) => ({ name: a.name, service: serviceTitle(a.service), reason: a.reason, value: a.value, level: a.level as RiskLevel, badge: a.badge }))
  const valueBad = alerts.filter((a) => a.reason === "값 이상").length
  const collectBad = alerts.filter((a) => a.reason === "수집 이상").length

  return (
    <div className="sp">
      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2">센서 수집 상태</b>
          <PartTag sample={sumSample} fully={fully} />
          <span className="sp-spacer" />
          <span className="sp-note">값 위험등급과는 별개</span>
        </div>
        <div className="sp-stats sp-stats--4">
          <div className="sp-stat sp-stat--dark">
            <small>전체</small>
            <b>{total}</b>
          </div>
          <div className="sp-stat sp-stat--dark">
            <small>정상</small>
            <b className="sp-c--safe">{s.normal}</b>
          </div>
          <div className="sp-stat sp-stat--dark">
            <small>지연·오류</small>
            <b className="sp-c--caution">{s.delayed + s.error}</b>
          </div>
          <div className="sp-stat sp-stat--dark">
            <small>미연계</small>
            <b className="sp-c--offline">{s.unlinked}</b>
          </div>
        </div>
        <div className="sp-segbar" role="img" aria-label="수집 상태 비율">
          <i style={{ width: pct(s.normal), background: "var(--risk-safe)" }} />
          <i style={{ width: pct(s.delayed), background: "var(--risk-caution)" }} />
          <i style={{ width: pct(s.error), background: "var(--risk-alert)" }} />
          <i style={{ width: pct(s.unlinked), background: "var(--foreground-subtle)" }} />
        </div>
        <div className="sp-legend">
          <span><i className="sp-dot sp-bg--safe" />정상</span>
          <span><i className="sp-dot sp-bg--caution" />지연 {s.delayed}</span>
          <span><i className="sp-dot sp-bg--alert" />오류 {s.error}</span>
          <span><i className="sp-dot" style={{ background: "var(--foreground-subtle)" }} />미연계 {s.unlinked}</span>
        </div>
      </div>

      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2">
            {tiles.length} 서비스 · 센서 {sensorTotal}개
          </b>
          <PartTag sample={svcSample} fully={fully} />
          <span className="sp-spacer" />
          <span className="sp-note">높은 등급 순</span>
        </div>
        <div className="sp-svcs">
          {tiles.map((x) => (
            <button key={x.id} type="button" className={`sp-svc ${x.level ? `sp-svc--${x.level}` : ""}`} onClick={() => nav(`/${x.id}`)} title={`${x.title} 화면으로`}>
              <small>{x.title}</small>
              <span className="n">
                {x.count ?? "—"}
                {x.count !== null && <i>개</i>}
              </span>
              <span className={`lv sp-c--${x.level ? spLevel(x.level) : "offline"}`}>
                <i className={`sp-dot sp-bg--${x.level ? spLevel(x.level) : "offline"}`} />
                {x.level ? levelName(x.level, "정상") : "정보 없음"}
              </span>
            </button>
          ))}
        </div>
        <p className="sp-note">타일 색 = 서비스에서 가장 높은 위험등급 · 숫자 = 센서 수 · 타일을 누르면 서비스 센서 목록</p>
      </div>
      <p className="sp-note" style={{ marginTop: -6 }}>
        서비스가 추가되면 타일이 늘어납니다(3열 자동 줄바꿈) · 값은 <Link to="/panel-input" className="sp-link" style={{ fontSize: 10 }}>패널 입력</Link>에서 넣습니다
      </p>

      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>
            확인 필요 센서
          </b>
          <PartTag sample={alSample} fully={fully} />
          <span className="sp-spacer" />
          <span className="sp-note">
            값 이상 {valueBad} · 수집 이상 {collectBad}
          </span>
        </div>
        {alerts.length === 0 && <p className="sp-note">확인이 필요한 센서가 없습니다</p>}
        {alerts.map((a, i) => (
          <div className="sp-item" key={`${a.name}-${i}`}>
            <div className="l">
              <b>{a.name || "—"}</b>
              <small>
                {a.service} · {a.reason}
              </small>
            </div>
            <div className="r">
              {a.value || "—"}
              <SpRisk level={a.level}>{a.badge || levelName(a.level)}</SpRisk>
            </div>
          </div>
        ))}
        <Link className="sp-link" to="/data-systems">
          전체 보기 → 서비스별 센서 목록
        </Link>
      </div>
    </div>
  )
}

const TREND_ARROW = { up: "↗ 상승", flat: "→ 유지", down: "↘ 하락" } as const
const fmtNum = (n: number | undefined) => (n === undefined ? "—" : String(Math.round(n * 100) / 100))

/** R3 · 우측 · 센서 추이 — 위험 임박 순위 + 서비스별 대표 추이. 입력한 지표가 있으면 그것으로 계산하고, 없으면 샘플. */
export function SensorTrendPanel() {
  const inp = usePanelInput()
  const sample = inp.trends === undefined
  const [filter, setFilter] = useState<string>("전체")
  const [period, setPeriod] = useState("6시간")

  const rank: SpTrendRank[] = sample
    ? SAMPLE_TREND_RANK
    : (inp.trends ?? [])
        .map((t) => ({ service: serviceShort(t.service), name: t.name, value: `${fmtNum(t.observed.at(-1))}${t.unit}`, trend: trendDirection(t), level: t.level as RiskLevel, position: trendPosition(t) }))
        .sort((a, b) => LEVEL_RANK[b.level as InputLevel] - LEVEL_RANK[a.level as InputLevel] || b.position - a.position)
  const cards: SpTrendCard[] = sample
    ? SAMPLE_TREND_CARDS
    : (inp.trends ?? []).map((t) => ({
        service: serviceShort(t.service),
        name: t.name,
        value: fmtNum(t.observed.at(-1)),
        unit: t.unit,
        trend: trendDirection(t),
        level: t.level as RiskLevel,
        observed: t.observed,
        forecast: t.forecast,
        thresholdAt: 0.8,
        threshold: t.threshold ?? undefined,
        thresholdLabel: t.threshold !== null ? `${t.thresholdLabel} ${t.threshold}${t.unit}${t.worse === "below" ? "↓" : ""}` : "기준값 미입력",
      }))
  const services = ["전체", ...Array.from(new Set(rank.map((r) => r.service)))]
  const shownRank = rank.filter((r) => filter === "전체" || r.service === filter)
  const shownCards = cards.filter((c) => filter === "전체" || c.service === filter)

  return (
    <div className="sp">
      <div className="sp-pills">
        {services.map((s) => (
          <button key={s} type="button" className="sp-pill" aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
        <span className="sp-pill sp-pill--static sp-pill--ghost">+ 서비스 추가 시 자동</span>
      </div>
      <div className="sp-tabs-inline">
        <span>기간</span>
        {["6시간", "24시간", "7일"].map((p) => (
          <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="sp-card sp-card--open" style={{ gap: 14 }}>
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>
            위험 임박 순위
          </b>
          <PartTag sample={sample} fully={sample} />
          <span className="sp-spacer" />
          <span className="sp-note">모든 지표를 같은 5단계 눈금으로</span>
        </div>
        {shownRank.length === 0 && <p className="sp-note">{sample ? "표시할 지표가 없습니다" : "입력된 추이 지표가 없습니다 — 패널 입력에서 추가하세요"}</p>}
        {shownRank.map((r) => {
          const seg = SEG_INDEX[r.level]
          return (
            <div className="sp-rank" key={`${r.service}-${r.name}`} style={{ gap: 0 }}>
              <div className="top">
                <span className="sp-tag">{r.service}</span>
                <b>{r.name}</b>
                <span className={`sp-c--${spLevel(r.level)}`}>{r.value}</span>
                <em>{TREND_ARROW[r.trend]}</em>
              </div>
              <div className="sp-gauge">
                {SEG_COLOR.map((c, i) => (
                  <i key={i} style={{ background: c, opacity: i === seg ? 1 : 0.28 }} />
                ))}
                <span className="pos" style={{ left: `${r.position * 100}%` }} />
              </div>
            </div>
          )
        })}
        <div className="sp-legend">
          {(["safe", "caution", "warning", "alert", "alert"] as RiskLevel[]).map((l, i) => (
            <span key={i}>
              <i className={`sp-dot sp-bg--${l}`} />
              {["평시", "관심", "주의", "경계", "심각"][i]}
            </span>
          ))}
        </div>
        <p className="sp-note">흰 막대 = 현재 위치 · 지표마다 다른 기준(Q%·m·psu·명)을 서비스 단계 기준으로 환산</p>
      </div>

      <div className="sp-card sp-card--open" style={{ gap: 10 }}>
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>
            서비스별 대표 추이
          </b>
          <PartTag sample={sample} fully={sample} />
          <span className="sp-spacer" />
          <span className="sp-note">점선 = 다음 단계 기준 · 음영 = 예측</span>
        </div>
        <div className="sp-tcards">
          {shownCards.map((c) => (
            <TrendCard key={`${c.service}-${c.name}`} c={c} />
          ))}
        </div>
        <div className="sp-grow">
          <b>+ 새 서비스의 센서가 등록되면</b>
          <small>순위 · 필터 칩 · 대표 추이에 자동으로 추가됩니다</small>
        </div>
      </div>
      <p className="sp-note">
        {sample ? "값은 모두 샘플 · " : ""}지표는 <Link to="/panel-input" className="sp-link" style={{ fontSize: 10 }}>패널 입력</Link>에서 넣습니다
      </p>
    </div>
  )
}

function TrendCard({ c }: { c: SpTrendCard }) {
  const all = [...c.observed, ...c.forecast]
  const W = 150, H = 64
  const dom = c.threshold !== undefined ? [...all, c.threshold] : all
  const lo = Math.min(...dom), hi = Math.max(...dom)
  const x = (i: number) => (all.length > 1 ? (W / (all.length - 1)) * i : W / 2)
  const y = (v: number) => 6 + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (H - 16)
  const obs = c.observed.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const fcIdx = c.forecast.length > 0 ? [c.observed.length - 1, ...c.forecast.map((_, i) => c.observed.length + i)] : []
  const fc = fcIdx.map((idx) => `${x(idx)},${y(all[idx])}`).join(" ")
  const col = `var(--risk-${spLevel(c.level)})`
  const tY = c.threshold !== undefined ? y(c.threshold) : 6 + (1 - c.thresholdAt) * (H - 16)
  const arrow = c.trend === "up" ? "↗" : c.trend === "down" ? "↘" : "→"
  return (
    <div className="sp-tc">
      <div className="hd">
        <span className="sp-tag">{c.service}</span>
        {c.name}
      </div>
      <div className={`v sp-c--${spLevel(c.level)}`}>
        {c.value}
        <i>{c.unit}</i> {arrow}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${c.name} 추이`}>
        {c.forecast.length > 0 && <rect x={x(c.observed.length - 1)} y={0} width={W - x(c.observed.length - 1)} height={H} fill="var(--foreground-ghost)" />}
        {(c.threshold !== undefined || c.thresholdAt) && <line x1={0} x2={W} y1={tY} y2={tY} stroke="var(--risk-alert)" strokeDasharray="3 3" strokeWidth={1} />}
        {c.observed.length > 1 ? <polyline points={obs} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" /> : <circle cx={x(0)} cy={y(c.observed[0] ?? lo)} r={3} fill={col} />}
        {fc && <polyline points={fc} fill="none" stroke={col} strokeWidth={2} strokeDasharray="3 3" />}
      </svg>
      <span className="ft">{c.thresholdLabel}</span>
    </div>
  )
}
