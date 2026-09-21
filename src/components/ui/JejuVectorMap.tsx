import { useMemo, useRef, useState, type PointerEvent } from "react"
import { JEJU_OUTLINE, type LngLat } from "../../data/jejuOutline"
import type { RiskMarker } from "../../types/domain"

const BOUNDS = { minLng: 126.14, maxLng: 126.98, minLat: 33.1, maxLat: 33.6 }
const K = Math.cos((33.4 * Math.PI) / 180) // 경도 축 보정(등장방형)
const SCALE = 1000
const W = (BOUNDS.maxLng - BOUNDS.minLng) * K * SCALE
const H = (BOUNDS.maxLat - BOUNDS.minLat) * SCALE

const project = ([lng, lat]: LngLat): [number, number] => [(lng - BOUNDS.minLng) * K * SCALE, (BOUNDS.maxLat - lat) * SCALE]
const ringPath = (ring: LngLat[]) => "M" + ring.map((p) => project(p).map((n) => n.toFixed(1)).join(",")).join("L") + "Z"

const LEVEL_COLOR: Record<string, string> = {
  danger: "var(--risk-danger)",
  alert: "var(--risk-alert)",
  warning: "var(--risk-warning)",
  caution: "var(--risk-caution)",
  safe: "var(--risk-safe)",
  info: "var(--risk-info)",
  offline: "var(--risk-offline)",
}

const REGION_LABEL: Record<"제주시" | "서귀포시", LngLat> = {
  제주시: [126.53, 33.46],
  서귀포시: [126.56, 33.3],
}

const FONT = 16
const textWidth = (s: string) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? FONT * 0.95 : FONT * 0.58), 0)

interface Box { x1: number; y1: number; x2: number; y2: number }
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))

interface Placed { marker: RiskMarker; x: number; y: number; lx: number; ly: number; anchor: "start" | "end" | "middle" }

/** 라벨 후보 위치(우상/우하/좌상/좌하/위/아래)를 돌며 이미 놓인 라벨·마커 점과 가장 덜 겹치는 자리를 고른다 */
function placeLabels(items: { marker: RiskMarker; x: number; y: number }[]): Placed[] {
  const boxes: Box[] = items.map(({ x, y }) => ({ x1: x - 9, y1: y - 9, x2: x + 9, y2: y + 9 }))
  const placed: Placed[] = []
  const order = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  for (const { marker, x, y } of order) {
    const w = textWidth(marker.name)
    const gap = 12
    const candidates: { lx: number; ly: number; anchor: Placed["anchor"]; box: Box }[] = [
      { lx: x + gap, ly: y - 8, anchor: "start", box: { x1: x + gap, y1: y - 8 - FONT, x2: x + gap + w, y2: y - 8 + 4 } },
      { lx: x + gap, ly: y + 20, anchor: "start", box: { x1: x + gap, y1: y + 20 - FONT, x2: x + gap + w, y2: y + 24 } },
      { lx: x - gap, ly: y - 8, anchor: "end", box: { x1: x - gap - w, y1: y - 8 - FONT, x2: x - gap, y2: y - 8 + 4 } },
      { lx: x - gap, ly: y + 20, anchor: "end", box: { x1: x - gap - w, y1: y + 20 - FONT, x2: x - gap, y2: y + 24 } },
      { lx: x, ly: y - 20, anchor: "middle", box: { x1: x - w / 2, y1: y - 20 - FONT, x2: x + w / 2, y2: y - 16 } },
      { lx: x, ly: y + 34, anchor: "middle", box: { x1: x - w / 2, y1: y + 34 - FONT, x2: x + w / 2, y2: y + 38 } },
    ]
    let best = candidates[0]
    let bestScore = Infinity
    for (const c of candidates) {
      let score = boxes.reduce((s, b) => s + overlap(c.box, b), 0)
      if (c.box.x1 < 0 || c.box.x2 > W || c.box.y1 < 0 || c.box.y2 > H) score += 1e4 // 지도 밖으로 나가는 자리는 피함
      if (score < bestScore) {
        best = c
        bestScore = score
      }
    }
    boxes.push(best.box)
    placed.push({ marker, x, y, lx: best.lx, ly: best.ly, anchor: best.anchor })
  }
  return placed
}

const inBounds = (m: RiskMarker) =>
  m.lat != null && m.lng != null && m.lng >= BOUNDS.minLng && m.lng <= BOUNDS.maxLng && m.lat >= BOUNDS.minLat && m.lat <= BOUNDS.maxLat

/** 제주도 행정구역 윤곽(제주시·서귀포시) 위에 위험 마커를 실제 위경도로 그리는 벡터 지도 */
export function JejuVectorMap({ markers }: { markers: RiskMarker[] }) {
  const paths = useMemo(
    () =>
      (Object.keys(JEJU_OUTLINE) as (keyof typeof JEJU_OUTLINE)[]).map((name) => ({
        name,
        d: JEJU_OUTLINE[name].map(ringPath).join(""),
      })),
    [],
  )
  const plotted = useMemo(
    () => placeLabels(markers.filter(inBounds).map((marker) => ({ marker, ...(() => { const [x, y] = project([marker.lng as number, marker.lat as number]); return { x, y } })() }))),
    [markers],
  )
  const outside = markers.filter((m) => !inBounds(m))

  // 드래그로 지도 이동 — viewBox 원점을 옮긴다
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; k: number } | null>(null)
  const limitX = W * 0.6
  const limitY = H * 0.6
  const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v))

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { px: e.clientX, py: e.clientY, ox: pan.x, oy: pan.y, k: Math.min(r.width / W, r.height / H) }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    setPan({ x: clamp(d.ox + (e.clientX - d.px) / d.k, limitX), y: clamp(d.oy + (e.clientY - d.py) / d.k, limitY) })
  }
  const onUp = () => {
    drag.current = null
    setDragging(false)
  }
  const moved = pan.x !== 0 || pan.y !== 0

  return (
    <div className="jvmap">
      <svg
        viewBox={`${(-pan.x).toFixed(1)} ${(-pan.y).toFixed(1)} ${W.toFixed(0)} ${H.toFixed(0)}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="제주도 위험 마커 지도"
        style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {paths.map((p) => (
          <path key={p.name} d={p.d} className={`jvmap__region jvmap__region--${p.name === "제주시" ? "jeju" : "seogwipo"}`} />
        ))}
        {(Object.keys(REGION_LABEL) as (keyof typeof REGION_LABEL)[]).map((name) => {
          const [x, y] = project(REGION_LABEL[name])
          return (
            <text key={name} x={x} y={y} className="jvmap__label" textAnchor="middle">
              {name}
            </text>
          )
        })}
        {plotted.map(({ marker: m, x, y, lx, ly, anchor }) => {
          const color = LEVEL_COLOR[m.level] ?? LEVEL_COLOR.offline
          return (
            <g key={m.id} className="jvmap__mk">
              <circle cx={x} cy={y} r={16} fill={color} opacity={0.28} />
              <circle cx={x} cy={y} r={7} fill={color} stroke="#111" strokeWidth={2} />
              <text x={lx} y={ly} textAnchor={anchor}>
                {m.name}
              </text>
              <title>{`${m.name} · ${m.level}`}</title>
            </g>
          )
        })}
      </svg>
      {moved && (
        <button type="button" className="jvmap__reset" onClick={() => setPan({ x: 0, y: 0 })}>
          위치 초기화
        </button>
      )}
      {outside.length > 0 && (
        <div className="jvmap__out">
          <b>지도 범위 밖 (해상)</b>
          <ul>
            {outside.map((m) => (
              <li key={m.id}>
                <span className="dot" style={{ background: LEVEL_COLOR[m.level] }} />
                {m.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
