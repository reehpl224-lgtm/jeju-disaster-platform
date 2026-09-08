import type { RiskLevel } from "./domain"

export type IncidentDomain = "river" | "coast" | "aqua"

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

export interface IncidentDetailSummary {
  location: string
  detectedAt: string
  endedAt: string
  maxGrade: string
  confidence: string
  approver: string
  status: string
}

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
  /** 종료 보고서 상세 페이지(/reports/:incidentId)용 — 사건별로 서로 달라야 함 */
  detail: IncidentDetailSummary
  timeline: IncidentTimelineEntry[]
  sopApprovals: IncidentSopApproval[]
  agencyActions: IncidentAgencyAction[]
  attachments: IncidentAttachment[]
}
