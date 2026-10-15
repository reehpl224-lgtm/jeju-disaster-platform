import type { WarningEntry } from "../types/warningsApi"
import type { StageInput } from "./panelInputLogic"
import type { RiskLevel } from "../types/domain"
import { warnRisk } from "./warningLevel"

export type CardCounts = { caution: number; warning: number; alert: number; danger: number }
export interface CardReading {
  counts: CardCounts
  source: "input" | "warnings" | "sample" | "none"
  sourceLabel: string
  unavailable?: boolean
}
export type CardWarnings = { status: "loading" | "failed" } | { status: "ready"; entries: WarningEntry[] }
type SampleStage = { id: string; level: RiskLevel; count: number | null }

// 서비스 보드의 특보 코드와 동일. 특보는 최근 24시간 발표분이며 현재 발효 여부는 알 수 없다.
export const WARNING_CODES: Record<string, string[]> = {
  "heavy-rain": ["R", "W"], typhoon: ["T"], heat: ["H", "K"],
  wildfire: ["D", "W"], tsunami: ["N", "O"], snow: ["S", "C"],
  river: ["R", "W"], coast: ["V", "O", "N"],
}
const emptyCounts = (): CardCounts => ({ caution: 0, warning: 0, alert: 0, danger: 0 })

function stageCounts(level: RiskLevel | null | undefined, count: number | null | undefined): CardCounts {
  const counts = emptyCounts()
  if (level && level in counts && count != null) counts[level as keyof CardCounts] = count
  return counts
}

/** 입력한 빈 값·실제 0건은 유지한다. 데이터 자체가 없을 때만 기존 대응현황 샘플로 채운다. */
export function serviceCardReading(id: string, stages: StageInput[] | undefined, warnings: CardWarnings, samples: SampleStage[]): CardReading {
  if (stages !== undefined) {
    const stage = stages.find((s) => s.id === id)
    return {
      counts: stageCounts(stage?.level, stage?.count), source: "input", sourceLabel: "입력값",
      unavailable: stage?.level == null || stage?.count == null,
    }
  }
  const codes = WARNING_CODES[id]
  if (codes && warnings.status === "ready") {
    const counts = emptyCounts()
    const seen = new Set<string>()
    for (const entry of warnings.entries) {
      // 해제·변경으로 끝난 특보는 세지 않는다(state가 없는 옛 응답은 발효 중으로 본다)
      if (!codes.includes(entry.wrn) || (entry.lvl !== "2" && entry.lvl !== "3") || (entry.state && entry.state !== "active")) continue
      // 같은 종류·등급·지역의 반복 발표를 중복 집계하지 않는다(보드 특보 요약과 같은 단위).
      const key = `${entry.regionLabel ?? entry.regId}:${entry.wrn}:${entry.lvl}`
      if (seen.has(key)) continue
      seen.add(key)
      // 기상청 LVL: 2=주의보, 3=경보(1=예비특보는 세지 않는다)
      counts[warnRisk(entry.lvl, entry.wrn) === "alert" ? "alert" : "warning"]++
    }
    return { counts, source: "warnings", sourceLabel: "기상청 특보 · 발효 중" }
  }
  const sample = samples.find((s) => s.id === id)
  // 샘플을 넘기지 않는 환경(프로토타입·로컬)에서 받은 값이 없으면 숫자를 비워 둔다
  if (!sample) return { counts: emptyCounts(), source: "none", sourceLabel: codes && warnings.status === "loading" ? "조회 중" : "데이터 없음", unavailable: true }
  return {
    counts: stageCounts(sample?.level, sample?.count), source: "sample",
    sourceLabel: codes && warnings.status === "loading" ? "샘플 · 조회 중" : "샘플 · 데이터 없음",
  }
}
