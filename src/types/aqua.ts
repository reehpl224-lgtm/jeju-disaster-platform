import type { RiskLevel } from "./domain"

export interface AquaDataSource {
  id: string
  name: string
  detail: string
  updatedAt: string
  cycle: string
  status: "normal" | "delayed" | "error" | "missing"
  qualityScore: number | null
  note: string
}

export interface AquaDataIssue {
  id: string
  type: "error" | "delayed" | "missing"
  title: string
  cause: string
  impact: string
}

export interface AquaActionLogEntry {
  id: string
  time: string
  title: string
  owner: string
  action: string
  status: "완료" | "진행 중"
}

export interface AquaModelConfidence {
  id: string
  name: string
  percent: number
}

export interface AquaQualityMetric {
  id: string
  name: string
  level: "safe" | "caution"
  percent: number
  note: string
}

export interface AquaFarm {
  id: string
  name: string
  region: string
  species: string
  level: RiskLevel
  riskType: string
  etaHours: number
  salinity?: number
  temperature?: number
  /** 수온이 28.0℃ 이상 지속된 일수 — classifyTemperature()의 등급 산정에 필요(0=방금 도달, 미지정 시 0으로 간주) */
  tempSustainedDays?: number
  manager?: string
  phone?: string
  area?: string
  registeredAt?: string
}

export interface AquaChecklistItem {
  id: string
  label: string
  owner: string
  time: string
  status: "완료" | "미완료" | "실패" | "대기"
}

export interface AquaStage {
  step: number
  label: string
  status: "완료" | "진행 중" | "대기"
}

export interface AquaAgencyRow {
  id: string
  agency: string
  role: string
  approve: string
  execute: string
  receive: string
}

export interface AquaTimelineEntry {
  id: string
  time: string
  title: string
}
