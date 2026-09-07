import type { RiskLevel } from "../types/domain"

/**
 * 저염분수·고수온 대시보드 위험등급 임계값
 * 출처: marineAlertThresholds JSON (기획팀 제공, 2026-09)
 */
export type MarineStage = "NORMAL" | "INTEREST" | "ATTENTION" | "ALERT"

export const MARINE_STAGES: MarineStage[] = ["NORMAL", "INTEREST", "ATTENTION", "ALERT"]

export const MARINE_STAGE_LABEL: Record<MarineStage, string> = {
  NORMAL: "정상",
  INTEREST: "관심",
  ATTENTION: "주의",
  ALERT: "위험",
}

/** 원본 JSON에 명시된 참고 색상값 (Bootstrap 계열 원색 — 앱 다크테마 배지 색상과는 별개로 원본 그대로 보존) */
export const MARINE_STAGE_COLOR_CODE: Record<MarineStage, string> = {
  NORMAL: "#28A745",
  INTEREST: "#17A2B8",
  ATTENTION: "#FFC107",
  ALERT: "#DC3545",
}

const STAGE_RANK: Record<MarineStage, number> = { NORMAL: 1, INTEREST: 2, ATTENTION: 3, ALERT: 4 }

export const SALINITY_LEVELS = [
  { level: "NORMAL" as const, min: 30.0, max: Infinity },
  { level: "INTEREST" as const, min: 28.0, max: 30.0 },
  { level: "ATTENTION" as const, min: 26.0, max: 28.0 },
  { level: "ALERT" as const, min: -Infinity, max: 26.0 },
]

export const TEMPERATURE_LEVELS_NOTE =
  "정상 <25.0℃ · 관심 25.0~28.0℃ · 주의 ≥28.0℃(1~2일 지속) · 위험 ≥28.0℃(3일 이상 지속)"

export function classifySalinity(psu: number): MarineStage {
  if (psu >= 30.0) return "NORMAL"
  if (psu >= 28.0) return "INTEREST"
  if (psu >= 26.0) return "ATTENTION"
  return "ALERT"
}

/** @param sustainedDays 28℃ 이상 지속 일수 (미지정 시 1일 = 아직 경보 미도달로 간주) */
export function classifyTemperature(tempC: number, sustainedDays = 1): MarineStage {
  if (tempC < 25.0) return "NORMAL"
  if (tempC < 28.0) return "INTEREST"
  return sustainedDays >= 3 ? "ALERT" : "ATTENTION"
}

/**
 * 복합 규칙(COMBINED_ALERT_OVERRIDE): 저염분(28psu 미만) + 고수온(28℃ 이상) 동시 발생 시
 * 산소 결핍·삼투압 파괴 가속화로 개별 등급과 무관하게 '위험'으로 승격
 */
export function classifyMarineRisk(
  salinityPsu: number | undefined,
  tempC: number | undefined,
  tempSustainedDays = 1,
): MarineStage {
  const salinityStage = salinityPsu !== undefined ? classifySalinity(salinityPsu) : undefined
  const tempStage = tempC !== undefined ? classifyTemperature(tempC, tempSustainedDays) : undefined

  let stage: MarineStage = "NORMAL"
  if (salinityStage && tempStage) {
    stage = STAGE_RANK[salinityStage] >= STAGE_RANK[tempStage] ? salinityStage : tempStage
  } else if (salinityStage) {
    stage = salinityStage
  } else if (tempStage) {
    stage = tempStage
  }

  if (salinityPsu !== undefined && tempC !== undefined && salinityPsu < 28.0 && tempC >= 28.0) {
    stage = "ALERT"
  }

  return stage
}

/**
 * 앱 전역 5단계(정상/관심/주의/경계/위험) 중 해양환경 JSON이 정의하는 4개 구간만 사용하는 매핑.
 * 중간 '경계' 단계는 이 JSON 스펙에 대응 구간이 없어 사용하지 않음(주의 다음이 바로 위험).
 */
const STAGE_TO_RISK_LEVEL: Record<MarineStage, RiskLevel> = {
  NORMAL: "safe",
  INTEREST: "caution",
  ATTENTION: "warning",
  ALERT: "danger",
}

export function marineStageToRiskLevel(stage: MarineStage): RiskLevel {
  return STAGE_TO_RISK_LEVEL[stage]
}

export function classifyMarineRiskLevel(
  salinityPsu: number | undefined,
  tempC: number | undefined,
  tempSustainedDays = 1,
): RiskLevel {
  return marineStageToRiskLevel(classifyMarineRisk(salinityPsu, tempC, tempSustainedDays))
}
