import type {
  DisasterAlert,
  DisasterDashboardSummary,
  DisasterIncident,
  DisasterResponseTeam,
  Shelter,
  WeatherObservation,
} from "../types/incident"

/**
 * 출처: 로컬 "더미데이터_템플릿.json" / "재난상황_더미데이터.csv" (isDummy: true)
 * 3대 실증서비스(양식장 저염분수·고수온 / 연안 안전 / 하천 범람) 전용 데이터와는 별개로,
 * 제주 전역의 범재난(호우·강풍·산불 등) 현황을 보여주는 통합 대시보드 보조 섹션용 더미데이터.
 * 2026-09-29 초기화 — 사건·특보·대피소·대응팀·현재 날씨 더미를 비웠다(사용자 요청). 시나리오가 채운다.
 */
export const disasterDatasetMeta = {
  datasetName: "제주 재난 대응 플랫폼 더미데이터",
  isDummy: true,
  generatedAt: "-",
}

export const disasterDashboardSummary: DisasterDashboardSummary = {
  activeIncidents: 0,
  warningLevel: "safe",
  responseTeams: 0,
  availableShelters: 0,
  lastUpdated: "-",
}

export const disasterIncidents: DisasterIncident[] = []

export const disasterAlerts: DisasterAlert[] = []

export const shelters: Shelter[] = []

export const disasterResponseTeams: DisasterResponseTeam[] = []

/** 현재 날씨(종합 상황 요약) — 관측값 없음. observedAt이 "-"면 화면은 값을 "-"로 표시한다 */
export const currentWeather: WeatherObservation = {
  location: "제주도",
  temperatureC: 0,
  rainfallMm: 0,
  windSpeedMs: 0,
  humidityPercent: 0,
  observedAt: "-",
}
