import type { RiverRunState, RiverTimelinePoint } from "../types/riverRun"

export interface RiverFlowRatioChartPoint {
  observedAt: string
  time: string
  donnaeko?: number
  soesokkak?: number
}

/** 현재 재생 시각까지의 Q% 관측만 사용한다. 지점별 다음 관측 전에는 직전 값을 유지한다. */
export function riverFlowRatioAnalysis(run: RiverRunState) {
  const series: RiverFlowRatioChartPoint[] = []
  const latest: Record<RiverTimelinePoint["location"], RiverTimelinePoint | undefined> = {
    돈내코: undefined,
    쇠소깍: undefined,
  }

  for (const point of run.timeline.slice(0, run.playheadIndex + 1)) {
    latest[point.location] = point
    let row = series.at(-1)
    if (!row || row.observedAt !== point.observedAt) {
      row = {
        observedAt: point.observedAt,
        time: point.observedAt.slice(5),
        donnaeko: latest.돈내코?.flowRatioPercent,
        soesokkak: latest.쇠소깍?.flowRatioPercent,
      }
      series.push(row)
    }
    if (point.location === "돈내코") row.donnaeko = point.flowRatioPercent
    else row.soesokkak = point.flowRatioPercent
  }

  return { series, latest }
}
