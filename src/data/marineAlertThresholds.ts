import type { RiskLevel } from "../types/domain"

/**
 * 저염분수·고수온 위험등급 임계값 — "TP-P22_002_플랫폼 데이터 리스트.xlsx" 저염분수·고수온 시트의 "상태 구간 설정" 기준
 * (국립수산과학원 및 제주특별자치도 해양수산연구원 대응 매뉴얼 인용, 2026-09-22 사용자 확정)
 *
 * 4단계(정상·주의·경계·심각) — 2026-10-15 사용자 결정으로 원본의 '관심' 구간은 정상에 합쳤다(징후 감시로만 표시, 단계 건수에 넣지 않음).
 * 실증사(지오시스템리서치) 계획서의 4단계(정상 31psu 이상·주의 28psu 이하·경계 26psu 이하·심각 취수구 인근 덮침)와 같은 경계값이다.
 * 경계값은 높은 단계에 포함한다: 염분 28.0은 주의, 26.0은 경계, 24.0은 심각(원본 단독 조건 컬럼 "26.1~28.0", "24.1~26.0", "24.0 이하").
 * 원본 구간 컬럼의 "상한 이상 ~ 하한 미만" 역순 표기와 정상 30.0/31.0 불일치는 데이터 리스트 엑셀도 함께 정정했다.
 *
 * 앱 전역 RiskLevel(정상<주의<경계<심각)과 순서·이름이 1:1로 대응한다 — 원본 '경보'→'경계'로만 이름을 맞춘다.
 */
export type MarineStage = "NORMAL" | "WATCH" | "ALERT" | "CRITICAL"

export const MARINE_STAGES: MarineStage[] = ["NORMAL", "WATCH", "ALERT", "CRITICAL"]

/** 원본 문서가 쓰는 해양환경 도메인 고유 명칭(정상/주의/경보/심각) — 앱 전역 RiskLevel 라벨(정상/주의/경계/심각)과 경보↔경계만 다르고 나머지는 동일 */
export const MARINE_STAGE_LABEL: Record<MarineStage, string> = {
  NORMAL: "정상",
  WATCH: "주의",
  ALERT: "경보",
  CRITICAL: "심각",
}

const STAGE_RANK: Record<MarineStage, number> = { NORMAL: 1, WATCH: 2, ALERT: 3, CRITICAL: 4 }

function worse(a: MarineStage, b: MarineStage): MarineStage {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b
}

export function classifySalinity(psu: number): MarineStage {
  // 28.0 초과 정상(28.1~30.9는 징후 감시) · 26.0 초과 28.0 이하 주의 · 24.0 초과 26.0 이하 경계 · 24.0 이하 심각
  if (psu > 28.0) return "NORMAL"
  if (psu > 26.0) return "WATCH"
  if (psu > 24.0) return "ALERT"
  return "CRITICAL"
}

/**
 * @param sustainedDays 28℃ 이상 지속 일수. 0(기본값)=오늘 막 도달, 1~2=지속 중, 3 이상=장기 지속.
 * 원본 표는 "28.0 도달(주의)" / "28.0 이상·3일 미만 지속(경보)" / "28.0 이상·3일 이상 지속(심각)"으로
 * 같은 28℃ 이상 구간을 지속일수로 3단계 세분화한다. 28℃ 미만은 정상(25.1~27.9℃는 징후 감시).
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

/** 앱 전역 4단계(정상/주의/경계/심각)로의 매핑 — 경보→경계만 이름이 다름 */
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
