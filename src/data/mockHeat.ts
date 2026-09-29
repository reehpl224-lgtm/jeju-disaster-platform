import type { HeatAlertDispatch, HeatClosure, HeatLevelInfo, HeatRouteTip, HeatShelter, HeatTrendPoint } from "../types/heat"

/**
 * 폭염 위기단계 — 기상청 폭염특보 공식 기준(참고용)을 사용. 주의보: 체감온도 33℃ 이상 2일 이상
 * 지속 예상. 경보: 체감온도 35℃ 이상 2일 이상 지속 예상. 실제 발령은 기상청 발표를 따른다.
 *
 * 2026-09-29 초기화 — 관측값·추이·발송·쉼터·종료 보고 시나리오 더미를 비웠다(사용자 요청). feelsLikeC가 null이면 관측값 없음.
 */
export const heatLevelInfo: HeatLevelInfo = {
  level: "safe",
  label: "특보 없음",
  feelsLikeC: null,
criteria: "기상청 폭염특보 기준 — 체감온도 33℃ 이상 2일 이상 지속 시 주의보, 35℃ 이상 시 경보",
  updatedAt: "-",
}

/** 최근 5일 최고기온·체감온도 추이 — 폭염주의보 지속 여부 판단 근거(비어 있으면 관측 없음) */
export const heatTrend: HeatTrendPoint[] = []

export const heatAlertDispatch: HeatAlertDispatch = {
  stage: "발령 없음",
  level: "safe",
  title: "현재 발령된 안내 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  approver: "-",
  message: "현재 발령된 안내가 없습니다.",
  channels: [
    { id: "hac-1", name: "문자(CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "hac-2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
  ],
  totalFail: 0,
}

/** 해제 보고 — 종료된 사건 없음(양식만 남김). closureConditions는 시나리오가 채운다 */
export const heatClosure: HeatClosure = {
  caseId: "-",
  title: "해제된 특보 없음",
  status: "-",
  confirmedBy: "-",
  type: "-",
  duration: "-",
  durationDetail: "-",
  agencies: "-",
  agencyDetail: "-",
  observed: [],
  closureConditions: [],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
}

/** 무더위쉼터(경로당·마을회관 등) — 시설 목록 더미를 비웠다 */
export const heatShelters: HeatShelter[] = []

/** 열섬 기반 "시원한 길/더운 길" 안내 */
export const heatRouteTips: HeatRouteTip[] = []
