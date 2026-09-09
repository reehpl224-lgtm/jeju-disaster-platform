/** 기상청 API허브 방재기상관측(AWS) 매분자료(nph-aws2_min) 실시간 연동 — kma-weather-proxy(Vercel)의 /api/rainfall 경유 */

export interface RainfallStation {
  stnId: string
  label: string // 지점명(코드에서 직접 매핑, API가 이름을 안 줌)
  tm: string // 관측시각(KST, YYYYMMDDHHmm)
  tempC: number | null
  rain15mMm: number | null
  rain60mMm: number | null
  rain12hMm: number | null
  rainDayMm: number | null
  humidityPercent: number | null
}
