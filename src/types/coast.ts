import type { RiskLevel } from "./domain"

export interface CoastEvent {
  id: string
  level: RiskLevel
  type: string
  source: string
  location: string
  time: string
  status: string
}

export const COAST_TYPE_LABEL: Record<string, string> = {
  "익수 의심": "Person_In_Water",
  "위험구역 진입": "Danger_Zone_Person",
  "이안류 감지": "Rip_Current",
  "월파 경보": "Overtopping",
}

export interface CoastFieldAlert {
  id: string
  location: string
  level: RiskLevel
  time: string
  detail: string
}

export interface CoastAgencyStatus {
  id: string
  agency: string
  status: string
  detail: string
  level: RiskLevel
}

export interface TimelineEntry {
  id: string
  time: string
  title: string
}
