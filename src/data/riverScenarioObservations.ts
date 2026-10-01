import type { RiskLevel } from "../types/domain"
import type { RiverRunState, RiverTimelinePoint } from "../types/riverRun"
import { classifyRiverRisk, riverLevelRank } from "./riverAlertThresholds"

const HOURLY_RATE_MM: Record<RiskLevel, number> = {
  safe: 0,
  caution: 3,
  warning: 8,
  alert: 15,
  danger: 25,
  info: 0,
  offline: 0,
}

const RADAR_BY_LEVEL: Record<RiskLevel, string> = {
  safe: "강우대 없음",
  caution: "약한 강우대",
  warning: "강우대 유입",
  alert: "강한 강우대",
  danger: "매우 강한 강우대",
  info: "정보 없음",
  offline: "정보 없음",
}

const SATURATION_FLOOR: Record<RiskLevel, number> = {
  safe: 35,
  caution: 48,
  warning: 62,
  alert: 76,
  danger: 88,
  info: 35,
  offline: 35,
}

const round1 = (n: number) => Math.round(n * 10) / 10

function elapsedHours(from: string, to: string) {
  const start = new Date(from.replace(" ", "T")).getTime()
  const end = new Date(to.replace(" ", "T")).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return (end - start) / 3_600_000
}

function worstPoint(points: RiverTimelinePoint[]): RiverTimelinePoint {
  return points.reduce((worst, point) => (point.flowRatioPercent > worst.flowRatioPercent ? point : worst))
}

function batchWorstLevel(points: RiverTimelinePoint[]): RiskLevel {
  return points.reduce<RiskLevel>((worst, point) => {
    const level = classifyRiverRisk(point.flowRatioPercent)
    return riverLevelRank(level) > riverLevelRank(worst) ? level : worst
  }, "safe")
}

function processedBatches(run: RiverRunState): RiverTimelinePoint[][] {
  if (run.playheadIndex < 0) return []
  const batches: RiverTimelinePoint[][] = []
  for (const point of run.timeline.slice(0, run.playheadIndex + 1)) {
    const last = batches.at(-1)
    if (last?.[0]?.observedAt === point.observedAt) last.push(point)
    else batches.push([point])
  }
  return batches
}

function trendLabel(current: number, previous: number | null, unit = "") {
  if (previous === null) return "첫 관측"
  const delta = round1(current - previous)
  if (delta === 0) return "변화 없음"
  return `${delta > 0 ? "상승" : "하락"} ${Math.abs(delta)}${unit}`
}

function saturationGrade(percent: number) {
  if (percent < 45) return "낮음"
  if (percent < 65) return "보통"
  if (percent < 80) return "높음"
  return "매우 높음"
}

export interface RiverScenarioObservation {
  observedAt: string
  currentLevel: RiskLevel
  leadLocation: RiverTimelinePoint["location"]
  flowRatioPercent: number
  previousFlowRatioPercent: number | null
  flowTrend: string
  rainfallHourlyMm: number
  rainfallDayMm: number
  rainfallTrend: string
  radarLabel: string
  saturationPercent: number
  saturationGrade: string
}

/**
 * Q% 시나리오에서 화면용 주변 모의 관측을 결정적으로 계산한다.
 * 실제 수위(m)나 실제 센서값으로 환산하지 않으며, 위험등급 판정의 소스도 계속 Q% 하나뿐이다.
 */
export function deriveRiverScenarioObservation(run: RiverRunState): RiverScenarioObservation | null {
  const batches = processedBatches(run)
  if (batches.length === 0) return null

  let rainfallDayMm = 0
  let previousRainfallHourlyMm: number | null = null
  let saturationFloor = SATURATION_FLOOR.safe
  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index]
    const batchLevel = batchWorstLevel(batch)
    const hourly = HOURLY_RATE_MM[batchLevel]
    // 각 관측은 직전 관측 이후 구간을 대표한다. 10분·15분·30분 등 엑셀의 실제 간격을 그대로 적분한다.
    if (index > 0) rainfallDayMm += hourly * elapsedHours(batches[index - 1][0].observedAt, batch[0].observedAt)
    saturationFloor = Math.max(saturationFloor, SATURATION_FLOOR[batchLevel])
    if (batch !== batches.at(-1)) previousRainfallHourlyMm = hourly
  }

  const currentBatch = batches.at(-1)!
  const previousBatch = batches.at(-2)
  const lead = worstPoint(currentBatch)
  const previousRatio = previousBatch ? worstPoint(previousBatch).flowRatioPercent : null
  const currentLevel = batchWorstLevel(currentBatch)
  const rainfallHourlyMm = HOURLY_RATE_MM[currentLevel]
  // 배수·건조 모형이 없는 1차년도 시연에서는 같은 실행 안에서 포화도가 역행하지 않게 누적한다.
  const saturationPercent = Math.min(98, Math.max(saturationFloor, round1(35 + rainfallDayMm * 0.8)))

  return {
    observedAt: lead.observedAt,
    currentLevel,
    leadLocation: lead.location,
    flowRatioPercent: lead.flowRatioPercent,
    previousFlowRatioPercent: previousRatio,
    flowTrend: trendLabel(lead.flowRatioPercent, previousRatio, "%p"),
    rainfallHourlyMm,
    rainfallDayMm: round1(rainfallDayMm),
    rainfallTrend: trendLabel(rainfallHourlyMm, previousRainfallHourlyMm, "mm/h"),
    radarLabel: RADAR_BY_LEVEL[currentLevel],
    saturationPercent,
    saturationGrade: saturationGrade(saturationPercent),
  }
}

/** 오른쪽 모의 우량 패널과 위험 근거 카드가 같은 시나리오 계산값을 사용하도록 하는 공통 변환. */
export function deriveRiverScenarioWeather(run: RiverRunState, stationOffset = 0) {
  const observation = deriveRiverScenarioObservation(run)
  if (!observation) {
    return { tm: "", tempC: null, rain60mMm: null, rainDayMm: null, humidityPercent: null, windSpeedMs: null, windDirDeg: null }
  }
  const rank = riverLevelRank(observation.currentLevel)
  return {
    tm: observation.observedAt.replace(/[-: ]/g, ""),
    tempC: round1(22 - rank * 1.2 + stationOffset),
    rain60mMm: round1(observation.rainfallHourlyMm + stationOffset),
    rainDayMm: round1(observation.rainfallDayMm + stationOffset),
    humidityPercent: Math.min(99, 55 + rank * 10),
    windSpeedMs: round1(1.5 + rank * 1.8),
    windDirDeg: 180 + rank * 20,
  }
}
