import { useSyncExternalStore } from "react"
import { audit } from "./auditLog"
import { mergePolicy, type RolePolicy } from "./rolesLogic"

// 역할·권한 정의 저장소 — 브라우저(localStorage)에만 저장한다. 새 창에서도 같은 정의를 쓰고, 다른 탭에서 고치면 storage 이벤트로 따라간다
const KEY = "jeju-ax-role-policy"
const listeners = new Set<() => void>()
let cache: RolePolicy | null = null

function load(): RolePolicy {
  try {
    const raw = localStorage.getItem(KEY)
    return mergePolicy(raw ? JSON.parse(raw) : null)
  } catch {
    return mergePolicy(null)
  }
}
export function getPolicy(): RolePolicy {
  return (cache ??= load())
}
export function savePolicy(next: RolePolicy) {
  cache = mergePolicy(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
  audit("시스템 변경", "역할·권한 변경")
}
export function resetPolicy() {
  cache = mergePolicy(null)
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 위와 같음 */
  }
  listeners.forEach((fn) => fn())
  audit("시스템 변경", "역할·권한 처음 값으로 복원")
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
export const useRolePolicy = () => useSyncExternalStore(subscribe, getPolicy)
