import type { WarningEntry } from "../types/warningsApi"
import type { StageInput } from "./panelInputLogic"
import type { RiskLevel } from "../types/domain"

export type CardCounts = { caution: number; warning: number; alert: number; danger: number }
export interface CardReading {
  counts: CardCounts
  source: "input" | "warnings" | "sample"
  sourceLabel: string
  unavailable?: boolean
}
export type CardWarnings = { status: "loading" | "failed" } | { status: "ready"; entries: WarningEntry[] }
type SampleStage = { id: string; level: RiskLevel; count: number | null }

// 서비스 보드의 특보 코드와 동일. 특보는 최근 24시간 발표분이며 현재 발효 여부는 알 수 없다.
const WARNING_CODES: Record<string, string[]> = {
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
      if (!codes.includes(entry.wrn) || (entry.lvl !== "1" && entry.lvl !== "2")) continue
      // 같은 종류·등급·지역의 반복 발표를 중복 집계하지 않는다(보드 특보 요약과 같은 단위).
      const key = `${entry.regId}:${entry.wrn}:${entry.lvl}`
      if (seen.has(key)) continue
      seen.add(key)
      counts[entry.lvl === "2" ? "alert" : "warning"]++
    }
    return { counts, source: "warnings", sourceLabel: "특보 발표 · 24시간" }
  }
  const sample = samples.find((s) => s.id === id)
  return {
    counts: stageCounts(sample?.level, sample?.count), source: "sample",
    sourceLabel: codes && warnings.status === "loading" ? "샘플 · 조회 중" : "샘플 · 데이터 없음",
  }
}
