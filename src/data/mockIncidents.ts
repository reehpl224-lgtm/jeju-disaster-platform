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
 */
export const disasterDatasetMeta = {
  datasetName: "제주AX재난관리 플랫폼 더미데이터",
  isDummy: true,
  generatedAt: "2026-09-07T17:00:00+09:00",
}

export const disasterDashboardSummary: DisasterDashboardSummary = {
  activeIncidents: 3,
  warningLevel: "warning",
  responseTeams: 8,
  availableShelters: 24,
  lastUpdated: "2026-09-07T16:55:00+09:00",
}

export const disasterIncidents: DisasterIncident[] = [
  {
    id: "INC-2026-0907-001",
    type: "호우",
    title: "제주시 한천 하천 수위 상승",
    status: "대응중",
    severity: "alert",
    region: "제주시",
    location: "한천교 인근",
    latitude: 33.4996,
    longitude: 126.5312,
    reportedAt: "2026-09-07T15:22:00+09:00",
    updatedAt: "2026-09-07T16:48:00+09:00",
    description: "집중호우로 하천 수위가 상승하여 인근 저지대 예찰을 강화하고 있습니다.",
    assignedTeam: "제주시 재난대응 2팀",
    affectedPeople: 120,
    action: "하천변 출입 통제 및 주민 안내방송",
  },
  {
    id: "INC-2026-0907-002",
    type: "강풍",
    title: "서귀포시 해안 강풍 예비특보",
    status: "모니터링",
    severity: "warning",
    region: "서귀포시",
    location: "성산읍 해안도로",
    latitude: 33.4631,
    longitude: 126.9341,
    reportedAt: "2026-09-07T14:10:00+09:00",
    updatedAt: "2026-09-07T16:30:00+09:00",
    description: "해안지역 순간풍속 증가가 예상되어 시설물 점검을 진행합니다.",
    assignedTeam: "서귀포시 안전관리팀",
    affectedPeople: 45,
    action: "현수막·옥외시설물 고정 상태 점검",
  },
  {
    id: "INC-2026-0907-003",
    type: "산불",
    title: "한라산 탐방로 연기 신고",
    status: "종료",
    severity: "caution",
    region: "제주시",
    location: "관음사 탐방로 입구",
    latitude: 33.4334,
    longitude: 126.5565,
    reportedAt: "2026-09-07T11:05:00+09:00",
    updatedAt: "2026-09-07T12:40:00+09:00",
    description: "현장 확인 결과 통제된 취사 연기로 확인되어 상황을 종료했습니다.",
    assignedTeam: "한라산국립공원 현장반",
    affectedPeople: 0,
    action: "탐방객 안전수칙 안내 후 상황 종료",
  },
]

export const disasterAlerts: DisasterAlert[] = [
  {
    id: "ALT-001",
    level: "warning",
    title: "제주 전역 호우 예비특보",
    issuedAt: "2026-09-07T13:00:00+09:00",
    expiresAt: "2026-09-07T22:00:00+09:00",
    target: "제주 전역",
    message: "저지대·하천변 접근을 자제하고 기상정보를 확인해 주세요.",
  },
  {
    id: "ALT-002",
    level: "info",
    title: "재난문자 발송 테스트",
    issuedAt: "2026-09-07T10:00:00+09:00",
    expiresAt: "2026-09-07T18:00:00+09:00",
    target: "플랫폼 관리자",
    message: "본 메시지는 시스템 검증용 더미데이터입니다.",
  },
]

export const shelters: Shelter[] = [
  {
    id: "SH-001",
    name: "제주시민회관 임시대피소",
    region: "제주시",
    address: "제주시 중앙로 100",
    capacity: 500,
    currentOccupancy: 86,
    status: "운영중",
    contact: "064-000-0001",
  },
  {
    id: "SH-002",
    name: "서귀포 생활체육관",
    region: "서귀포시",
    address: "서귀포시 월드컵로 50",
    capacity: 300,
    currentOccupancy: 42,
    status: "운영중",
    contact: "064-000-0002",
  },
]

export const disasterResponseTeams: DisasterResponseTeam[] = [
  {
    id: "TEAM-001",
    name: "제주시 재난대응 2팀",
    agency: "제주시청",
    status: "출동중",
    members: 6,
    currentIncidentId: "INC-2026-0907-001",
    lastContactAt: "2026-09-07T16:45:00+09:00",
  },
  {
    id: "TEAM-002",
    name: "서귀포시 안전관리팀",
    agency: "서귀포시청",
    status: "대기",
    members: 4,
    currentIncidentId: "INC-2026-0907-002",
    lastContactAt: "2026-09-07T16:28:00+09:00",
  },
]

export const currentWeather: WeatherObservation = {
  location: "제주도",
  temperatureC: 27.4,
  rainfallMm: 38.2,
  windSpeedMs: 12.5,
  humidityPercent: 82,
  observedAt: "2026-09-07T16:50:00+09:00",
}
