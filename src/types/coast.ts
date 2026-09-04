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
