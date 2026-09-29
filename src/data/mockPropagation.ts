import type { PropagationChannel, PropagationStep, ReportingChainStep } from "../types/domain"

/**
 * 상황 전파 · 보고체계 — 현업요구사항_정리_자연재난과_20260907.md 6번 항목 근거.
 * "현재는 도청 → 시 상황실 → 읍면동 순차 전파로 단계별 지연 발생 → 동시 전파 가능한 시스템 희망"
 */
/** 순차 전파 단계별 도달 시각 — 가장 최근 사건 기준(2026-09-29 초기화로 비움) */
export const sequentialPropagation: PropagationStep[] = []

export const simultaneousPropagationGoal = {
  note: "도청에서 시·읍면동까지 동시 전파 — 단계별 지연 없이 즉시 도달",
  status: "2차년도 이후 협의 필요 (조직·프로세스 변경 수반)",
}

export const reportingChain: ReportingChainStep[] = [
  { id: "rc-1", label: "행정시 (제주시·서귀포시)", role: "1차 보고" },
  { id: "rc-2", label: "도청", role: "2차 취합" },
  { id: "rc-3", label: "행정안전부", role: "최종 보고" },
]

export const propagationChannels: PropagationChannel[] = [
  { id: "pc-1", name: "카카오톡 단톡방", detail: "재난 유형별 분리 운영(풍수방·겨울철방·정전방), 고위 공무원급 포함 — 현재 1순위 채널" },
  { id: "pc-2", name: "네이버웍스", detail: "전국 지자체 최초 도입, 자율가입이라 강제성 없음" },
]

/** 과거 전파 이력 — 순차 전파 체계에서 실제로 걸린 총 소요시간을 기록해 지연 문제를 근거로 보여준다(2026-09-29 초기화로 비움) */
export const propagationHistory: { id: string; title: string; date: string; totalDelay: string; steps: string }[] = []
