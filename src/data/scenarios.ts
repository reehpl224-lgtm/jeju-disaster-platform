import { persistence } from "./persistence"
import { useSyncExternalStore } from "react"
import { audit } from "./auditLog"
import { getEsopDefs } from "./esopDefs"
import { presetScenarios, runScenario, type Scenario, type ScenarioRun } from "./scenarioLogic"

// 시나리오·시험 기록·개선사항 저장소 — 브라우저(localStorage)에만 저장한다. 실제 사건 기록(responseLog)과 섞이지 않게 따로 둔다
const KEY = "jeju-ax-scenarios"
const RUN_CAP = 30

export interface Improvement {
  id: string
  at: string
  text: string
  /** 어느 시나리오 시험에서 나온 의견인지(선택) */
  scenarioId?: string
  done: boolean
}
interface State {
  scenarios: Scenario[]
  runs: ScenarioRun[]
  notes: Improvement[]
}

const listeners = new Set<() => void>()
let cache: State | null = null

function load(): State {
  try {
    const raw = JSON.parse(persistence.getItem(KEY) ?? "null") as Partial<State> | null
    return {
      // 4단계 개편(2026-10-15) 전에 저장된 시나리오는 기대 단계에 '관심'(caution)이 있어 새 판정과 어긋나므로 처음 제공한 시나리오로 되돌린다(시험 기록·개선사항은 유지)
      scenarios: Array.isArray(raw?.scenarios) && raw.scenarios.length > 0 && !raw.scenarios.some((sc) => sc.phases?.some((p) => (p.expect as string) === "caution")) ? raw.scenarios : presetScenarios(),
      runs: Array.isArray(raw?.runs) ? raw.runs : [],
      notes: Array.isArray(raw?.notes) ? raw.notes : [],
    }
  } catch {
    return { scenarios: presetScenarios(), runs: [], notes: [] }
  }
}
const get = () => (cache ??= load())
function commit(next: State) {
  cache = next
  try {
    persistence.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

/** 시나리오 저장(새로 만들거나 고침) — 글자 하나마다 불리므로 이력은 audit이 알아서 묶는다 */
export function saveScenario(s: Scenario) {
  const st = get()
  const exists = st.scenarios.some((x) => x.id === s.id)
  commit({ ...st, scenarios: exists ? st.scenarios.map((x) => (x.id === s.id ? s : x)) : [...st.scenarios, s] })
  audit("시스템 변경", exists ? "시나리오 수정" : "시나리오 추가", s.name)
}
export function deleteScenario(id: string) {
  const st = get()
  commit({ ...st, scenarios: st.scenarios.filter((x) => x.id !== id) })
  audit("시스템 변경", "시나리오 삭제", id)
}
export function resetScenarios() {
  commit({ ...get(), scenarios: presetScenarios() })
  audit("시스템 변경", "시나리오 처음 값으로")
}

/** 시나리오 실행(시뮬레이션) — 지금 e-SOP 정의를 읽어 단계별 경보·전파·지시를 만들고 시험 기록으로 남긴다 */
export function runNow(scenario: Scenario): ScenarioRun {
  const run = runScenario(scenario, getEsopDefs(), new Date())
  const st = get()
  commit({ ...st, runs: [run, ...st.runs].slice(0, RUN_CAP) })
  audit("데이터 처리", "시나리오 시험 실행", scenario.name)
  return run
}
export function clearRuns() {
  commit({ ...get(), runs: [] })
  audit("시스템 변경", "시나리오 시험 기록 비우기")
}

export function addNote(text: string, scenarioId?: string) {
  const t = text.trim()
  if (!t) return
  const st = get()
  commit({ ...st, notes: [{ id: `N${Date.now().toString(36)}`, at: new Date().toISOString(), text: t, scenarioId, done: false }, ...st.notes] })
  audit("데이터 처리", "시나리오 개선사항 등록")
}
export function toggleNote(id: string) {
  const st = get()
  commit({ ...st, notes: st.notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)) })
}
export function removeNote(id: string) {
  const st = get()
  commit({ ...st, notes: st.notes.filter((n) => n.id !== id) })
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      fn()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}
export const useScenarios = () => useSyncExternalStore(subscribe, get)
