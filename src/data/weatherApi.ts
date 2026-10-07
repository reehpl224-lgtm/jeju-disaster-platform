/**
 * 기상청 단기예보 실시간 연동 — 이 파일만 mock이 아니라 실제 API 호출입니다.
 * (다른 src/data/mock*.ts와 달리 정적 더미데이터가 아니라 workers/kma-weather-proxy를
 * 통해 매 호출마다 기상청 공공데이터를 라이브로 받아옵니다.)
 */
import type { WeatherObservation } from "../types/incident"
import type { UltraNcstResponse, VilageForecastRegion, VilageForecastResponse } from "../types/weather"

// 배포 시 GitHub Actions 빌드 환경변수(VITE_WEATHER_PROXY_URL)로 실제 Worker 주소를 주입합니다.
// 값이 없으면(로컬에서 프록시를 아직 안 띄웠을 때 등) 호출을 시도하지 않고 명시적 에러를 던집니다.
const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

export const WEATHER_REGIONS: { key: VilageForecastRegion; label: string }[] = [
  { key: "jeju", label: "제주시" },
  { key: "seogwipo", label: "서귀포시" },
]

export const SKY_LABEL: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
}

export const PTY_LABEL: Record<string, string> = {
  "0": "없음",
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "4": "소나기",
}

export async function fetchVilageForecast(region: VilageForecastRegion): Promise<VilageForecastResponse> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  // 서버도 no-store라 브라우저 쪽도 맞춤 — 안 그러면 배포 초기 실수로 캐시됐던 응답(오래된
  // CORS 헤더 등)이 max-age 동안 로컬에 계속 남아 혼란을 준다(2026-09-09 실제로 겪음).
  const res = await fetch(`${PROXY_URL}/api/vilage-fcst?region=${region}`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 예보 조회 실패 (HTTP ${res.status})`)
  }
  return res.json()
}

export function formatSlotTime(date: string, time: string) {
  const month = date.slice(4, 6)
  const day = date.slice(6, 8)
  const hh = time.slice(0, 2)
  return `${Number(month)}/${Number(day)} ${hh}시`
}

/** 초단기실황(현재 날씨) — 종합상황 '제주도 · 현재 날씨'용. 매 정시 자료라 호출해도 값은 시간당 한 번 바뀐다. */
export async function fetchUltraNcst(region: VilageForecastRegion): Promise<UltraNcstResponse> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  const res = await fetch(`${PROXY_URL}/api/ultra-ncst?region=${region}`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 초단기실황 조회 실패 (HTTP ${res.status})`)
  }
  return res.json()
}

/** 초단기실황 응답 → 화면이 쓰는 현재 날씨. 기온·풍속·습도 중 하나라도 숫자가 아니면 null(관측값 없음으로 표시). */
export function toWeatherObservation(r: UltraNcstResponse): WeatherObservation | null {
  const temperatureC = Number(r.values.T1H)
  const windSpeedMs = Number(r.values.WSD)
  const humidityPercent = Number(r.values.REH)
  if (![temperatureC, windSpeedMs, humidityPercent].every(Number.isFinite)) return null
  // RN1은 강수가 없을 때 "강수없음" 같은 문구가 올 수 있어 숫자가 아니면 0mm로 본다
  const rain = Number(r.values.RN1)
  const d = r.baseDate
  const t = r.baseTime
  return {
    location: r.label,
    temperatureC,
    rainfallMm: Number.isFinite(rain) ? rain : 0,
    windSpeedMs,
    humidityPercent,
    observedAt: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:00+09:00`,
  }
}
