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

/** 하천×조수 연계 시계열 포인트 — 감조구간(하구)에서만 의미 있음. predicted=false는 관측값, true는 예측값 */
export interface RiverTidePoint {
  time: string
  waterLevelM: number
  tideLevelM: number
  predicted: boolean
}
