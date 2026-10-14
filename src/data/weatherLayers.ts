import type { RiskLevel } from "../types/domain"
import type { WarningEntry } from "../types/warningsApi"
import { warnIsActive, warnLvlLabel, warnLvlRisk } from "./warningLevel"

/**
 * GIS 지도 '기상/재난'·'기상모델' 패널의 체크 항목을 지도에 그리는 계산 — 요구사항 '지도 기반 통합 표출'(기상 정보를 레이어로 표출·선택).
 * 기상특보는 기상청 특보 값을 칩에 맞춰 걸러 찍고, 재난정보·감시구역·기상모델 격자는 우리 회사가 가진 항목이라 자료 수령 전까지 임의 샘플이다(스테이징만).
 * 이 파일은 지도·React와 무관한 계산만 둔다.
 */

/** 특보 칩 id → 기상청 특보 종류 코드 */
export const WARNING_CHIP_CODES: Record<string, string[]> = {
  typhoon: ["T"],
  "heavy-rain": ["R"],
  "strong-wind": ["W"],
  dry: ["D"],
  "heavy-snow": ["S"],
  "heat-wave": ["H"],
  "yellow-dust": ["Y"],
  "cold-wave": ["C"],
  tsunami: ["O"],
}

/** 특보가 구역 단위라 정확한 좌표가 없어 시청 위치에 모아 찍는다 */
const CITY_HALL: Record<string, { lat: number; lng: number }> = { 제주시: { lat: 33.4996, lng: 126.5312 }, 서귀포시: { lat: 33.2541, lng: 126.5601 } }

export interface LayerPoint {
  id: string
  name: string
  lat: number
  lng: number
  level: RiskLevel
  value: string
}

/** 발효 중인 주의보·경보를 켠 칩의 종류만, 시·종류별 한 점으로 — 같은 시에 여러 종류면 조금씩 비껴 찍는다 */
export function warningLayerPoints(entries: WarningEntry[], checkedChips: string[]): LayerPoint[] {
  const codes = new Set(checkedChips.flatMap((c) => WARNING_CHIP_CODES[c] ?? []))
  const best = new Map<string, WarningEntry>()
  for (const e of entries) {
    if (!codes.has(e.wrn) || (e.lvl !== "2" && e.lvl !== "3") || !warnIsActive(e) || !CITY_HALL[e.regionLabel]) continue
    const key = `${e.regionLabel}:${e.wrn}`
    const prev = best.get(key)
    if (!prev || e.lvl > prev.lvl) best.set(key, e)
  }
  const perCity = new Map<string, number>()
  return [...best.values()]
    .sort((a, b) => `${a.regionLabel}${a.wrn}`.localeCompare(`${b.regionLabel}${b.wrn}`))
    .map((e) => {
      const n = perCity.get(e.regionLabel) ?? 0
      perCity.set(e.regionLabel, n + 1)
      const base = CITY_HALL[e.regionLabel]
      return {
        id: `wl-${e.regionLabel}-${e.wrn}`,
        name: `${e.regionLabel} · ${e.wrnLabel}${warnLvlLabel(e.lvl)}`,
        lat: base.lat + n * 0.018,
        lng: base.lng + n * 0.018,
        level: warnLvlRisk(e.lvl),
        value: `기상청 특보 발표 · 시청 위치에 모아 표시`,
      }
    })
}

const sample = (wrn: string, wrnLabel: string, regionLabel: string, lvl: "2" | "3"): WarningEntry => ({
  tmFc: "202610130900",
  tmEf: "202610130900",
  regId: regionLabel,
  regionLabel,
  wrn,
  wrnLabel,
  lvl,
  lvlLabel: "",
  state: "active",
})
/** 스테이징 샘플 — 실제 발효 특보가 하나도 없을 때 칩이 지도에 반영되는 모습을 보이려고 쓴다 */
export const SAMPLE_WARNING_ENTRIES: WarningEntry[] = [
  sample("R", "호우", "제주시", "2"),
  sample("R", "호우", "서귀포시", "3"),
  sample("W", "강풍", "서귀포시", "2"),
  sample("T", "태풍", "서귀포시", "2"),
  sample("D", "건조", "제주시", "2"),
  sample("S", "대설", "제주시", "2"),
  sample("H", "폭염", "서귀포시", "2"),
  sample("Y", "황사", "제주시", "2"),
  sample("C", "한파", "제주시", "2"),
  sample("O", "해일", "서귀포시", "2"),
]

/** 재난정보(홍수·지진·산사태) 임의 샘플 점 — 자사 보유 항목 수령 전. 홍수는 레거시 침수 샘플과 같은 위치를 쓴다 */
export const DISASTER_INFO_SAMPLES: Record<string, LayerPoint[]> = {
  flood: [
    { id: "di-flood-1", name: "침수 · 건입동(샘플)", lat: 33.519, lng: 126.5385, level: "alert", value: "임의 샘플 — 자동 침수 경보 수위 연동 전" },
    { id: "di-flood-2", name: "침수 · 한천 용연(샘플)", lat: 33.5139, lng: 126.5106, level: "warning", value: "임의 샘플" },
  ],
  earthquake: [{ id: "di-quake-1", name: "지진 M2.6 · 서귀포 남쪽 해역(샘플)", lat: 33.05, lng: 126.62, level: "caution", value: "임의 샘플 — 기상청 지진통보 연계 전" }],
  landslide: [
    { id: "di-slide-1", name: "산사태 위험지구 · 어승생(샘플)", lat: 33.391, lng: 126.493, level: "warning", value: "임의 샘플" },
    { id: "di-slide-2", name: "산사태 위험지구 · 서귀포 토평(샘플)", lat: 33.285, lng: 126.607, level: "caution", value: "임의 샘플" },
  ],
}

/** 감시구역(태풍 비상·경계·감시구역 경계) 임의 샘플 — 제주 남쪽 바다를 중심으로 한 동심원 */
export const WATCH_ZONE_SAMPLES: { id: string; name: string; radiusM: number; color: string }[] = [
  { id: "wz-emergency", name: "태풍 비상구역 경계(샘플)", radiusM: 90000, color: "#ff3b30" },
  { id: "wz-alert", name: "태풍 경계구역 경계(샘플)", radiusM: 180000, color: "#f2731a" },
  { id: "wz-watch", name: "태풍 감시구역 경계(샘플)", radiusM: 270000, color: "#f9cd00" },
]
export const WATCH_ZONE_CENTER: [number, number] = [32.9, 126.5]

export type ModelElement = "rain" | "wind" | "temp" | "cloud"
export const MODEL_LABEL: Record<string, string> = { kma: "기상청", de: "독일모델", us: "미국모델" }
export const ELEMENT_LABEL: Record<ModelElement, { name: string; unit: string }> = {
  rain: { name: "강수", unit: "mm/h" },
  wind: { name: "바람", unit: "m/s" },
  temp: { name: "기온", unit: "℃" },
  cloud: { name: "구름", unit: "%" },
}
const ELEMENT_RANGE: Record<ModelElement, [number, number]> = { rain: [0, 30], wind: [2, 18], temp: [8, 24], cloud: [10, 100] }
const ELEMENT_COLOR: Record<ModelElement, [number, number, number]> = { rain: [30, 120, 255], wind: [0, 190, 140], temp: [255, 140, 30], cloud: [200, 200, 215] }
const MODEL_PHASE: Record<string, number> = { kma: 0, de: 1.3, us: 2.6 }

/** 체크박스 id("kma-rain"·"de-wind" …) → 모델·요소. 모르는 id면 null */
export function parseModelLayer(id: string): { model: string; element: ModelElement } | null {
  const [model, element] = id.split("-")
  return MODEL_PHASE[model] !== undefined && element in ELEMENT_LABEL ? { model, element: element as ModelElement } : null
}

/** 격자 한 칸의 임의 값 — 위치·모델로만 정해지는 결정적 값(같은 칸은 늘 같은 값) */
export function modelCellValue(lat: number, lng: number, model: string, element: ModelElement): number {
  const [lo, hi] = ELEMENT_RANGE[element]
  const phase = MODEL_PHASE[model] ?? 0
  const kind = { rain: 0, wind: 0.7, temp: 1.4, cloud: 2.1 }[element]
  const t = (Math.sin(lat * 38 + phase + kind) + Math.cos(lng * 27 - phase * 0.7 + kind) + 2) / 4
  return Math.round((lo + (hi - lo) * t) * 10) / 10
}

/** 값에 따른 칸 색(rgba) — 낮을수록 투명하다 */
export function modelCellColor(element: ModelElement, value: number): string {
  const [lo, hi] = ELEMENT_RANGE[element]
  const [r, g, b] = ELEMENT_COLOR[element]
  const a = 0.08 + 0.5 * Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
  return `rgba(${r},${g},${b},${a.toFixed(2)})`
}

/** 제주 전역 격자(0.05° 간격) — 한 칸의 남서·북동 모서리 */
export const MODEL_GRID: { lat: number; lng: number }[] = (() => {
  const out: { lat: number; lng: number }[] = []
  for (let lat = 33.1; lat < 33.6; lat = Math.round((lat + 0.05) * 100) / 100) for (let lng = 126.1; lng < 127.0; lng = Math.round((lng + 0.05) * 100) / 100) out.push({ lat, lng })
  return out
})()
export const MODEL_CELL = 0.05
