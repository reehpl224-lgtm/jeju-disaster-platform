import { useMemo, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Risk } from "../../components/board/BoardParts"
import { JEJU_OUTLINE, type LngLat } from "../../data/jejuOutline"
import { usePilotBatch, type PilotBatchState } from "../../data/pilotBatch/usePilotBatch"
import { propagationInfra } from "../../data/propagationInfra"
import type { PilotBatch, SampleLevel } from "../../data/pilotBatch/generate"

/**
 * 종합상황 우측 패널에 들어가는 실증 3사(하천·연안·저염분) 샘플 배치 블록(화면목록 S1-02).
 * 실증사 연계 전이라 값은 임의 샘플이며, 배치 파일(public/data/pilot-batch.json)이 있으면 그 값을 쓴다.
 */
const tick = { fontSize: 9, fill: "#ffffff88" }
const tip = { background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 11 }
const legend = { fontSize: 10, color: "#ffffffaa" }
const SERIES_COLORS = ["#8ec21f", "#0054a3", "#f2731a"]

function Block({ title, state, children }: { title: string; state: PilotBatchState; children: React.ReactNode }) {
  return (
    <div className="pgroup">
      <p className="pnote">{title}</p>
      {children}
      <p className="s" style={{ fontSize: 10, marginTop: 4 }}>
        {state.origin === "file" ? "배치 파일" : "샘플 생성"} · 기준 {state.batch.generatedAt.replace("T", " ")} · 실증사 연계 전 임의 데이터
      </p>
    </div>
  )
}

/** 전파·경보 인프라 현황 — 상황전파 탭. 스마트폴은 샘플 배치의 상태로 가용률을 보여준다 */
export function PropagationInfraBlock() {
  const state = usePilotBatch()
  const poles = state?.batch.river.smartPoles
  const rows = propagationInfra().map((row) => {
    if (row.id !== "pole" || !poles || poles.length === 0) return row
    const ok = poles.filter((p) => p.status === "정상").length
    return {
      ...row,
      status: `정상 ${ok}/${poles.length}기`,
      level: (ok === poles.length ? "safe" : ok === 0 ? "danger" : "warning") as SampleLevel,
      rate: `가용률 ${Math.round((ok / poles.length) * 100)}%(샘플)`,
    }
  })
  return (
    <div className="pgroup">
      <p className="pnote">전파·경보 인프라 현황</p>
      <ul className="plist">
        {rows.map((row) => (
          <li key={row.id} className="row-between">
            <span>{row.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {row.rate !== "-" && (
                <span className="s" style={{ margin: 0 }}>
                  {row.rate}
                </span>
              )}
              <Risk level={row.level} label={row.status} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 하천 관측점 6개소 + 스마트폴 상태 — 센서정보 탭 */
export function RiverPointsBlock() {
  const state = usePilotBatch()
  if (!state) return null
  const { points, smartPoles } = state.batch.river
  return (
    <>
      <Block title={`하천 관측점 ${points.length}개소 — 효돈천(샘플)`} state={state}>
        <ul className="plist">
          {points.map((p) => (
            <li key={p.id} className="row-between">
              <div>
                <p className="t">{p.name}</p>
                <p className="s">
                  Q {p.flowRatioPercent}% · 60분 후 예측 {p.forecast[2].levelM}m
                </p>
              </div>
              <Risk level={p.level} label={`${p.levelM}m`} />
            </li>
          ))}
        </ul>
      </Block>
      <Block title="스마트폴 상태(샘플)" state={state}>
        <ul className="plist">
          {smartPoles.map((s) => (
            <li key={s.id} className="row-between">
              <span>{s.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="s" style={{ margin: 0 }}>
                  배터리 {s.batteryPercent}%
                </span>
                <Risk level={s.status === "정상" ? "safe" : s.status === "점검" ? "caution" : "danger"} label={s.status} />
              </span>
            </li>
          ))}
        </ul>
      </Block>
    </>
  )
}

/** 하천 수위 예측곡선(현재 → 10·30·60분 후) — 센서 추이 탭 */
export function RiverForecastBlock() {
  const state = usePilotBatch()
  const [id, setId] = useState("donnaeko")
  if (!state) return null
  const { points, boundaryM } = state.batch.river
  const p = points.find((x) => x.id === id) ?? points[0]
  const last = p.history[p.history.length - 1]
  const data = [
    ...p.history.map((h, i) => ({ t: h.t, observed: h.levelM, predicted: i === p.history.length - 1 ? h.levelM : undefined })),
    ...p.forecast.map((f) => ({ t: `+${f.minutes}분`, predicted: f.levelM })),
  ]
  return (
    <Block title="하천 수위 예측곡선 — 10·30·60분 후(샘플)" state={state}>
      <select className="select" value={p.id} onChange={(e) => setId(e.target.value)} aria-label="관측점" style={{ height: 30, fontSize: 12, marginBottom: 6 }}>
        {points.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="t" tick={tick} stroke="#3a3b3c" interval={1} />
            <YAxis tick={tick} stroke="#3a3b3c" domain={[0, "auto"]} unit="m" />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={legend} />
            <Line type="monotone" dataKey="observed" name="실측 수위" stroke="#8ec21f" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="predicted" name="예측 수위" stroke="#f2731a" strokeWidth={2} strokeDasharray="5 3" dot connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="s" style={{ fontSize: 11 }}>
        현재 {last.levelM}m · 경계 기준 {boundaryM}m · 현재 위험등급 <Risk level={p.level} />
      </p>
    </Block>
  )
}

/** 쇠소깍 감조구간 수위×조위 시간 연계 — 센서 추이 탭 */
export function TideBlock() {
  const state = usePilotBatch()
  if (!state) return null
  const { tide, boundaryM } = state.batch.river
  return (
    <Block title="수위 × 조위 시간 연계 — 쇠소깍 감조구간(샘플)" state={state}>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tide} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="t" tick={tick} stroke="#3a3b3c" interval={5} />
            <YAxis tick={tick} stroke="#3a3b3c" domain={[0, "auto"]} unit="m" />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={legend} />
            <ReferenceLine y={boundaryM} stroke="#ff3b30" strokeDasharray="4 4" ifOverflow="extendDomain" />
            <Line type="monotone" dataKey="tideM" name="조위(m)" stroke="#0054a3" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="levelM" name="수위(m)" stroke="#8ec21f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="s" style={{ fontSize: 11 }}>
        점선은 경계 수위 {boundaryM}m. 현재 이후 구간은 예측입니다.
      </p>
    </Block>
  )
}

/** 연안 이용객 밀집 추이 — 센서 추이 탭 */
export function CoastCrowdBlock() {
  const state = usePilotBatch()
  if (!state) return null
  const { crowd } = state.batch.coast
  const data = crowd[0].series.map((row, i) => ({ t: row.t, ...Object.fromEntries(crowd.map((c) => [c.siteId, c.series[i].count])) }))
  return (
    <Block title="연안 이용객 밀집 추이 — 시간당 이용객(샘플)" state={state}>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="t" tick={tick} stroke="#3a3b3c" interval={2} />
            <YAxis tick={tick} stroke="#3a3b3c" domain={[0, "auto"]} />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={legend} />
            <ReferenceLine y={crowd[0].limit} stroke="#f2731a" strokeDasharray="4 4" ifOverflow="extendDomain" />
            {crowd.map((c, i) => (
              <Line key={c.siteId} type="monotone" dataKey={c.siteId} name={c.name} stroke={SERIES_COLORS[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="s" style={{ fontSize: 11 }}>점선은 밀집 주의 기준 {crowd[0].limit}명/시간(샘플 기준)입니다.</p>
    </Block>
  )
}

/** 저염분 표층 염분·수온 시계열 — 센서 추이 탭 */
export function AquaSeriesBlock() {
  const state = usePilotBatch()
  if (!state) return null
  const { series } = state.batch.aqua
  return (
    <Block title="저염분·고수온 — 표층 염분·수온 시계열(샘플)" state={state}>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="t" tick={tick} stroke="#3a3b3c" interval={11} />
            <YAxis yAxisId="s" tick={tick} stroke="#3a3b3c" domain={["auto", "auto"]} />
            <YAxis yAxisId="t" orientation="right" tick={tick} stroke="#3a3b3c" domain={["auto", "auto"]} />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={legend} />
            <ReferenceLine yAxisId="s" y={30} stroke="#f2731a" strokeDasharray="4 4" ifOverflow="extendDomain" />
            <Line yAxisId="s" type="monotone" dataKey="salinity" name="염분(psu)" stroke="#0054a3" strokeWidth={2} dot={false} />
            <Line yAxisId="t" type="monotone" dataKey="tempC" name="수온(℃)" stroke="#8ec21f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="s" style={{ fontSize: 11 }}>점선은 염분 정상 하한 30psu. 현재 이후 구간은 예측입니다.</p>
    </Block>
  )
}

/** 연안 VLM 10분 상황요약 — AI 분석 탭 */
export function VlmBlock() {
  const state = usePilotBatch()
  if (!state) return null
  return (
    <Block title="연안 VLM 10분 상황요약(샘플)" state={state}>
      <ul className="plist">
        {state.batch.coast.vlmSummaries.map((v) => (
          <li key={v.at}>
            <div className="row-between">
              <span className="s" style={{ margin: 0 }}>
                {v.at.slice(11)}
              </span>
              <Risk level={v.level} />
            </div>
            <p className="t" style={{ marginTop: 2 }}>
              {v.text}
            </p>
          </li>
        ))}
      </ul>
    </Block>
  )
}

/** 저염분 취수구별 도달 예상 시간 — AI 분석 탭 */
export function IntakeBlock() {
  const state = usePilotBatch()
  if (!state) return null
  return (
    <Block title="저염수 취수구 도달 예상(샘플)" state={state}>
      <ul className="plist">
        {state.batch.aqua.intakes.map((i) => (
          <li key={i.id} className="row-between">
            <span>{i.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="s" style={{ margin: 0 }}>
                {i.etaHours === null ? "120시간 내 도달 없음" : `약 ${i.etaHours}시간 후`}
              </span>
              <Risk level={i.level} />
            </span>
          </li>
        ))}
      </ul>
      <p className="s" style={{ fontSize: 11 }}>염분 30psu 미만 도달 기준, 등급은 48시간 뒤 염분 기준입니다.</p>
    </Block>
  )
}

// ---------------------------------------------------------------- 저염수 확산 히트맵
const MAP = { minLng: 126.0, maxLng: 126.4, minLat: 33.1, maxLat: 33.45 }
const K = Math.cos((33.3 * Math.PI) / 180)
const SCALE = 800
const W = (MAP.maxLng - MAP.minLng) * K * SCALE
const H = (MAP.maxLat - MAP.minLat) * SCALE
const px = (lng: number) => (lng - MAP.minLng) * K * SCALE
const py = (lat: number) => (MAP.maxLat - lat) * SCALE
const LEVEL_FILL: Record<SampleLevel, string> = {
  safe: "var(--risk-safe)",
  caution: "var(--risk-caution)",
  warning: "var(--risk-warning)",
  alert: "var(--risk-alert)",
  danger: "var(--risk-danger)",
}

const inRing = (lng: number, lat: number, ring: LngLat[]) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const ALL_RINGS: LngLat[][] = [...JEJU_OUTLINE.제주시, ...JEJU_OUTLINE.서귀포시]
const ISLAND_PATH = ALL_RINGS.map((ring) => "M" + ring.map(([lng, lat]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join("L") + "Z").join("")

function Heatmap({ batch, horizon }: { batch: PilotBatch; horizon: 48 | 120 }) {
  const cells = useMemo(() => {
    const grid = batch.aqua.heatmap.find((h) => h.horizonHours === horizon)?.cells ?? []
    return grid.filter((c) => c.lng >= MAP.minLng && c.lng <= MAP.maxLng && !ALL_RINGS.some((r) => inRing(c.lng, c.lat, r)))
  }, [batch, horizon])
  const cw = 0.02 * K * SCALE
  const ch = 0.02 * SCALE
  const intakes = [
    { n: "한경", lat: 33.325, lng: 126.17 },
    { n: "고산", lat: 33.295, lng: 126.16 },
    { n: "대정", lat: 33.23, lng: 126.22 },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`저염수 확산 히트맵 ${horizon}시간 후(샘플)`} style={{ background: "#151617", borderRadius: 8 }}>
      {cells.map((c) => (
        <rect key={`${c.lat}-${c.lng}`} x={px(c.lng) - cw / 2} y={py(c.lat) - ch / 2} width={cw} height={ch} fill={LEVEL_FILL[c.level]} opacity={c.level === "safe" ? 0.18 : 0.6}>
          <title>{`${c.salinity}psu`}</title>
        </rect>
      ))}
      <path d={ISLAND_PATH} fill="#3a4651" stroke="#6b7c8a" strokeWidth={1} />
      {intakes.map((i) => (
        <g key={i.n}>
          <circle cx={px(i.lng)} cy={py(i.lat)} r={3.5} fill="#fff" stroke="#111" />
          <text x={px(i.lng) + 6} y={py(i.lat) + 3} fontSize={10} fill="#fff">
            {i.n}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** 저염수 확산 히트맵(48h/120h) — AI 분석 탭 */
export function PlumeHeatmapBlock() {
  const state = usePilotBatch()
  const [horizon, setHorizon] = useState<48 | 120>(48)
  if (!state) return null
  return (
    <Block title="저염수 확산 히트맵 — 한경·대정 해역(샘플)" state={state}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {([48, 120] as const).map((h) => (
          <button key={h} type="button" className="chip" aria-pressed={horizon === h} onClick={() => setHorizon(h)} style={{ height: 28, fontSize: 12 }}>
            {h}시간 후
          </button>
        ))}
      </div>
      <Heatmap batch={state.batch} horizon={horizon} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, alignItems: "center" }}>
        <span className="s" style={{ margin: 0, fontSize: 10 }}>염분</span>
        <Risk level="safe" label="30↑" />
        <Risk level="caution" label="28~30" />
        <Risk level="warning" label="26~28" />
        <Risk level="alert" label="24~26" />
        <Risk level="danger" label="24↓" />
      </div>
    </Block>
  )
}

/** 대응 체크리스트 — 대응현황 탭 */
export function CoastChecklistBlock() {
  const state = usePilotBatch()
  if (!state) return null
  const { checklist, currentStage } = state.batch.coast
  return (
    <Block title={`연안 4단계 체크리스트 — 현재 ${currentStage}(샘플)`} state={state}>
      <ul className="plist">
        {checklist.map((c) => (
          <li key={c.stage} className="row-between">
            <span>
              <b>{c.stage}</b> <span className="s" style={{ margin: 0 }}>{c.action}</span>
            </span>
            <Risk level={c.done ? "safe" : "offline"} label={c.done ? "완료" : "대기"} />
          </li>
        ))}
      </ul>
    </Block>
  )
}

export function AquaChecklistBlock() {
  const state = usePilotBatch()
  if (!state) return null
  return (
    <Block title="저염분 대응 체크리스트 5항목(샘플)" state={state}>
      <ul className="plist">
        {state.batch.aqua.checklist.map((c) => (
          <li key={c.item} className="row-between">
            <span>{c.item}</span>
            <Risk level={c.done ? "safe" : "offline"} label={c.done ? "완료" : "대기"} />
          </li>
        ))}
      </ul>
    </Block>
  )
}
