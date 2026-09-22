import type { PropagationChannel, PropagationStep, ReportingChainStep } from "../types/domain"

/**
 * 상황 전파 · 보고체계 — 현업요구사항_정리_자연재난과_20260907.md 6번 항목 근거.
 * "현재는 도청 → 시 상황실 → 읍면동 순차 전파로 단계별 지연 발생 → 동시 전파 가능한 시스템 희망"
 */
export const sequentialPropagation: PropagationStep[] = [
  { id: "sp-1", stage: "도청", time: "14:10" },
  { id: "sp-2", stage: "시 상황실", time: "14:16" },
  { id: "sp-3", stage: "읍면동", time: "14:27" },
]

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

/** 과거 전파 이력 — 순차 전파 체계에서 실제로 걸린 총 소요시간을 기록해 지연 문제를 근거로 보여준다 */
export const propagationHistory = [
  { id: "ph-1", title: "효돈천(쇠소깍) 심각 3단계", date: "2026-09-08", totalDelay: "17분", steps: "14:10 → 14:16 → 14:27" },
  { id: "ph-2", title: "한천 하천 수위 상승", date: "2026-09-07", totalDelay: "22분", steps: "15:22 → 15:31 → 15:44" },
  { id: "ph-3", title: "서귀포 해안 강풍 예비특보", date: "2026-09-07", totalDelay: "9분", steps: "14:10 → 14:15 → 14:19" },
]
