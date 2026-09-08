import type { RiskLevel } from "./domain"

/**
 * 풍수해 통합 현황 — 레거시시스템 현황 조사 면담(2026-09-07) 근거. 3대 실증서비스(양식장/연안/하천)와
 * 달리 새 AI 예측을 만드는 것이 아니라, 기존 레거시 시스템(재난 예·경보시스템 등)을 컨트롤타워에
 * 통합 연계하는 진행 상황을 보여주는 화면. MVP 범위이므로 단일 홈 화면으로 구성한다.
 */
export interface LegacySystemStatus {
  id: string
  name: string
  operator: string
  linkStatus: "연계 진행중" | "협의 중" | "미연계"
  note: string
}

export interface WeatherStationReading {
  id: string
  name: string
  type: "침수센서" | "우량계" | "적설계" | "풍속풍향계"
  value: string
  status: RiskLevel
  updatedAt: string
}

export interface BroadcastLogEntry {
  id: string
  channel: string
  message: string
  time: string
}
