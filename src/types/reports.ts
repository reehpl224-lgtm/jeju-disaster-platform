import type { RiskLevel } from "./domain"

export type IncidentDomain = "river" | "coast" | "aqua"

export interface IncidentRecord {
  id: string
  level: RiskLevel
  levelLabel: string
  domain: IncidentDomain
  domainLabel: string
  endedAt: string
  title: string
  grade: string
  duration: string
  area: string
  approver: string
  actionCount: string
}

export interface IncidentTimelineEntry {
  time: string
  stage: string
  content: string
  owner: string
}

export interface IncidentSopApproval {
  stage: string
  content: string
  approver: string
  time: string
  note: string
}

export interface IncidentAgencyAction {
  agency: string
  action: string
  dispatchedAt: string
  result: string
  confirmedBy: string
}

export interface IncidentAttachment {
  id: string
  name: string
  time: string
}
