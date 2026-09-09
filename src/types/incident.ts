import type { RiskLevel } from "./domain"

/** 제주 전역 범재난 현황 — 3대 실증서비스(양식장/연안/하천)와 별개인 종합 상황판용 더미데이터 */
export interface DisasterIncident {
  id: string
  type: string
  title: string
  status: "대응중" | "모니터링" | "종료"
  severity: RiskLevel
  region: string
  location: string
  latitude: number
  longitude: number
  reportedAt: string
  updatedAt: string
  description: string
  assignedTeam: string
  affectedPeople: number
  action: string
}

export interface DisasterAlert {
  id: string
  level: RiskLevel
  title: string
  issuedAt: string
  expiresAt: string
  target: string
  message: string
  /** 클릭 시 이동할 관련 메뉴 — 없으면 알림 항목이 정보 표시만 함 */
  href?: string
}

export interface Shelter {
  id: string
  name: string
  region: string
  address: string
  capacity: number
  currentOccupancy: number
  status: "운영중" | "대기"
  contact: string
}

export interface DisasterResponseTeam {
  id: string
  name: string
  agency: string
  status: "출동중" | "대기"
  members: number
  currentIncidentId: string | null
  lastContactAt: string
}

export interface WeatherObservation {
  location: string
  temperatureC: number
  rainfallMm: number
  windSpeedMs: number
  humidityPercent: number
  observedAt: string
}

export interface DisasterDashboardSummary {
  activeIncidents: number
  warningLevel: RiskLevel
  responseTeams: number
  availableShelters: number
  lastUpdated: string
}
