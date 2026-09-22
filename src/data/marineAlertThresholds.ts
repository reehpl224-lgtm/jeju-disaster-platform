import type { RiskLevel } from "../types/domain"

/**
 * 저염분수·고수온 위험단계 — 실증사(지오시스템리서치) 착수보고 발표자료·사업계획서 기준 4단계
 * 정상(0)·주의(1)·경계(2)·심각(3) (2026-09-22 사용자 확정: 이전 국립수산과학원 5단계 → 발표자료 4단계).
 *
 * 사업계획서 [표25]의 단계 정의:
 *  - 정상: 염분 31psu 이상(제주 하계 평상 30~31psu), 고수온 없음
 *  - 주의: 저염분수(28psu 이하) 수괴가 제주 서남부 해역에 접근
 *  - 경계: 저염분수(26psu 이하)/고수온이 연안 10마일 이내 접근
 *  - 심각: 대정·한경 양식장 취수구 인근 덮침 실황 + 고수온 동반
 * 표25는 "해역 접근 위치" 기준이라 관측지점 단일값 판정용 수치는 아래처럼 근사했다 — 이전 5단계의
 * 수치 경계를 그대로 두고 '관심(28~31psu)'만 정상에 합쳤다. 사업계획서도 "단계별 임계치는 수요처
 * 협의 후 확정"이라고 명시하므로, 확정되면 이 파일만 고치면 된다.
 */
export type MarineStage = "NORMAL" | "WATCH" | "ALERT" | "CRITICAL"

export const MARINE_STAGES: MarineStage[] = ["NORMAL", "WATCH", "ALERT", "CRITICAL"]

export const MARINE_STAGE_LABEL: Record<MarineStage, string> = {
  NORMAL: "정상",
  WATCH: "주의",
  ALERT: "경계",
  CRITICAL: "심각",
}

const STAGE_RANK: Record<MarineStage, number> = { NORMAL: 0, WATCH: 1, ALERT: 2, CRITICAL: 3 }

function worse(a: MarineStage, b: MarineStage): MarineStage {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b
}

/** 발표자료: 주의 = "28psu 이하", 경계 = "26psu 이하" — 경계값은 해당 단계에 포함 */
export function classifySalinity(psu: number): MarineStage {
  if (psu > 28.0) return "NORMAL"
  if (psu > 26.0) return "WATCH"
  if (psu >= 24.0) return "ALERT"
  return "CRITICAL"
}

/**
 * @param sustainedDays 28℃ 이상 지속 일수. 0(기본값)=오늘 막 도달, 1~2=지속 중, 3 이상=장기 지속.
 * 원본 표는 "28.0 도달(주의)" / "28.0 이상·3일 미만 지속(경보)" / "28.0 이상·3일 이상 지속(심각)"으로
 * 같은 28℃ 이상 구간을 지속일수로 3단계 세분화한다.
 */
export function classifyTemperature(tempC: number, sustainedDays = 0): MarineStage {
  if (tempC < 28.0) return "NORMAL"
  if (sustainedDays >= 3) return "CRITICAL"
  if (sustainedDays >= 1) return "ALERT"
  return "WATCH"
}

/**
 * 복합(AND) 승격 규칙 — 원본 "복합 수치 조합 조건" 컬럼 근거.
 * 단일 지표 등급의 worst-of보다, 두 지표가 동시에 특정 구간에 들면 더 위로 승격될 수 있다.
 * - 심각: 수온 ≥28.0℃ AND 염분 ≤26.0psu
 * - 경계: 수온 ≥28.0℃ AND 염분 ≤28.0psu
 * - 주의: 수온 26.0~27.9℃ AND 염분 ≤28.0psu
 */
function combinedOverride(salinityPsu: number, tempC: number): MarineStage | null {
  if (tempC >= 28.0 && salinityPsu <= 26.0) return "CRITICAL"
  if (tempC >= 28.0 && salinityPsu <= 28.0) return "ALERT"
  if (tempC >= 26.0 && tempC < 28.0 && salinityPsu <= 28.0) return "WATCH"
  return null
}

export function classifyMarineRisk(
  salinityPsu: number | undefined,
  tempC: number | undefined,
  tempSustainedDays = 0,
): MarineStage {
  const salinityStage = salinityPsu !== undefined ? classifySalinity(salinityPsu) : undefined
  const tempStage = tempC !== undefined ? classifyTemperature(tempC, tempSustainedDays) : undefined

  let stage: MarineStage = "NORMAL"
  if (salinityStage && tempStage) stage = worse(salinityStage, tempStage)
  else if (salinityStage) stage = salinityStage
  else if (tempStage) stage = tempStage

  if (salinityPsu !== undefined && tempC !== undefined) {
    const override = combinedOverride(salinityPsu, tempC)
    if (override) stage = worse(stage, override)
  }

  return stage
}

/** 앱 전역 RiskLevel로의 매핑 — 저염분수는 '관심(caution)'을 쓰지 않는다 */
const STAGE_TO_RISK_LEVEL: Record<MarineStage, RiskLevel> = {
  NORMAL: "safe",
  WATCH: "warning",
  ALERT: "alert",
  CRITICAL: "danger",
}

export function marineStageToRiskLevel(stage: MarineStage): RiskLevel {
  return STAGE_TO_RISK_LEVEL[stage]
}

export function classifyMarineRiskLevel(
  salinityPsu: number | undefined,
  tempC: number | undefined,
  tempSustainedDays = 0,
): RiskLevel {
  return marineStageToRiskLevel(classifyMarineRisk(salinityPsu, tempC, tempSustainedDays))
}
