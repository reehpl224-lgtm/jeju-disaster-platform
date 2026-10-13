/**
 * 이용 이력 로그 — 요구사항 '이용 이력 로그'(접속·데이터 처리·시스템 변경 이력 기록).
 * 저장소와 무관한 순수 계산만 둔다: 같은 사람이 같은 일을 1분 안에 되풀이하면(예: e-SOP 문구를 글자마다 저장) 한 줄로 묶고 횟수만 올린다.
 */
export type AuditCategory = "접속" | "데이터 처리" | "시스템 변경"
export const AUDIT_CATEGORIES: AuditCategory[] = ["접속", "데이터 처리", "시스템 변경"]

export interface AuditEntry {
  id: string
  at: string
  by: string
  category: AuditCategory
  action: string
  target?: string
  /** 같은 일이 묶인 횟수(1이면 한 번) */
  count: number
}

export const AUDIT_CAP = 1000
const COALESCE_MS = 60_000

export function appendAudit(
  list: AuditEntry[],
  e: { by: string; category: AuditCategory; action: string; target?: string },
  now: Date,
  cap = AUDIT_CAP,
): AuditEntry[] {
  const last = list[list.length - 1]
  const same = last && last.by === e.by && last.category === e.category && last.action === e.action && last.target === e.target
  if (same && now.getTime() - new Date(last.at).getTime() < COALESCE_MS) {
    return [...list.slice(0, -1), { ...last, at: now.toISOString(), count: last.count + 1 }]
  }
  const entry: AuditEntry = { id: `A${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at: now.toISOString(), count: 1, ...e }
  const next = [...list, entry]
  return next.length > cap ? next.slice(next.length - cap) : next
}

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
export function auditCsv(list: AuditEntry[]): string {
  const rows = [["시각", "사용자", "구분", "내용", "대상", "횟수"], ...list.map((a) => [a.at, a.by, a.category, a.action, a.target ?? "", String(a.count)])]
  return rows.map((r) => r.map(cell).join(",")).join("\r\n")
}
