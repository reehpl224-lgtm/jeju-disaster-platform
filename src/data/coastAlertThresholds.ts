import type { RiskLevel } from "../types/domain"

/**
 * 연안 위험단계 판정 — 구간값은 "TP-P22_002_플랫폼 데이터 리스트.xlsx" 연안 시트(coastStageCriteria) 그대로.
 * 원본에는 파고·풍속·조위를 어떻게 결합하는지 규칙이 없어, 아래 결합 규칙은 2026-09-22 사용자 요청으로
 * 임의 설정한 것이다(공식 기준 확정 시 이 파일만 수정). 단계는 정상 < 관심 < 주의 < 경계(원본 '경보') < 심각.
 *
 * 결합 규칙
 *  1. 파고·풍속은 각각 단독으로 단계를 정하고, 둘 중 높은 단계를 기본 단계로 한다(어느 하나만 커도 위험).
 *  2. 조위는 단독으로 단계를 정하지 않고 가중치로만 쓴다 — 조위가 '고조 도달(주의)' 이상이고 기본 단계가
 *     관심 이상이면 한 단계 올린다(만조와 파랑이 겹치면 월파 위험이 커짐 — 원본 중기 예측의 "만조-너울 결합
 *     위험도" 항목 근거). 단, 조위가 '범람·침수 위험 수위 초과'면 파고·풍속과 무관하게 최소 경계.
 *  3. 위험 범위(AI 영상 이벤트)는 최소 단계를 보장한다 — 위험구역 진입 감지 → 최소 관심, 월파 감지 → 최소 경계,
 *     인명 고립·추락·내습 감지 → 즉시 심각.
 *  4. 하향은 모든 지표가 낮은 단계에 30분 이상 머문 뒤 한 단계씩(하천 종료 조건과 같은 30분 기준).
 */

export const COAST_LEVELS: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
const rank = (l: RiskLevel) => COAST_LEVELS.indexOf(l)
const worse = (a: RiskLevel, b: RiskLevel) => (rank(a) >= rank(b) ? a : b)
const LABEL: Record<string, string> = { safe: "정상", caution: "관심", warning: "주의", alert: "경계", danger: "심각" }

/** 유의파고(m): <1.0 정상 · 1.0~1.5 관심 · 1.5~2.5 주의 · 2.5~4.0 경계 · 4.0 초과 심각 */
export function classifyWave(m: number): RiskLevel {
  if (m < 1.0) return "safe"
  if (m < 1.5) return "caution"
  if (m < 2.5) return "warning"
  if (m <= 4.0) return "alert"
  return "danger"
}

/** 풍속(m/s): <6 정상 · 6~10 관심 · 10~14 주의 · 14~20 경계 · 20 초과 심각 */
export function classifyWind(ms: number): RiskLevel {
  if (ms < 6) return "safe"
  if (ms < 10) return "caution"
  if (ms < 14) return "warning"
  if (ms <= 20) return "alert"
  return "danger"
}

/** 조위 상태 — 원본의 조위(수위) 칸 5단계 */
export type TideState = "평시" | "만조 상승" | "고조 도달" | "대조기·폭풍해일 주의" | "범람 위험 초과"
const TIDE_LEVEL: Record<TideState, RiskLevel> = {
  평시: "safe",
  "만조 상승": "caution",
  "고조 도달": "warning",
  "대조기·폭풍해일 주의": "alert",
  "범람 위험 초과": "danger",
}

export type CoastEventType = "없음" | "위험구역 진입" | "월파 감지" | "인명 고립·추락·내습"
const EVENT_FLOOR: Record<CoastEventType, RiskLevel> = {
  없음: "safe",
  "위험구역 진입": "caution",
  "월파 감지": "alert",
  "인명 고립·추락·내습": "danger",
}

export interface CoastRiskResult {
  level: RiskLevel
  reasons: string[]
}

export function classifyCoastRisk(input: { waveM?: number; windMs?: number; tide?: TideState; event?: CoastEventType }): CoastRiskResult {
  const reasons: string[] = []
  let level: RiskLevel = "safe"

  if (input.waveM !== undefined) {
    const w = classifyWave(input.waveM)
    reasons.push(`파고 ${input.waveM}m → ${LABEL[w]}`)
    level = worse(level, w)
  }
  if (input.windMs !== undefined) {
    const w = classifyWind(input.windMs)
    reasons.push(`풍속 ${input.windMs}m/s → ${LABEL[w]}`)
    level = worse(level, w)
  }

  const tide = input.tide ?? "평시"
  const tideLevel = TIDE_LEVEL[tide]
  if (tideLevel === "danger") {
    if (rank(level) < rank("alert")) reasons.push("조위 범람 위험 초과 → 최소 경계")
    level = worse(level, "alert")
  } else if (rank(tideLevel) >= rank("warning") && rank(level) >= rank("caution") && level !== "danger") {
    level = COAST_LEVELS[rank(level) + 1]
    reasons.push(`조위 '${tide}' 가중 → 한 단계 상향(${LABEL[level]})`)
  }

  const ev = input.event ?? "없음"
  const floor = EVENT_FLOOR[ev]
  if (rank(floor) > rank(level)) {
    level = floor
    reasons.push(`AI 이벤트 '${ev}' → 최소 ${LABEL[floor]}`)
  }

  return { level, reasons }
}

export const COAST_COMBINE_RULES: string[] = [
  "파고·풍속은 각각 단독으로 단계를 정하고, 둘 중 높은 단계를 기본 단계로 합니다.",
  "조위는 가중치로만 씁니다 — 고조 도달(주의) 이상이고 기본 단계가 관심 이상이면 한 단계 상향. 범람 위험 수위 초과면 최소 경계.",
  "AI 영상 이벤트는 최소 단계를 보장합니다 — 위험구역 진입 → 관심, 월파 감지 → 경계, 인명 고립·추락·내습 → 즉시 심각.",
  "하향은 모든 지표가 낮은 단계에 30분 이상 머문 뒤 한 단계씩 내립니다.",
]
