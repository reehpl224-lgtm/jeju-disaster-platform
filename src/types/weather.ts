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

/** kma-weather-proxy /api/ultra-ncst 응답 — 기상청 초단기실황(getUltraSrtNcst, 명세서 EXT-KMA-001) */
export interface UltraNcstResponse {
  region: VilageForecastRegion
  label: string
  baseDate: string // YYYYMMDD
  baseTime: string // HHMM (정시)
  values: Partial<{
    T1H: string // 기온(℃)
    RN1: string // 1시간 강수량(mm) — 강수 없음이면 숫자가 아닌 문구일 수 있다
    WSD: string // 풍속(m/s)
    REH: string // 습도(%)
    PTY: string // 강수형태 코드
    VEC: string // 풍향(deg)
  }>
}
