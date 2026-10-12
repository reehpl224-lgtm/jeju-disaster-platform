/**
 * 기상청 API허브 방재기상관측(AWS) 매분자료 실시간 연동 — kma-weather-proxy(Vercel)의
 * /api/rainfall 경유. 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로
 * 받아온다.
 *
 * 효돈천(돈내코·쇠소깍)과 정확히 같은 이름의 AWS 지점은 없음 — 2026-09-09에
 * www.kma.go.kr/cgi-bin/aws/nph-aws_txt_min(지점 목록, 인증키 불필요)로 직접 확인한
 * 가장 가까운 저지대 지점만 참고용으로 씀. 지어낸 지점번호 아님.
 *
 * 2026-09-28: 프록시(vercel-proxy/kma-weather-proxy/api/rainfall.ts)가 원래부터 받아오던
 * 원본 응답에 WD10/WS10(10분 평균 풍향·풍속) 필드가 이미 있었는데 파싱을 안 하고 버리고
 * 있던 걸 발견해 windSpeedMs/windDirDeg로 추가 노출함 — 새 API 신청이나 지점 조회 없이
 * 기존에 받아오던 값만 더 꺼내 쓴 것.
 */
import type { RainfallStation } from "../types/rainfallApi"

const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

const RIVER_REFERENCE_STATIONS: { stnId: string; label: string }[] = [
  { stnId: "189", label: "서귀포 (효돈천 하류 인근 참고)" },
  { stnId: "780", label: "제주남원 (효돈천 동측 인근 참고)" },
]

function toNum(v: string | undefined): number | null {
  if (v === undefined || v === "") return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  if (n <= -90) return null // AWS 매분자료 결측 sentinel(-99.9)
  return n
}

/**
 * 제주시 시가지 주변 AWS 지점 — 기상청 공개 지점 목록(www.kma.go.kr/cgi-bin/aws/nph-aws_txt_min)의 주소로 2026-10-12 확인했다.
 * 같은 /api/rainfall 응답(전 지점, stn=0)에 이미 들어 있어 지점 번호만 추가했다. 지점 이름은 API가 안 줘서 주소(동)로 붙인다.
 */
const JEJU_CITY_STATIONS: { stnId: string; label: string }[] = [
  { stnId: "184", label: "제주 (건입동)" },
  { stnId: "182", label: "제주공항 (용담이동)" },
  { stnId: "329", label: "산천단 (아라일동)" },
  { stnId: "863", label: "외도 (외도일동)" },
]

// 같은 응답을 여러 화면이 거의 동시에 쓰므로 20초 동안 한 번만 받는다
let cache: { at: number; promise: Promise<Map<string, Record<string, string>>> } | null = null
function rawStations(): Promise<Map<string, Record<string, string>>> {
  if (cache && Date.now() - cache.at < 20_000) return cache.promise
  if (!PROXY_URL) {
    return Promise.reject(new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요."))
  }
  const promise = fetch(`${PROXY_URL}/api/rainfall`, { cache: "no-store" }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? `기상청 우량 관측 조회 실패 (HTTP ${res.status})`)
    }
    const body = await res.json()
    const stations: Record<string, string>[] = body.stations ?? []
    return new Map(stations.map((s) => [s.STN, s]))
  })
  cache = { at: Date.now(), promise }
  // 실패하거나 지점이 하나도 없으면(업스트림 일시 오류) 캐시하지 않는다
  promise.then((m) => m.size === 0 && (cache = null)).catch(() => (cache = null))
  return promise
}

function toStations(byId: Map<string, Record<string, string>>, list: { stnId: string; label: string }[]): RainfallStation[] {
  return list.map(({ stnId, label }) => {
    const s = byId.get(stnId)
    return {
      stnId,
      label,
      tm: s?.TM ?? "",
      tempC: toNum(s?.TA),
      rain15mMm: toNum(s?.RN15m),
      rain60mMm: toNum(s?.RN60m),
      rain12hMm: toNum(s?.RN12H),
      rainDayMm: toNum(s?.RNDAY),
      humidityPercent: toNum(s?.HM),
      windSpeedMs: toNum(s?.WS10),
      windDirDeg: toNum(s?.WD10),
    }
  })
}

/**
 * 폭염 체감온도 센서로 쓰는 기상청 종관(ASOS) 4지점 — 제주·고산·성산·서귀포. 같은 응답의 기온(TA)·습도(HM)를 쓴다.
 * 좌표는 기상청 지점 위치(공개 값) — 지점 번호는 공개 지점 목록의 주소(건입동·한경면 고산리·성산읍 신산리·서귀동)로 확인했다.
 */
const HEAT_SENSOR_STATIONS: { stnId: string; label: string; lat: number; lng: number }[] = [
  { stnId: "184", label: "제주", lat: 33.5141, lng: 126.5297 },
  { stnId: "185", label: "고산", lat: 33.2938, lng: 126.1628 },
  { stnId: "188", label: "성산", lat: 33.3866, lng: 126.8802 },
  { stnId: "189", label: "서귀포", lat: 33.2461, lng: 126.5653 },
]
export type HeatSensor = RainfallStation & { lat: number; lng: number }
export async function fetchHeatSensors(): Promise<HeatSensor[]> {
  const rows = toStations(await rawStations(), HEAT_SENSOR_STATIONS)
  return rows.map((r, i) => ({ ...r, lat: HEAT_SENSOR_STATIONS[i].lat, lng: HEAT_SENSOR_STATIONS[i].lng }))
}

/**
 * AWS 지점 위치 — 기상청 응답에는 좌표가 없어 지도용으로 따로 둔다. 제주(184)·서귀포(189)는 종관 지점의 공개 좌표이고,
 * 나머지는 지점 주소(동·리) 기준 근사 위치다(approx) — 점 설명에 그렇게 적는다. 지점 이름은 기상청 공개 지점 목록(2026-10-12)에서 확인했다.
 */
export const AWS_POSITIONS: Record<string, { lat: number; lng: number; approx?: boolean; name: string }> = {
  "184": { name: "제주", lat: 33.5141, lng: 126.5297 },
  "189": { name: "서귀포", lat: 33.2461, lng: 126.5653 },
  "182": { name: "제주공항", lat: 33.5113, lng: 126.493, approx: true },
  "329": { name: "산천단", lat: 33.434, lng: 126.559, approx: true },
  "863": { name: "외도", lat: 33.4868, lng: 126.4331, approx: true },
  "780": { name: "제주남원", lat: 33.2799, lng: 126.7126, approx: true },
}

/** 서귀포시 쪽 — 효돈천 인근 참고 2지점 */
export async function fetchRiverReferenceRainfall(): Promise<RainfallStation[]> {
  return toStations(await rawStations(), RIVER_REFERENCE_STATIONS)
}

/** 제주시 쪽 — 시가지 주변 4지점 */
export async function fetchJejuCityRainfall(): Promise<RainfallStation[]> {
  return toStations(await rawStations(), JEJU_CITY_STATIONS)
}
