import { useSyncExternalStore } from "react"
import { audit } from "./auditLog"
import { esopKey, type EsopDefs, type EsopLevel, type EsopStep } from "./esopLogic"

// e-SOP 절차 정의 저장소 — 브라우저(localStorage)에만 저장한다. 고친 (서비스:단계)만 담는다
const KEY = "jeju-ax-esop-defs"
const listeners = new Set<() => void>()
let cache: EsopDefs | null = null

function load(): EsopDefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}")
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as EsopDefs) : {}
  } catch {
    return {}
  }
}
const get = () => (cache ??= load())
export const getEsopDefs = get
function commit(next: EsopDefs) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}
export function saveSteps(svc: string, level: EsopLevel, steps: EsopStep[]) {
  commit({ ...get(), [esopKey(svc, level)]: steps })
  audit("시스템 변경", "e-SOP 절차 정의 수정", esopKey(svc, level))
}
export function resetService(svc: string) {
  commit(Object.fromEntries(Object.entries(get()).filter(([k]) => !k.startsWith(`${svc}:`))))
  audit("시스템 변경", "e-SOP 절차 정의 처음 값으로", svc)
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
export const useEsopDefs = () => useSyncExternalStore(subscribe, get)
