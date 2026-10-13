import { useSyncExternalStore } from "react"
import { audit } from "./auditLog"
import { getCurrentUser } from "./mockAuth"
import { roleLabel } from "./rolesLogic"
import {
  addLog, advanceOrder, closeIncident, emptyStore, issueOrder,
  type LogKind, type OrderStatus, type ResponseStore,
} from "./responseLogic"

// 대응 지시·조치 이력 저장소 — 브라우저(localStorage)에만 저장한다. 새로고침해도 남고 다른 PC와는 공유되지 않는다
const KEY = "jeju-ax-response-log"
const listeners = new Set<() => void>()
let cache: ResponseStore | null = null

function load(): ResponseStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ResponseStore> | null
    return {
      incidents: Array.isArray(raw?.incidents) ? raw.incidents : [],
      orders: Array.isArray(raw?.orders) ? raw.orders : [],
      logs: Array.isArray(raw?.logs) ? raw.logs : [],
    }
  } catch {
    return emptyStore()
  }
}
const get = () => (cache ??= load())
function commit(next: ResponseStore) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

/** 기록자 표시 — 로그인한 사람과 역할 */
export function actor(): string {
  const u = getCurrentUser()
  return u ? `${u.name}(${roleLabel(u.role)})` : "알 수 없음"
}

export function recordLog(svc: string, kind: LogKind, text: string, ref?: string) {
  commit(addLog(get(), svc, { kind, text, by: actor(), ref }, new Date()))
  audit("데이터 처리", `조치 기록(${kind})`, svc)
}
export function recordOrder(svc: string, o: { title: string; assignee: string; dept: string }) {
  commit(issueOrder(get(), svc, o, actor(), new Date()))
  audit("데이터 처리", "대응 지시 등록", svc)
}
export function moveOrder(orderId: string, to: OrderStatus, note?: string) {
  commit(advanceOrder(get(), orderId, to, actor(), new Date(), note))
  audit("데이터 처리", `대응 지시 ${to}`, orderId)
}
export function endIncident(svc: string) {
  commit(closeIncident(get(), svc, actor(), new Date()))
  audit("데이터 처리", "사건 종료 기록", svc)
}
export function clearResponseLog() {
  commit(emptyStore())
  audit("시스템 변경", "대응 기록 비우기")
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
export const useResponseLog = () => useSyncExternalStore(subscribe, get)
