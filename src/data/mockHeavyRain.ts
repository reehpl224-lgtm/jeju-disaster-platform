import type {
  BroadcastLogEntry,
  HeavyRainAlertDispatch,
  HeavyRainClosure,
  HeavyRainTrendPoint,
  LegacySystemStatus,
  WeatherStationReading,
} from "../types/heavyRain"

/**
 * 출처: 레거시시스템 현황 조사 면담 결과서_20260907 [참고] 재난 관련 레거시시스템 목록.
 * 도청이 개별 시스템을 직접 관리하지 않고 유지보수 업체와 별도 협의가 필요하다고 밝힌 내용을
 * 그대로 반영 — "연계 완료"로 과장하지 않는다. 1차년도 우선순위인 호우 관련 예·경보시스템만
 * "연계 진행중"으로, 나머지는 실제 상태인 "협의 중"/"미연계"로 표기한다. 태풍 관련 레거시 연계는
 * 이 목록에 없음 — 태풍은 자체 시스템이 아니라 기상청 자료를 전량 수신하는 구조라 `typhoon.ts` 참고.
 */
export const legacySystems: LegacySystemStatus[] = [
  {
    id: "ls-1",
    name: "재난 예·경보시스템 (자동침수경보·하천모니터링·자동우량정보 등)",
    operator: "도/제주시/서귀포시",
    linkStatus: "연계 진행중",
    note: "1차년도 우선 통합 대상 — 풍수해 데이터 중심",
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
    id: "ls-4",
    name: "조기경보시스템",
    operator: "도",
    linkStatus: "협의 중",
    note: "1차년도 연계 희망 시스템으로 언급됨",
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
