import type { RiskLevel } from "../types/domain"

/**
 * 저염분수·고수온 위험등급 임계값 — "플랫폼 데이터 리스트.xlsx" 저염분수·고수온 시트 기준
 * (국립수산과학원 및 제주특별자치도 해양수산연구원 대응 매뉴얼 인용, 2026-09 확인)
 *
 * 원본은 정상/관심/주의/경보/심각 5단계이며, 앱 전역 RiskLevel(정상<관심<주의<경계<위험)과
 * 순서가 1:1로 대응한다 — 경보→경계, 심각→위험으로 이름만 맞추면 된다.
 *
 * 원본 표기 오류 수정 사항 (엑셀 원본도 함께 수정함):
 * - 염분 구간 컬럼에서 '심각' 행이 '경보' 행과 완전히 동일한 값("26.0 이상 ~ 24.0 미만")을
 *   그대로 복사해 놓은 오류가 있었음(경보·주의·관심 행은 "상한 이상 ~ 하한 미만" 표기가
 *   서로 일관돼 정상이었고, 심각 행만 갱신되지 않고 남아있던 복붙 실수). "복합 수치 조합
 *   조건" 컬럼(심각 단독조건=염분 24.0psu 이하)을 근거로 '심각' 행을 "24.0 이하"로 정정.
 */
export type MarineStage = "NORMAL" | "INTEREST" | "WATCH" | "ALERT" | "CRITICAL"

export const MARINE_STAGES: MarineStage[] = ["NORMAL", "INTEREST", "WATCH", "ALERT", "CRITICAL"]

/** 원본 문서가 쓰는 해양환경 도메인 고유 명칭(정상/관심/주의/경보/심각) — 참고용, UI 배지는 RiskLevel 라벨(정상/관심/주의/경계/위험)을 사용 */
export const MARINE_STAGE_LABEL: Record<MarineStage, string> = {
  NORMAL: "정상",
  INTEREST: "관심",
  WATCH: "주의",
  ALERT: "경보",
  CRITICAL: "심각",
}

const STAGE_RANK: Record<MarineStage, number> = { NORMAL: 1, INTEREST: 2, WATCH: 3, ALERT: 4, CRITICAL: 5 }

function worse(a: MarineStage, b: MarineStage): MarineStage {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b
}

export function classifySalinity(psu: number): MarineStage {
  if (psu >= 31.0) return "NORMAL"
  if (psu >= 28.0) return "INTEREST"
  if (psu >= 26.0) return "WATCH"
  if (psu >= 24.0) return "ALERT"
  return "CRITICAL"
}

/**
 * @param sustainedDays 28℃ 이상 지속 일수. 0(기본값)=오늘 막 도달, 1~2=지속 중, 3 이상=장기 지속.
 * 원본 표는 "28.0 도달(주의)" / "28.0 이상·3일 미만 지속(경보)" / "28.0 이상·3일 이상 지속(심각)"으로
 * 같은 28℃ 이상 구간을 지속일수로 3단계 세분화한다.
 */
export function classifyTemperature(tempC: number, sustainedDays = 0): MarineStage {
  if (tempC < 25.0) return "NORMAL"
  if (tempC < 28.0) return "INTEREST"
  if (sustainedDays >= 3) return "CRITICAL"
  if (sustainedDays >= 1) return "ALERT"
  return "WATCH"
}

/**
 * 복합(AND) 승격 규칙 — 원본 "복합 수치 조합 조건" 컬럼 근거.
 * 단일 지표 등급의 worst-of보다, 두 지표가 동시에 특정 구간에 들면 더 위로 승격될 수 있다.
 * - 심각: 수온 ≥28.0℃ AND 염분 ≤26.0psu
 * - 경보: 수온 ≥28.0℃ AND 염분 ≤28.0psu
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

/** 앱 전역 5단계(정상/관심/주의/경계/위험)로의 매핑 — 경보→경계, 심각→위험 */
const STAGE_TO_RISK_LEVEL: Record<MarineStage, RiskLevel> = {
  NORMAL: "safe",
  INTEREST: "caution",
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
