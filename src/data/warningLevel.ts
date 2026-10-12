import type { RiskLevel } from "../types/domain"

/**
 * 기상청 특보 LVL(wrn_met_data) — 1 예비특보 · 2 주의보 · 3 경보.
 * 프록시가 붙여 주는 lvlLabel은 쓰지 않고 여기서 이름과 등급을 정한다(프록시는 1=주의보·2=경보로 잘못 추정했었다).
 */
export const warnLvlLabel = (lvl: string) => ({ "1": "예비특보", "2": "주의보", "3": "경보" })[lvl] ?? lvl
export const warnLvlRisk = (lvl: string): RiskLevel => (lvl === "3" ? "alert" : lvl === "2" ? "warning" : "caution")
