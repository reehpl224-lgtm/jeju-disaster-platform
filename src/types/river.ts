import type { RiskLevel } from "./domain"

export interface RiverStatus {
  id: string
  name: string
  level: RiskLevel
  stage: string
  eta: string
  updatedAt: string
}

export interface RiverControlRow {
  id: string
  river: string
  stage: string
  location: string
  gate: "정상 작동" | "오류 발생"
  dispatch: string
  ack: string
}

export interface TimelineEntry {
  id: string
  time: string
  title: string
}
