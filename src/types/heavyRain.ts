import type { RiskLevel } from "./domain"

/**
 * 호우 통합 현황 — 레거시시스템 현황 조사 면담(2026-09-07) 근거. 2026-09-08에 "풍수해 통합"을
 * 호우/태풍 2개 시스템으로 분리(사용자 요청) — 이 파일은 그중 호우(강우·침수·적설 등 자체 관측망이
 * 있는 쪽) 담당. 태풍은 자체 실측 장비가 없어 별도 파일(`typhoon.ts`)로 분리했다. 3대 실증서비스
 * (양식장/연안/하천)와 달리 새 AI 예측을 만드는 것이 아니라, 기존 레거시 시스템을 컨트롤타워에
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
