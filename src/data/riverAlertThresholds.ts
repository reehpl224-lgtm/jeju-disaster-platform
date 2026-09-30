import type { RiskLevel } from "../types/domain"

/**
 * 하천 위험단계 판정 — mockRiver.ts의 riverStageCriteria(계획홍수량 대비 % 구간, "TP-P22_002" 원본 확정값)를
 * 실제 판정 함수로 만든 것. classifyCoastRisk·classifySalinity와 같은 패턴. 경계값을 바꾸면 riverStageCriteria의
 * flowRatio 표기도 반드시 같이 맞춘다 — 이 파일이 유일한 판정 기준이다.
 */
export function classifyRiverRisk(flowRatioPercent: number): RiskLevel {
  if (flowRatioPercent < 20) return "safe"
  if (flowRatioPercent < 50) return "caution"
  if (flowRatioPercent < 70) return "warning"
  if (flowRatioPercent < 100) return "alert"
  return "danger"
}

/** 등급 순서(정상이 가장 낮음) — 하향 유지시간 계산 등에서 재사용 */
export const RIVER_LEVELS: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
export const riverLevelRank = (level: RiskLevel) => RIVER_LEVELS.indexOf(level)
