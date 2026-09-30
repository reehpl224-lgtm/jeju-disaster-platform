import type { RiskLevel } from "./domain"
import type { FlowStep } from "./flow"

/** 시계열 엑셀 한 행 — "서비스+지점+관측시각"이 키(항목ID 중복 금지 로직을 쓰지 않는다) */
export interface RiverTimelinePoint {
  location: "돈내코" | "쇠소깍"
  observedAt: string
  flowRatioPercent: number
}

export type RiverResourceKind = "출동차" | "통제 인력" | "차단기"

export interface RiverResourceItem {
  id: string
  kind: RiverResourceKind
  label: string
  location: "돈내코" | "쇠소깍"
  /** 이 자원의 전체 보유 수량(고정값, 가상) */
  capacity: number
}

export type RiverResourceRequestStatus = "요청" | "출동 중" | "도착" | "철수 중" | "복귀 완료" | "취소"

export interface RiverResourceRequest {
  id: string
  resourceId: string
  qty: number
  status: RiverResourceRequestStatus
  requestedAtSim: string
  approvedAtSim?: string
  arrivedAtSim?: string
  returnedAtSim?: string
  /** 요청 식별자 중복 적용 방지용 — 같은 클라이언트 요청이 중복 커밋되지 않게 한다 */
  clientRequestId: string
}

export type RiverRunEndReason = "정상 종료" | "예외 강제 종료"

export interface RiverRunHistoryEntry {
  id: string
  simTime: string
  label: string
}

/**
 * 하천 시나리오 실행 상태 — 보드·상세창·새로고침·다른 창에서 전부 같은 값을 보게 하는 단일 소스.
 * localStorage(RIVER_RUN_STORAGE_KEY)에 저장하고, BroadcastChannel로 변경을 알린다(riverRunState.ts).
 */
export interface RiverRunState {
  runId: string
  /** 재시작 시 이전 이력을 지우지 않고 새 runId로 분리한다 */
  createdAtSim: string
  timeline: RiverTimelinePoint[]
  /** 현재 재생 위치(타임라인 인덱스, -1 = 아직 시작 안 함) */
  playheadIndex: number
  playing: boolean
  /** 지점별 현재 판정·그 판정이 시작된 시나리오 시각(하향 유지시간 계산용)·최신 입력값(Q%, 표시용) */
  pointState: Record<"돈내코" | "쇠소깍", { level: RiskLevel; sinceSim: string; flowRatioPercent: number } | undefined>
  /** 하향 대기 중인 후보 등급(한 단계씩, 유지시간 미충족) — 충족하면 pointState로 옮기고 비운다 */
  pendingDown: Record<"돈내코" | "쇠소깍", { level: RiskLevel; sinceSim: string } | undefined>
  flow: Partial<Record<FlowStep, string>>
  /** 경보·출동 승인 시점의 등급을 얼려둔다(승인 이후 등급이 바뀌어도 이미 보낸 경보 내용은 바뀌지 않아야 함) */
  alertSnapshot?: { level: RiskLevel; atSim: string }
  dispatchSnapshot?: { level: RiskLevel; atSim: string }
  resourceRequests: RiverResourceRequest[]
  history: RiverRunHistoryEntry[]
  endedAtSim?: string
  endReason?: RiverRunEndReason
  /** 정상 등급 복귀 후 종료 대기 중인지 — 조건(유지시간+조치완료+자원복귀) 충족 전까지는 사용자 종료 확인을 막는다 */
  closurePending: boolean
  version: number
}
