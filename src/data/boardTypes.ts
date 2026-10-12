import type { RiskLevel } from "../types/domain"

/**
 * 서비스 보드(/river · /heavy-rain 등) 좌·우 사이드패널의 시안 데이터 모양 — Figma "3단계 · {서비스} — 서비스 보드 (좌 3묶음 + 우 대응 패널)".
 * 좌측은 대시보드 · 관측·판단 · 이력·보고 3묶음, 우측은 상태 흐름(평시 → 감지 → 진행 → 종료)에 따라 바뀌는 대응 패널이다.
 * 값은 모두 샘플이고(스테이징에서만 보인다), 평시(calm)는 "값 없음" 기본 상태다.
 */
export type BoardStateId = "calm" | "detect" | "progress" | "closed"
export const BOARD_STATES: { id: BoardStateId; label: string }[] = [
  { id: "calm", label: "평시" },
  { id: "detect", label: "감지" },
  { id: "progress", label: "진행" },
  { id: "closed", label: "종료" },
]

export interface Badge {
  label: string
  level: RiskLevel
}
export const bd = (label: string, level: RiskLevel): Badge => ({ label, level })

// ---------------------------------------------------------------- 좌측 · 대시보드
export interface DashRow {
  name: string
  badge: Badge
  sub?: string
}
export interface DashTile {
  label: string
  value: string
  sub: string
  /** 강조 색(주황 테두리 등) */
  tone?: RiskLevel
  /** 실제로 받은 값(스테이징에서 샘플 위에 덮어쓴 값) — "실시간" 표시 */
  live?: boolean
}
export interface DashLeft {
  /** 범위·출처·기준 시각 칩 */
  chips: string[]
  /** 첫 카드 — 지점 상태 / 서비스 상태 */
  status: { title: string; badge?: Badge; heading?: string; lines?: string[]; rows?: DashRow[]; note?: string; live?: boolean }
  /** 연안 "진행 중 이벤트" 카드 */
  event?: { badge: Badge; title: string; detail?: string; item?: { name: string; badge: Badge; sub: string }; link?: string }
  /** e-SOP 6단계 — done: 완료 개수, active: 진행 중 단계 번호(0부터, 없으면 -1) */
  steps?: { done: number; active: number; note: string }
  tiles: DashTile[]
  brief: [string, string][]
  briefLink: string
  /** 레거시·외부 시스템 연계(미연계) 카드 */
  ext?: { title: string; badge: Badge; detail: string }
}

// ---------------------------------------------------------------- 좌측 · 이력·보고
export interface HistorySection {
  title: string
  rows: [string, string][]
}
export interface History {
  id: string
  title: string
  badge: Badge
  owner: string
  sections: HistorySection[]
  conditions: { ok: boolean; text: string }[]
  report: [string, string][]
}

// ---------------------------------------------------------------- 우측 · 대응 패널
export interface TodoAction {
  label: string
  kind: "ok" | "no"
}
export interface TodoItem {
  tag: string
  /** 조치 실패 — 맨 위에서 빨강으로 강조 */
  fail?: boolean
  title: string
  detail?: string
  actions?: TodoAction[]
  link?: { label: string; route: BoardRoute }
}
/** 보드가 이동할 상세 화면 — 서비스마다 실제 경로는 boardRoutes에서 푼다 */
export type BoardRoute = "alert" | "dispatch" | "control" | "analysis" | "closure" | "esop" | "data" | "home"
export interface DoItem {
  title: string
  detail?: string
  badge?: Badge
}
export interface ReadyItem {
  title: string
  sub: string
  badge: Badge
}
export interface LogItem {
  time: string
  tag: "감지" | "판단" | "조치" | "종료" | "메모"
  text: string
}
export interface RightPanel {
  /** 헤더 칩 — 평시 / 감지 후 5분 / 종료 · 총 3시간 20분 */
  head: Badge
  /** 발효 특보 트리거(자료 없는 서비스는 생략) */
  trigger?: { name: string; advice: string; live?: boolean }
  todo: { badge: Badge; items: TodoItem[] }
  doing: { badge: Badge; items: DoItem[]; empty?: string; stats?: { label: string; value: string; bad?: boolean }[] }
  /** 준비 상태 — 평시에만 */
  ready?: ReadyItem[]
  log: LogItem[]
}

export interface BoardService {
  id: string
  /** 상세 화면 경로 접두어 */
  base: string
  title: string
  /** 상태별 좌측 대시보드. closed는 평시로 돌아간 모습(calm)을 쓴다 */
  dash: { calm: DashLeft; detect: DashLeft; progress: DashLeft }
  history: History
  right: Record<BoardStateId, RightPanel>
}
