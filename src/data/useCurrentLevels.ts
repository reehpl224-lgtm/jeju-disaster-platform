import { currentLevel, type EsopLevel } from "./esopLogic"
import { useServiceStatusCards } from "./useServiceStatusCards"

/** 서비스별 현재 단계 — 서비스 카드 집계에서 건수가 있는 가장 높은 단계(없으면 undefined) */
export function useCurrentLevels(): Record<string, EsopLevel | undefined> {
  return Object.fromEntries(useServiceStatusCards().map((c) => [c.id, currentLevel(c.counts)]))
}
