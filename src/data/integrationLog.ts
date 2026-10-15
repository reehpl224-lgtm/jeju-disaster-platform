import { persistence } from "./persistence"
import { useSyncExternalStore } from "react"
import { audit } from "./auditLog"
import { advanceIssue, recheckIssue, registerIssue, type Issue, type IssueStatus, type IssueType } from "./integrationLogic"
import { actor } from "./responseLog"

// 연계 오류 처리 이력 저장소 — 브라우저(localStorage)에만 저장한다
const KEY = "jeju-ax-integration-issues"
const listeners = new Set<() => void>()
let cache: Issue[] | null = null

function load(): Issue[] {
  try {
    const raw = JSON.parse(persistence.getItem(KEY) ?? "[]")
    return Array.isArray(raw) ? (raw as Issue[]) : []
  } catch {
    return []
  }
}
const get = () => (cache ??= load())
function commit(next: Issue[]) {
  cache = next
  try {
    persistence.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 공간이 막힌 브라우저 — 이번 접속 동안만 유지 */
  }
  listeners.forEach((fn) => fn())
}

export function reportIssue(e: { checkId?: string; system: string; type: IssueType; detail: string }) {
  commit(registerIssue(get(), e, actor(), new Date()))
  audit("데이터 처리", "연계 오류 접수", `${e.system} · ${e.type}`)
}
export function moveIssue(id: string, to: IssueStatus, note?: string) {
  commit(advanceIssue(get(), id, to, actor(), new Date(), note))
  audit("데이터 처리", `연계 오류 ${to}`, id)
}
export function checkIssue(id: string, result: { ok: boolean; text: string }) {
  commit(recheckIssue(get(), id, result, new Date()))
  audit("데이터 처리", `연계 오류 재검증(${result.ok ? "정상" : "이상"})`, id)
}
export function clearIssues() {
  commit([])
  audit("시스템 변경", "연계 오류 이력 비우기")
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
export const useIssues = () => useSyncExternalStore(subscribe, get)
