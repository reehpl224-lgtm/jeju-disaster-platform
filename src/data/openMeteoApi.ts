/**
 * Open-Meteo 시간별 예보 — 키 없이 쓰는 무료 공개 API(CORS 허용). 산불(습도·풍속)·대설(적설·기온) 화면의 참고 지표용이다.
 * 기상청·산림청의 공식 발표가 아니므로 화면에는 "참고" 표식과 함께 쓰고, 위험등급 판정에는 쓰지 않는다.
 */
export interface HourlyWeather {
  /** "2026-10-02T14:00" (Asia/Seoul) */
  time: string
  temperatureC: number
  humidityPercent: number
  windMs: number
  snowfallCm: number
  snowDepthM: number
}

export const OPEN_METEO_SITES = {
  jeju: { label: "제주시", lat: 33.5, lng: 126.53 },
  halla: { label: "한라산", lat: 33.36, lng: 126.53 },
} as const
export type OpenMeteoSite = keyof typeof OPEN_METEO_SITES

const TTL_MS = 10 * 60 * 1000
const cache = new Map<OpenMeteoSite, { at: number; promise: Promise<HourlyWeather[]> }>()

async function request(site: OpenMeteoSite): Promise<HourlyWeather[]> {
  const { lat, lng } = OPEN_METEO_SITES[site]
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,snowfall,snow_depth" +
    "&past_days=1&forecast_days=3&timezone=Asia%2FSeoul&wind_speed_unit=ms"
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo 예보 조회 실패 (HTTP ${res.status})`)
  const body = (await res.json()) as { hourly?: Record<string, (number | string | null)[]> }
  const h = body.hourly
  if (!h?.time) throw new Error("Open-Meteo 응답 형식이 올바르지 않습니다.")
  const n = (arr: (number | string | null)[] | undefined, i: number) => (typeof arr?.[i] === "number" ? (arr[i] as number) : 0)
  return h.time.map((t, i) => ({
    time: String(t),
    temperatureC: n(h.temperature_2m, i),
    humidityPercent: n(h.relative_humidity_2m, i),
    windMs: n(h.wind_speed_10m, i),
    snowfallCm: n(h.snowfall, i),
    snowDepthM: n(h.snow_depth, i),
  }))
}

/** 같은 지점은 10분 동안 한 번만 호출한다(보드·상세·분석 화면이 같이 쓴다) */
export function fetchOpenMeteo(site: OpenMeteoSite): Promise<HourlyWeather[]> {
  const hit = cache.get(site)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const promise = request(site)
  cache.set(site, { at: Date.now(), promise })
  promise.catch(() => cache.delete(site))
  return promise
}

/** 지금 시각 이후 hours시간 — 예보 구간만 잘라 차트·요약에 쓴다 */
export function upcoming(series: HourlyWeather[], hours = 48, now = new Date()): HourlyWeather[] {
  const pad = (v: number) => String(v).padStart(2, "0")
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
  const start = Math.max(0, series.findIndex((p) => p.time >= key))
  return series.slice(start, start + hours)
}
