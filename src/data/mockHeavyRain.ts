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
    note: "풍수해 관련 종합 현황 데이터 — 기존 모니터링 대시보드 용도. 컨트롤타워 연계 상태는 자연재난과 재확인 필요(2026.09.28 문서로 신규 확인)",
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

/**
 * 2026-09-29 초기화 — 관측소 값·조기경고·발송 이력·종료 보고 등 시나리오 더미를 비웠다(사용자 요청: 실시간 API 제외 전부 초기화,
 * 시나리오는 새로 만들 예정). 구조(타입)는 그대로라 시나리오를 새로 넣으면 화면이 채워진다. 위 legacySystems는 실제 조사 결과라 유지.
 */
export const weatherStations: WeatherStationReading[] = []

/** AI 침수 위험 조기경보 — 우량계 실측이 예보를 넘는 신호가 없는 상태. 신호가 생기면 stations에 지점별 실측(mm/h)을 넣는다 */
export const heavyRainAiForecast = {
  forecastMm: 0,
  detectedAt: "-",
  stations: [] as { id: string; name: string; observedMm: number }[],
  aiNote: "현재 감지된 돌발 강우 신호가 없습니다. 평시 모니터링을 유지합니다.",
  confirmNote: "자동침수경보 발령 여부는 반드시 담당자 확인이 필요합니다 (오경보 리스크 고려).",
}

export const heavyRainTrend: HeavyRainTrendPoint[] = []

export const heavyRainTopStations: RainfallRankEntry[] = []

/** 경보 발송 — 발령된 경보 없음(발송 시각 "-") */
export const heavyRainAlertDispatch: HeavyRainAlertDispatch = {
  stage: "발령 없음",
  level: "safe",
  title: "현재 발령된 경보 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  approver: "-",
  message: "현재 발령된 경보가 없습니다.",
  channels: [
    { id: "hc-1", name: "문자(CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "hc-2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "hc-3", name: "재해문자전광판", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-", unit: "개소" },
  ],
  totalFail: 0,
}

/** 종료 보고 — 종료된 사건 없음(양식만 남김) */
export const heavyRainClosure: HeavyRainClosure = {
  caseId: "-",
  title: "종료된 사건 없음",
  status: "-",
  confirmedBy: "-",
  type: "-",
  location: "-",
  duration: "-",
  durationDetail: "-",
  agencies: "-",
  agencyDetail: "-",
  aiSummary: [],
  observed: [],
  closureConditions: [],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
}

export const broadcastLog: BroadcastLogEntry[] = []
