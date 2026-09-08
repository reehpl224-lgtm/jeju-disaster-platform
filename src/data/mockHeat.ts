import type { HeatAlertDispatch, HeatClosure, HeatLevelInfo, HeatRouteTip, HeatShelter, HeatTrendPoint } from "../types/heat"

/**
 * 폭염 위기단계 — 기상청 폭염특보 공식 기준(참고용)을 사용. 주의보: 체감온도 33℃ 이상 2일 이상
 * 지속 예상. 경보: 체감온도 35℃ 이상 2일 이상 지속 예상. 실제 발령은 기상청 발표를 따른다.
 */
export const heatLevelInfo: HeatLevelInfo = {
  level: "warning",
  label: "폭염주의보",
  feelsLikeC: 34.2,
  criteria: "기상청 폭염특보 기준 — 체감온도 33℃ 이상 2일 이상 지속 시 주의보, 35℃ 이상 시 경보",
  updatedAt: "14:00",
}

/** 최근 5일 최고기온·체감온도 추이 — 폭염주의보 지속 여부 판단 근거 */
export const heatTrend: HeatTrendPoint[] = [
  { date: "09-04", maxTempC: 31.2, feelsLikeC: 32.8 },
  { date: "09-05", maxTempC: 32.0, feelsLikeC: 33.5 },
  { date: "09-06", maxTempC: 32.6, feelsLikeC: 34.0 },
  { date: "09-07", maxTempC: 33.1, feelsLikeC: 34.6 },
  { date: "09-08", maxTempC: 32.9, feelsLikeC: 34.2 },
]

export const heatAlertDispatch: HeatAlertDispatch = {
  stage: "폭염주의보 안내",
  title: "제주 전역 폭염주의보 안내",
  target: "제주 전역 주민",
  targetDetail: "무더위쉼터 이용 안내 포함",
  sentAt: "2026-09-08 14:00",
  approver: "이도현 주무관",
  message: "폭염주의보 — 야외활동 자제 및 무더위쉼터 이용 안내",
  channels: [
    { id: "hac-1", name: "문자(CBS/SMS)", sent: 598000, success: 596500, fail: 1500, rate: "99.7%", lastSent: "14:00:18" },
    { id: "hac-2", name: "모바일 앱 푸시", sent: 271000, success: 270600, fail: 400, rate: "99.9%", lastSent: "14:00:22" },
  ],
  totalFail: 1900,
}

export const heatClosure: HeatClosure = {
  caseId: "HT-2026-0825",
  title: "폭염주의보 해제 (8월말 사례)",
  status: "해제 완료",
  confirmedBy: "재난대응1팀 이도현 · 2026-08-26 09:00",
  type: "폭염 · 주의보",
  duration: "6일 3시간",
  durationDetail: "발효 2026-08-20 06:00 → 해제 2026-08-26 09:00",
  agencies: "무더위쉼터 운영 종료 · 도청 상황실 모니터링 종료",
  agencyDetail: "총 운영 시설 5개소",
  observed: [
    { id: "ht-ob1", label: "기간 중 최고 체감온도", value: "35.8℃ (2026-08-23)" },
    { id: "ht-ob2", label: "무더위쉼터 이용", value: "누적 1,240명" },
  ],
  closureConditions: [
    "체감온도 33℃ 미만 2일 이상 지속",
    "온열질환 신규 신고 없음 확인",
    "무더위쉼터 정상 운영 종료 확인",
  ],
  report: {
    department: "제주특별자치도 자연재난과",
    sop: "e-SOP HT-1 폭염 주의보 해제 절차 v1.0",
    casualties: "없음",
    property: "해당 없음",
    lesson: "표선면 마을회관 이용률 저조 — 안내 채널 확대 검토 필요",
  },
}

/** "무더위 쉼터를 몰라서 못 간다"는 현장 지적 반영 — 경로당·마을회관 등 실제 쉼터 유형으로 구성 */
export const heatShelters: HeatShelter[] = [
  { id: "hs-1", name: "이도1동 경로당", region: "제주시", address: "제주시 이도1동", type: "경로당", capacity: 30 },
  { id: "hs-2", name: "삼도2동 마을회관", region: "제주시", address: "제주시 삼도2동", type: "마을회관", capacity: 40 },
  { id: "hs-3", name: "한경면 복지회관", region: "제주시", address: "제주시 한경면", type: "복지관", capacity: 60 },
  { id: "hs-4", name: "대정읍 경로당", region: "서귀포시", address: "서귀포시 대정읍", type: "경로당", capacity: 25 },
  { id: "hs-5", name: "표선면 마을회관", region: "서귀포시", address: "서귀포시 표선면", type: "마을회관", capacity: 35 },
]

/** 열섬지도 기반 "시원한 길/더운 길" 안내 — MVP는 정밀 지도 대신 대표 구간 리스트로 표현 */
export const heatRouteTips: HeatRouteTip[] = [
  { id: "hr-1", kind: "cool", name: "삼성혈 녹지길", detail: "가로수 그늘 구간 70% 이상, 체감온도 -2~3℃" },
  { id: "hr-2", kind: "cool", name: "한천 산책로 그늘구간", detail: "하천변 그늘 지속, 벤치·물놀이터 인접" },
  { id: "hr-3", kind: "hot", name: "탑동 해변로 노출 구간", detail: "아스팔트 노출 구간 장시간 보행 주의" },
  { id: "hr-4", kind: "hot", name: "신제주 로터리 일대", detail: "그늘 부족, 오후 2~5시 체감온도 상승 구간" },
]
