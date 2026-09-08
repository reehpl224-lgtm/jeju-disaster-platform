import type { RiskLevel } from "./domain"

/**
 * 폭염 서비스 — 현업요구사항_정리_자연재난과_20260907.md 4번 항목 근거. AGENTS.md §2에서 합의된
 * 3대 실증서비스(양식장/연안/하천) 범위 밖의 4번째 서비스이나, 사용자가 명시적으로 MVP 반영을
 * 요청해 단일 홈 화면으로 구성한다.
 */
export interface HeatShelter {
  id: string
  name: string
  region: string
  address: string
  type: "경로당" | "마을회관" | "복지관" | "기타"
  capacity: number
}

export interface HeatRouteTip {
  id: string
  kind: "cool" | "hot"
  name: string
  detail: string
}

export interface HeatLevelInfo {
  level: RiskLevel
  label: string
  feelsLikeC: number
  criteria: string
  updatedAt: string
}
