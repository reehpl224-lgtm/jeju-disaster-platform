import type {
  BroadcastLogEntry,
  HeavyRainAlertDispatch,
  HeavyRainClosure,
  HeavyRainTrendPoint,
  LegacySystemStatus,
  RainfallRankEntry,
  WeatherStationReading,
} from "../types/heavyRain"

/**
 * 출처: 레거시시스템 현황 조사 면담 결과서_20260907 [참고] 재난 관련 레거시시스템 목록 +
 * "1차년도(2026년) 사용 가능 레거시 데이터 현황 및 연계 분석" 문서(2026-09-28 사용자 제공, 제주TP
 * 작성)로 세분화. 도청이 개별 시스템을 직접 관리하지 않고 유지보수 업체(섬엔지니어링)와 별도 협의가
 * 필요하다고 밝힌 내용을 그대로 반영 — "연계 완료"로 과장하지 않는다.
 *
 * 2026-09-28 갱신: 기존 "ls-1 재난 예·경보시스템(자동침수경보·하천모니터링·자동우량정보 등)"과
 * "ls-4 조기경보시스템"을 위 신규 문서 기준 DB형 데이터 시스템 5종 + 신규 확인된 미연계 시스템
 * 2종(하천 유속 측정계, 서귀포시 자동 우량 경보)으로 세분화했다. 미연계 2종은 mockPilotStatus.ts의
 * r12·rl2/r6와 동일 시스템 — 그쪽엔 이미 "도청 미연계, 1차년도(서귀포 우량경보)/2차년도 이후(하천
 * 유속측정계) 협의 대상"으로 반영돼 있던 것을 이 화면에도 맞춰 반영한 것으로, 새로운 판단은 아니다.
 * 나머지(ls-2·3·5·6·7)는 이번 문서 범위 밖이라 기존 값 그대로 유지. 태풍 관련 레거시 연계는 이
 * 목록에 없음 — 태풍은 자체 시스템이 아니라 기상청 자료를 전량 수신하는 구조라 `typhoon.ts` 참고.
 */
export const legacySystems: LegacySystemStatus[] = [
  {
    id: "ls-ews",
    name: "조기경보 통합 상황관리 연계시스템",
    operator: "제주특별자치도 · 섬엔지니어링(유지보수)",
    linkStatus: "협의 중",
    note: "경보 이력·조기경보 수치 DB 누적형(개통 시점부터 축적, 과거 이력 분석·임계치 설정에 활용 가능) — 1차년도 연계 희망 시스템",
  },
  {
    id: "ls-flood-mgmt",
    name: "풍수해 상황 관리시스템",
    operator: "제주특별자치도",
    linkStatus: "협의 중",
    note: "풍수해 관련 종합 현황 데이터 — 기존 모니터링 대시보드 용도. 컨트롤타워 연계 상태는 자연재난과 재확인 필요(2026-09-28 문서로 신규 확인)",
  },
  {
    id: "ls-rain-alert",
    name: "강우량 연동 자동 경보 발령 시스템",
    operator: "제주특별자치도 · 섬엔지니어링(유지보수)",
    linkStatus: "연계 진행중",
    note: "강우량 데이터·경보 발령 이력 DB — 1차년도 우선 통합 대상(구 '재난 예·경보시스템'의 자동우량정보 부분)",
  },
  {
    id: "ls-flood-warn",
    name: "자동 침수 경보 시스템",
    operator: "제주시 안전총괄과 · 섬엔지니어링(유지보수)",
    linkStatus: "연계 진행중",
    note: "수위 측정·침수 경보 이력 DB — 하천/도심 침수 조기경보(weatherStations ws-1 한천 침수센서의 근거 시스템, 구 '재난 예·경보시스템'의 자동침수경보 부분)",
  },
  {
    id: "ls-river-mon",
    name: "하천 모니터링시스템",
    operator: "제주시 안전총괄과 · 섬엔지니어링(유지보수)",
    linkStatus: "연계 진행중",
    note: "하천 수위 데이터 DB — 하천 범람 예측·모니터링에 활용(구 '재난 예·경보시스템'의 하천모니터링 부분)",
  },
  {
    id: "ls-river-flow",
    name: "하천 유속 측정계",
    operator: "제주시 안전총괄과 · 섬엔지니어링(유지보수)",
    linkStatus: "미연계",
    note: "유속 수치 데이터 — 하천 범람 위험도 계산에 필요하지만 도청 미연계, 제조사별 신규 협의 필요(현업 면담 결과와 동일 확인)",
  },
  {
    id: "ls-sgp-rain",
    name: "서귀포시 자동 우량 경보",
    operator: "서귀포시 안전총괄과 · 섬엔지니어링(유지보수)",
    linkStatus: "미연계",
    note: "약 20년 운영된 노후 우량망, 서귀포지역 강우량 실측 — 현재 도청 미연계. 1차년도 FEP 어댑터 연계가 목표(소다시스템 실증사 발표자료 근거)",
  },
  {
    id: "ls-2",
    name: "제주도 재난관리시스템",
    operator: "도/제주시/서귀포시",
    linkStatus: "협의 중",
    note: "유지보수 업체와 데이터 연계 방식 협의 필요",
  },
  {
    id: "ls-3",
    name: "제주도재난안전대책본부",
    operator: "도/제주시/서귀포시",
    linkStatus: "협의 중",
    note: "주의보 이상 발령 시 본부 가동 — 연계 방식 협의 예정",
  },
  {
    id: "ls-5",
    name: "민방위경보시스템",
    operator: "도",
    linkStatus: "미연계",
    note: "중앙 시스템과만 연계, 도 자체 연계 없음",
  },
  {
    id: "ls-6",
    name: "소방안전본부 시스템",
    operator: "소방안전본부",
    linkStatus: "미연계",
    note: "소관 부서가 달라 자연재난과 보유 정보 아님",
  },
  {
    id: "ls-7",
    name: "자치경찰단 교통정보센터",
    operator: "자치경찰단",
    linkStatus: "미연계",
    note: "ITS센터 CCTV는 예산·라이선스 문제로 일부만 연계 검토",
  },
]

export const weatherStations: WeatherStationReading[] = [
  { id: "ws-1", name: "제주시 한천 침수센서", type: "침수센서", value: "경보 발령", status: "alert", updatedAt: "14:30" },
  { id: "ws-2", name: "서귀포 효돈천 침수센서", type: "침수센서", value: "주의 단계", status: "warning", updatedAt: "14:32" },
  { id: "ws-3", name: "제주시 우량계 #3", type: "우량계", value: "62mm/h", status: "warning", updatedAt: "14:29" },
  { id: "ws-4", name: "서귀포 우량계 #2", type: "우량계", value: "48mm/h", status: "caution", updatedAt: "14:31" },
  { id: "ws-5", name: "한라산 적설계", type: "적설계", value: "0cm", status: "safe", updatedAt: "14:00" },
  { id: "ws-6", name: "성산 풍속풍향계", type: "풍속풍향계", value: "12.5m/s · 남동풍", status: "caution", updatedAt: "14:28" },
]

/**
 * AI 침수 위험 조기경보 — /river/analysis의 riverSuddenRainAlert와 동일한 원리를 호우
 * 관측망 전체로 일반화했다. 호우 통합 자체는 레거시 연계(규칙 기반)이지만, 우량계 실측 추이를
 * 기상청 예보와 비교해 자동침수경보 임계치 도달을 조기에 캐치하는 부분은 AI 예측이 유효하다.
 * 최종 발령 판단은 항상 담당자 몫 — river 쪽과 동일한 원칙을 유지한다.
 */
export const heavyRainAiForecast = {
  forecastMm: 40,
  detectedAt: "14:29",
  stations: [
    { id: "f-1", name: "제주시 우량계 #3", observedMm: 62 },
    { id: "f-2", name: "서귀포 우량계 #2", observedMm: 48 },
  ],
  aiNote: "제주시·서귀포 우량계 모두 예보(40mm/h) 대비 실측 강우가 지속 초과하고 있습니다. 현재 추이가 유지되면 자동침수경보 임계치 도달까지 약 12분 예상됩니다.",
  confirmNote: "자동침수경보 발령 여부는 반드시 담당자 확인이 필요합니다 (오경보 리스크 고려).",
}

/** 상세 분석용 강우 추이 — 제주시 한천 침수경보(ws-1) 사건 기준, 14:30 관측 시점까지 실측 */
export const heavyRainTrend: HeavyRainTrendPoint[] = [
  { time: "13:30", rainfallMm: 28, cumulativeMm: 28 },
  { time: "13:45", rainfallMm: 34, cumulativeMm: 62 },
  { time: "14:00", rainfallMm: 41, cumulativeMm: 103 },
  { time: "14:15", rainfallMm: 55, cumulativeMm: 158 },
  { time: "14:30", rainfallMm: 62, cumulativeMm: 220 },
]

/** 당일 누적 강수량 순위 — 실제 벤더 데모의 "TOP50" 랭킹을 MVP는 TOP5로 축약 */
export const heavyRainTopStations: RainfallRankEntry[] = [
  { rank: 1, stationName: "제주시 한천", region: "제주시", cumulativeMm: 220 },
  { rank: 2, stationName: "제주시 우량계 #3", region: "제주시", cumulativeMm: 186 },
  { rank: 3, stationName: "서귀포 우량계 #2", region: "서귀포시", cumulativeMm: 142 },
  { rank: 4, stationName: "애월읍 관측소", region: "제주시", cumulativeMm: 98 },
  { rank: 5, stationName: "성산읍 관측소", region: "서귀포시", cumulativeMm: 76 },
]

/** 경보 발송 — 한천 침수경보(ws-1, 14:30 발령) 기준 */
export const heavyRainAlertDispatch: HeavyRainAlertDispatch = {
  stage: "침수경보 발령",
  title: "제주시 한천 침수경보",
  target: "한천 인근 주민 320명",
  targetDetail: "저지대 상가·주택 포함 추가 140명",
  sentAt: "14:30:12",
  approver: "이도현 주무관",
  message: "침수경보 — 제주시 한천 하류 저지대 접근 자제",
  channels: [
    { id: "hc-1", name: "문자(CBS/SMS)", sent: 3420, success: 3391, fail: 29, rate: "99.2%", lastSent: "14:30:14" },
    { id: "hc-2", name: "모바일 앱 푸시", sent: 1980, success: 1975, fail: 5, rate: "99.7%", lastSent: "14:30:16" },
    { id: "hc-3", name: "재해문자전광판", sent: 6, success: 6, fail: 0, rate: "100%", lastSent: "14:30:20", unit: "개소" },
  ],
  totalFail: 34,
}

/** 종료 보고 — 참고용 과거 사례 (서귀포 효돈천 인근 우량계 경보, 2026-09-07 종료) */
export const heavyRainClosure: HeavyRainClosure = {
  caseId: "HR-2026-0907",
  title: "서귀포 우량계 #2 집중호우 경보",
  status: "종료 완료",
  confirmedBy: "재난대응1팀 이도현 · 2026-09-07 18:40",
  type: "집중호우 · 침수 주의",
  location: "서귀포시 효돈천 인근",
  duration: "1시간 52분",
  durationDetail: "최초 감지 16:48 → 종료 승인 18:40",
  agencies: "소방 예찰 완료 · 도청 상황실 모니터링",
  agencyDetail: "총 대응 기관 2개소",
  aiSummary: [
    { id: "hr-as1", label: "AI 조기경고 발령", value: "실측 초과 감지 후 6분 만에 담당자 확인" },
    { id: "hr-as2", label: "강우 정점 이후 감소", value: "62mm/h → 18mm/h (2시간 내)" },
  ],
  observed: [
    { id: "hr-ob1", label: "최고 강우강도", value: "62mm/h (16:52)" },
    { id: "hr-ob2", label: "누적 강우량", value: "138mm (2시간)" },
  ],
  closureConditions: [
    "강우강도 기준(40mm/h) 이하로 30분 이상 유지",
    "침수 우려 지점 현장 예찰 이상 없음 확인",
    "우량계·침수센서 정상 운용 복구",
  ],
  report: {
    department: "제주특별자치도 자연재난과",
    sop: "e-SOP H-1 호우 경보 종료 절차 v1.2",
    casualties: "없음",
    property: "없음 (추정)",
    lesson: "서귀포 지역 우량계 1대 추가 설치 검토 필요(관측 공백 구간 존재)",
  },
}

export const broadcastLog: BroadcastLogEntry[] = [
  { id: "bl-1", channel: "재해문자전광판", message: "효돈천 하천범람 심각 단계 — 접근 자제", time: "14:32" },
  { id: "bl-2", channel: "자동음성통보", message: "한천 인근 주민 대상 대피 안내 방송", time: "14:10" },
  { id: "bl-3", channel: "재해문자전광판", message: "제주 전역 호우 예비특보 발효", time: "13:00" },
]
