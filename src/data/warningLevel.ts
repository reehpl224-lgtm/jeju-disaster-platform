import type { RiskLevel } from "../types/domain"
import type { WarningEntry } from "../types/warningsApi"

/**
 * 기상청 특보 LVL(wrn_met_data) — 1 예비특보 · 2 주의보 · 3 경보.
 * 프록시가 붙여 주는 lvlLabel은 쓰지 않고 여기서 이름과 등급을 정한다(프록시는 1=주의보·2=경보로 잘못 추정했었다).
 */
export const warnLvlLabel = (lvl: string) => ({ "1": "예비특보", "2": "주의보", "3": "경보" })[lvl] ?? lvl
export const warnLvlRisk = (lvl: string): RiskLevel => (lvl === "3" ? "alert" : lvl === "2" ? "warning" : "caution")

/**
 * 같은 시(제주시·서귀포시)·같은 종류·같은 수준의 반복 발표는 하나로 본다 — 가장 최근 발표만 남긴다.
 * 기상청은 같은 특보를 구역(세분 구역)·시각별로 거듭 내보내서, 그대로 세면 "호우주의보 1건·호우경보 1건"이 4건으로 보인다.
 * 입력 순서(최신순)는 유지한다.
 */
export function dedupeWarnings(list: WarningEntry[]): WarningEntry[] {
  const latest = new Map<string, WarningEntry>()
  for (const e of list) {
    const key = `${e.regionLabel}:${e.wrn}:${e.lvl}`
    const prev = latest.get(key)
    if (!prev || e.tmFc > prev.tmFc) latest.set(key, e)
  }
  return list.filter((e) => latest.get(`${e.regionLabel}:${e.wrn}:${e.lvl}`) === e)
}
