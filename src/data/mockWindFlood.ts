import type { BroadcastLogEntry, LegacySystemStatus, WeatherStationReading } from "../types/windFlood"

/**
 * 출처: 레거시시스템 현황 조사 면담 결과서_20260907 [참고] 재난 관련 레거시시스템 목록.
 * 도청이 개별 시스템을 직접 관리하지 않고 유지보수 업체와 별도 협의가 필요하다고 밝힌 내용을
 * 그대로 반영 — "연계 완료"로 과장하지 않는다. 1차년도 우선순위인 풍수해 관련 예·경보시스템만
 * "연계 진행중"으로, 나머지는 실제 상태인 "협의 중"/"미연계"로 표기한다.
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
 * AI 침수 위험 조기경보 — /river/analysis의 riverSuddenRainAlert와 동일한 원리를 풍수해
 * 관측망 전체로 일반화했다. 풍수해 통합 자체는 레거시 연계(규칙 기반)이지만, 우량계 실측 추이를
 * 기상청 예보와 비교해 자동침수경보 임계치 도달을 조기에 캐치하는 부분은 AI 예측이 유효하다.
 * 최종 발령 판단은 항상 담당자 몫 — river 쪽과 동일한 원칙을 유지한다.
 */
export const windFloodAiForecast = {
  forecastMm: 40,
  detectedAt: "14:29",
  stations: [
    { id: "f-1", name: "제주시 우량계 #3", observedMm: 62 },
    { id: "f-2", name: "서귀포 우량계 #2", observedMm: 48 },
  ],
  aiNote: "제주시·서귀포 우량계 모두 예보(40mm/h) 대비 실측 강우가 지속 초과하고 있습니다. 현재 추이가 유지되면 자동침수경보 임계치 도달까지 약 12분 예상됩니다.",
  confirmNote: "자동침수경보 발령 여부는 반드시 담당자 확인이 필요합니다 (오경보 리스크 고려).",
}

export const broadcastLog: BroadcastLogEntry[] = [
  { id: "bl-1", channel: "재해문자전광판", message: "효돈천 하천범람 심각 단계 — 접근 자제", time: "14:32" },
  { id: "bl-2", channel: "자동음성통보", message: "한천 인근 주민 대상 대피 안내 방송", time: "14:10" },
  { id: "bl-3", channel: "재해문자전광판", message: "제주 전역 호우 예비특보 발효", time: "13:00" },
]
