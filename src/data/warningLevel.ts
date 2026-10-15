import type { RiskLevel } from "../types/domain"
import type { WarningEntry } from "../types/warningsApi"

/**
 * 기상청 특보 LVL(wrn_met_data) — 1 예비특보 · 2 주의보 · 3 경보.
 * 프록시가 붙여 주는 lvlLabel은 쓰지 않고 여기서 이름과 등급을 정한다(프록시는 1=주의보·2=경보로 잘못 추정했었다).
 */
export const warnLvlLabel = (lvl: string) => ({ "1": "예비특보", "2": "주의보", "3": "경보" })[lvl] ?? lvl
// 4단계(정상·주의·경계·심각): 예비특보는 행안부 매뉴얼 기준으로 주의에 포함한다(관심 단계 없음, 2026-10-15)
export const warnLvlRisk = (lvl: string): RiskLevel => (lvl === "3" ? "alert" : "warning")

const RELEASE_CMD = new Set(["3", "4", "7"]) // 해제 · 대치해제 · 변경해제
const isActive = (e: WarningEntry) => !e.state || e.state === "active"
/** 지금 발효 중인 특보인가 — 해제 정보가 없는(옛 응답) 항목은 발효 중으로 본다 */
export const warnIsActive = isActive

/**
 * 기상청이 거듭 내보내는 발표 이력(발표·변경·해제)을 특보 한 건 한 건(구간)으로 풀어 낸다.
 * 구역·종류별로 시간순으로 훑어 — 발표/변경/대치는 새 구간을 열고(수준이 바뀌면 앞 구간은 "changed"로 끝남),
 * 해제(CMD 3·4·7)는 열려 있던 구간을 "released"로 닫는다. 같은 수준의 연장·재발표는 처음 발표를 유지한다.
 * 그 뒤 같은 시(제주시·서귀포시)·종류·수준은 하나만 남긴다(발효 중이면 그것, 없으면 가장 최근) — 최신순으로 돌려준다.
 * CMD가 하나도 없는 옛 응답이면 해제 여부를 모르므로 가장 최근 발표만 남기고 state는 비워 둔다.
 */
export function resolveWarnings(list: WarningEntry[]): WarningEntry[] {
  const kind = (e: WarningEntry) => `${e.regionLabel}:${e.wrn}:${e.lvl}`
  if (!list.some((e) => e.cmd)) {
    const latest = new Map<string, WarningEntry>()
    for (const e of list) if (!latest.has(kind(e)) || e.tmFc > latest.get(kind(e))!.tmFc) latest.set(kind(e), e)
    return list.filter((e) => latest.get(kind(e)) === e)
  }
  const zones = new Map<string, WarningEntry[]>()
  for (const e of list) zones.set(`${e.regId}:${e.wrn}`, [...(zones.get(`${e.regId}:${e.wrn}`) ?? []), e])
  const spans: WarningEntry[] = []
  for (const rows of zones.values()) {
    let cur: WarningEntry | null = null
    for (const e of [...rows].sort((a, b) => a.tmFc.localeCompare(b.tmFc))) {
      if (e.cmd && RELEASE_CMD.has(e.cmd)) {
        // 열려 있던 구간을 닫는다. 24시간 창 앞에서 발표된 특보의 해제면 해제 기록만 남긴다
        spans.push({ ...(cur ?? e), state: "released", endAt: e.tmFc })
        cur = null
      } else if (cur && cur.lvl !== e.lvl) {
        spans.push({ ...cur, state: "changed", endAt: e.tmFc, changedLvl: e.lvl })
        cur = e
      } else if (!cur) cur = e
    }
    if (cur) spans.push({ ...cur, state: "active" })
  }
  const best = new Map<string, WarningEntry>()
  for (const s of spans) {
    const p = best.get(kind(s))
    if (!p || (isActive(s) && !isActive(p)) || (isActive(s) === isActive(p) && s.tmFc > p.tmFc)) best.set(kind(s), s)
  }
  return [...best.values()].sort((a, b) => b.tmFc.localeCompare(a.tmFc))
}
