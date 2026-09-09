/** kma-weather-proxy(workers/kma-weather-proxy) 응답 타입 — 기상청 단기예보(getVilageFcst) 실시간 연동 */

export type VilageForecastRegion = "jeju" | "seogwipo"

export interface VilageForecastSlot {
  date: string // YYYYMMDD
  time: string // HHMM
  values: Partial<{
    TMP: string // 기온(℃)
    POP: string // 강수확률(%)
    SKY: string // 하늘상태 코드
    PTY: string // 강수형태 코드
    REH: string // 습도(%)
    WSD: string // 풍속(m/s)
  }>
}

export interface VilageForecastResponse {
  region: VilageForecastRegion
  label: string
  nx: number
  ny: number
  slots: VilageForecastSlot[]
}
