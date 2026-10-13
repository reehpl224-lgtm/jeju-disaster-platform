import { useSyncExternalStore } from "react"
import { appendAudit, type AuditCategory, type AuditEntry } from "./auditLogic"

// 이용 이력 저장소 — 브라우저(localStorage)에만 저장한다(서버 기록이 아니다). 다른 저장소가 가져다 쓰므로 이 파일은 다른 데이터 모듈을 import하지 않는다
const KEY = "jeju-ax-audit-log"
const SESSION_KEY = "jeju-ax-session" // mockAuth.ts의 로그인 세션과 같은 키(순환 import를 피하려고 직접 읽는다)
const listeners = new Set<() => void>()
let cache: AuditEntry[] | null = null

function load(): AuditEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(raw) ? (raw as AuditEntry[]) : []
  } catch {
    return []
  }
}
const get = () => (cache ??= load())
function commit(next: AuditEntry[]) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

function currentActor(): string {
  try {
    const u = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as { name?: string; orgId?: string } | null
    return u?.name ? `${u.name}(${u.orgId ?? "-"})` : "미로그인"
  } catch {
    return "미로그인"
  }
}

/** 이력 한 줄을 남긴다 — by를 주지 않으면 지금 로그인한 사람. 기록 실패가 화면 동작을 막지 않게 오류는 삼킨다 */
export function audit(category: AuditCategory, action: string, target?: string, by?: string) {
  try {
    commit(appendAudit(get(), { by: by ?? currentActor(), category, action, target }, new Date()))
  } catch {
    /* 이력 기록은 부가 기능 */
  }
}
export const clearAudit = () => commit([])

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
export const useAuditLog = () => useSyncExternalStore(subscribe, get)
