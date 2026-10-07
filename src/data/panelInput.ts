import { useSyncExternalStore } from "react"
import { SERVICES, type PanelInput, type PartKey, type InputLevel } from "./panelInputLogic"
import {
  SAMPLE_ACTIONS,
  SAMPLE_AGENCIES,
  SAMPLE_SENSOR_ALERTS,
  SAMPLE_SENSOR_SUMMARY,
  SAMPLE_SERVICE_SENSORS,
  SAMPLE_SERVICE_STAGES,
  SAMPLE_TEAMS,
  SAMPLE_TREND_CARDS,
} from "./sidePanelSamples"

export * from "./panelInputLogic"

/**
 * 사이드패널 입력 저장소 — 센서(R2·R3)와 대응 단계(R4)에 쓸 값을 사용자가 직접 넣는다. **이 브라우저의 localStorage에만 저장**한다
 * (다른 PC·브라우저에는 보이지 않는다). 영역(part)마다 따로 동작한다:
 *   - 영역 값이 **없음(undefined)** → 화면이 샘플을 보여주고 "샘플" 표식을 붙인다
 *   - 영역 값이 **있음** → 입력한 값 그대로 보여준다(빈 항목은 빈 값 그대로 — 샘플로 메우지 않는다)
 * 입력 화면: /panel-input
 */

const STORAGE_KEY = "jeju-ax-panel-input"
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

function load(): PanelInput {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as PanelInput) : {}
  } catch {
    return {}
  }
}

let state: PanelInput = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())

function persist() {
  try {
    if (Object.keys(state).length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 저장이 막힌 환경(시크릿 창 등) — 이 탭 안에서만 유지된다 */
  }
}

export const getPanelInput = () => state
export function subscribePanelInput(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
/** 다른 탭·창에서 바뀐 값도 따라간다 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      state = load()
      emit()
    }
  })
}
export function usePanelInput(): PanelInput {
  return useSyncExternalStore(subscribePanelInput, getPanelInput, getPanelInput)
}

/** 한 영역을 통째로 바꾼다. undefined면 지운다(그 영역은 다시 샘플). */
export function setPart<K extends PartKey>(key: K, value: PanelInput[K] | undefined) {
  const next = { ...state }
  if (value === undefined) delete next[key]
  else next[key] = value
  state = next
  persist()
  emit()
}
export function resetAll() {
  state = {}
  persist()
  emit()
}


// ---- 샘플 값으로 시작하기(입력 화면의 "직접 입력 시작") — 샘플을 편집 가능한 시작값으로 복사한다
const levelOf = (l: string): InputLevel => (l === "danger" ? "danger" : l === "alert" ? "alert" : l === "warning" ? "warning" : l === "caution" ? "caution" : "safe")
export const startFromSample: { [K in PartKey]: () => NonNullable<PanelInput[K]> } = {
  sensorSummary: () => ({ normal: SAMPLE_SENSOR_SUMMARY.normal, delayed: SAMPLE_SENSOR_SUMMARY.delayed, error: SAMPLE_SENSOR_SUMMARY.error, unlinked: SAMPLE_SENSOR_SUMMARY.unlinked }),
  serviceSensors: () => SERVICES.map((s) => ({ id: s.id, count: SAMPLE_SERVICE_SENSORS.find((x) => x.id === s.id)?.count ?? null, level: levelOf(SAMPLE_SERVICE_SENSORS.find((x) => x.id === s.id)?.level ?? "safe") })),
  sensorAlerts: () => SAMPLE_SENSOR_ALERTS.map((a) => ({ id: uid("al"), name: a.name, service: SERVICES.find((s) => s.title === a.service)?.id ?? "river", reason: a.reason as "값 이상" | "수집 이상", value: a.value, level: levelOf(a.level), badge: a.badge })),
  trends: () =>
    SAMPLE_TREND_CARDS.map((c) => ({
      id: uid("tr"),
      service: SERVICES.find((s) => s.short === c.service)?.id ?? "river",
      name: c.name,
      unit: c.unit,
      observed: c.observed.slice(-8),
      forecast: c.forecast,
      threshold: Number(c.thresholdLabel.replace(/[^\d.]/g, "")) || null,
      thresholdLabel: c.thresholdLabel.replace(/[\d.]+.*$/, "").trim() || "기준",
      worse: c.thresholdLabel.includes("↓") ? "below" : "above",
      level: levelOf(c.level),
    })),
  stages: () =>
    SERVICES.map((s) => {
      const x = SAMPLE_SERVICE_STAGES.find((v) => v.id === s.id)
      return { id: s.id, level: x ? levelOf(x.level) : null, count: x?.count ?? null, done: x?.done ?? 0, doing: x ? Math.max(0, x.total - x.done) : 0, waiting: 0 }
    }),
  actions: () => SAMPLE_ACTIONS.map((a) => ({ id: uid("ac"), service: SERVICES.find((s) => s.short === a.service)?.id ?? "river", text: a.text, state: a.state })),
  responseExtra: () => ({ agenciesConnected: SAMPLE_AGENCIES.connected, agenciesTotal: SAMPLE_AGENCIES.total, agencyIssue: SAMPLE_AGENCIES.issue, teams: SAMPLE_TEAMS.count, teamState: SAMPLE_TEAMS.state }),
}
export const newId = uid

