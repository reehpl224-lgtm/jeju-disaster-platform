/**
 * 대응 지시·조치 이력 기록 — 요구사항 '대응 지시·조치 결과 관리'·'조치 이력 기록·조회'·'이력의 사후분석 활용'.
 * 서비스마다 사건(공통 사건 ID)을 열고, 그 사건에 지시 등록→전달→수행→결과 등록과 조치·메모를 시각과 함께 쌓는다.
 * 저장은 브라우저(localStorage)뿐이라 서버 저장·대상자 전달은 아니다. 이 파일은 저장소와 무관한 순수 계산만 둔다.
 */
export type OrderStatus = "지시" | "전달" | "수행 중" | "완료" | "실패"
export type LogKind = "감지" | "판단" | "조치" | "지시" | "결과" | "전파" | "메모" | "종료"

export interface OrderEvent {
  at: string
  status: OrderStatus
  by: string
  note?: string
}
export type ApprovalStatus = "대기" | "승인" | "반려"
/** 승인 기반 실행 원칙 — 경보 발령·시설 제어·출동·대피 같은 실제 조치 지시는 권한자가 승인해야 전달·수행으로 넘어간다 */
export interface Approval {
  status: ApprovalStatus
  by?: string
  at?: string
  note?: string
}
export interface Order {
  id: string
  incidentId: string
  title: string
  assignee: string
  dept: string
  status: OrderStatus
  createdAt: string
  events: OrderEvent[]
  result?: string
  /** 승인이 필요한 조치만 가진다 */
  approval?: Approval
}
export interface LogEntry {
  id: string
  incidentId: string
  at: string
  kind: LogKind
  text: string
  by: string
  /** 지금 해야 할 일 항목과 이어 줄 때 쓰는 제목(처리됨 표시용) */
  ref?: string
}
export interface Incident {
  id: string
  serviceId: string
  openedAt: string
  closedAt?: string
}
export interface ResponseStore {
  incidents: Incident[]
  orders: Order[]
  logs: LogEntry[]
}
export const emptyStore = (): ResponseStore => ({ incidents: [], orders: [], logs: [] })

/** 지시 처리 흐름 — 다음 상태 후보. 실패는 다시 수행 중으로 돌려 재시도할 수 있다 */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  지시: ["전달"],
  전달: ["수행 중"],
  "수행 중": ["완료", "실패"],
  완료: [],
  실패: ["수행 중"],
}

/** 실제 재난 조치로 보이는 지시(경보·발령·대피·출동·통제·차단·제어·발송·명령)는 승인이 필요하다고 본다 — 지시를 만들 때 사람이 바꿀 수 있다 */
export const requiresApproval = (title: string) => /경보|발령|대피|출동|통제|차단|제어|발송|명령/.test(title)

const SVC_CODE: Record<string, string> = {
  "heavy-rain": "RAIN",
  typhoon: "TYP",
  heat: "HEAT",
  wildfire: "FIRE",
  tsunami: "TSU",
  snow: "SNOW",
  river: "RIV",
  aqua: "AQUA",
  coast: "COAST",
}
const pad = (n: number) => String(n).padStart(2, "0")
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const uid = (prefix: string, s: ResponseStore) => `${prefix}${s.logs.length + s.orders.length + s.incidents.length + 1}-${Math.random().toString(36).slice(2, 6)}`

export const openIncidentOf = (s: ResponseStore, serviceId: string) => s.incidents.find((i) => i.serviceId === serviceId && !i.closedAt)

/** 열린 사건이 없으면 새 사건(공통 사건 ID: INC-날짜-서비스-일련번호)을 연다 */
export function ensureIncident(s: ResponseStore, serviceId: string, now: Date): { store: ResponseStore; incident: Incident } {
  const open = openIncidentOf(s, serviceId)
  if (open) return { store: s, incident: open }
  const day = ymd(now)
  const n = s.incidents.filter((i) => i.serviceId === serviceId && i.id.includes(`-${day}-`)).length + 1
  const incident: Incident = { id: `INC-${day}-${SVC_CODE[serviceId] ?? "ETC"}-${pad(n)}`, serviceId, openedAt: now.toISOString() }
  return { store: { ...s, incidents: [...s.incidents, incident] }, incident }
}

export function addLog(s: ResponseStore, serviceId: string, e: { kind: LogKind; text: string; by: string; ref?: string }, now: Date): ResponseStore {
  const { store, incident } = ensureIncident(s, serviceId, now)
  const entry: LogEntry = { id: uid("L", store), incidentId: incident.id, at: now.toISOString(), ...e }
  return { ...store, logs: [...store.logs, entry] }
}

export function issueOrder(s: ResponseStore, serviceId: string, o: { title: string; assignee: string; dept: string; needsApproval?: boolean }, by: string, now: Date): ResponseStore {
  const { store, incident } = ensureIncident(s, serviceId, now)
  const order: Order = {
    id: uid("O", store),
    incidentId: incident.id,
    title: o.title.trim(),
    assignee: o.assignee.trim(),
    dept: o.dept.trim(),
    status: "지시",
    createdAt: now.toISOString(),
    events: [{ at: now.toISOString(), status: "지시", by }],
    ...((o.needsApproval ?? requiresApproval(o.title)) ? { approval: { status: "대기" as const } } : {}),
  }
  const waiting = order.approval ? " (승인 대기)" : ""
  return addLog({ ...store, orders: [...store.orders, order] }, serviceId, { kind: "지시", text: `${order.assignee || "담당자 미정"} · ${order.title}${waiting}`, by }, now)
}

/** 지시 상태를 한 단계 옮긴다 — 허용되지 않은 이동이면 그대로 돌려준다. 완료·실패는 결과 문구를 함께 남긴다 */
export function advanceOrder(s: ResponseStore, orderId: string, to: OrderStatus, by: string, now: Date, note?: string): ResponseStore {
  const order = s.orders.find((o) => o.id === orderId)
  if (!order || !NEXT_STATUS[order.status].includes(to)) return s
  // 승인이 필요한 조치는 승인 전에 전달할 수 없고, 반려된 조치는 더 진행하지 않는다
  if (order.approval && order.approval.status !== "승인") return s
  const text = note?.trim()
  const finished = to === "완료" || to === "실패"
  const next: Order = {
    ...order,
    status: to,
    events: [...order.events, { at: now.toISOString(), status: to, by, note: text }],
    result: finished ? text : order.result,
  }
  const base = { ...s, orders: s.orders.map((o) => (o.id === orderId ? next : o)) }
  const label = to === "수행 중" ? "수행 시작" : to
  const entry: LogEntry = {
    id: uid("L", base),
    incidentId: order.incidentId,
    at: now.toISOString(),
    kind: finished ? "결과" : "지시",
    text: `${label} — ${order.title}${text ? ` (${text})` : ""}`,
    by,
  }
  return { ...base, logs: [...base.logs, entry] }
}

/** 승인·반려 — 승인 대기인 지시에만 한 번 적용된다. 결정은 사건 이력에도 남는다 */
export function decideOrder(s: ResponseStore, orderId: string, decision: "승인" | "반려", by: string, now: Date, note?: string): ResponseStore {
  const order = s.orders.find((o) => o.id === orderId)
  if (!order || order.approval?.status !== "대기") return s
  const text = note?.trim() || undefined
  const approval: Approval = { status: decision, by, at: now.toISOString(), note: text }
  const base = { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, approval } : o)) }
  const entry: LogEntry = { id: uid("L", base), incidentId: order.incidentId, at: now.toISOString(), kind: "지시", text: `${decision} — ${order.title}${text ? ` (${text})` : ""}`, by }
  return { ...base, logs: [...base.logs, entry] }
}

export function closeIncident(s: ResponseStore, serviceId: string, by: string, now: Date): ResponseStore {
  const open = openIncidentOf(s, serviceId)
  if (!open) return s
  const logged = addLog(s, serviceId, { kind: "종료", text: "상황 종료", by }, now)
  return { ...logged, incidents: logged.incidents.map((i) => (i.id === open.id ? { ...i, closedAt: now.toISOString() } : i)) }
}

export const logsOf = (s: ResponseStore, incidentId: string) => s.logs.filter((l) => l.incidentId === incidentId).sort((a, b) => a.at.localeCompare(b.at))
export const ordersOf = (s: ResponseStore, incidentId: string) => s.orders.filter((o) => o.incidentId === incidentId)

/** 사후분석용 요약 — 사건 수, 평균 대응 시간(분, 종료된 사건), 지시 완료율 */
export function summarize(s: ResponseStore) {
  const closed = s.incidents.filter((i) => i.closedAt)
  const minutes = closed.map((i) => (new Date(i.closedAt as string).getTime() - new Date(i.openedAt).getTime()) / 60000)
  const done = s.orders.filter((o) => o.status === "완료").length
  const byService: Record<string, number> = {}
  for (const i of s.incidents) byService[i.serviceId] = (byService[i.serviceId] ?? 0) + 1
  return {
    incidents: s.incidents.length,
    open: s.incidents.length - closed.length,
    avgMinutes: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : null,
    orders: s.orders.length,
    doneRate: s.orders.length ? Math.round((done / s.orders.length) * 100) : null,
    failed: s.orders.filter((o) => o.status === "실패").length,
    byService,
  }
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`
/** 사건 이력 CSV — 엑셀에서 열 수 있게 BOM은 내려받는 쪽에서 붙인다 */
export function incidentCsv(s: ResponseStore, incidentId: string): string {
  const rows = [["시각", "구분", "내용", "기록자"], ...logsOf(s, incidentId).map((l) => [l.at, l.kind, l.text, l.by])]
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n")
}
