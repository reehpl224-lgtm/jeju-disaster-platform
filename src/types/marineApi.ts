/** 기상청 API허브 해양 종합 관측자료(sea_obs.php) 실시간 연동 — kma-weather-proxy(Vercel)의 /api/marine 경유 */

export interface MarineStation {
  stnId: string
  stnKo: string
  tm: string // 관측시각(KST, YYYYMMDDHHmm)
  lat: number
  lon: number
  waveHeightM: number | null // 유의파고(WH)
  windDirDeg: number | null
  windSpeedMs: number | null
  seaTempC: number | null // TW
  airTempC: number | null // TA
  pressureHpa: number | null
  humidityPercent: number | null
}
