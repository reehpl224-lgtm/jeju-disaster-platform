/**
 * USGS 최근 지진 — 키 없이 쓰는 무료 공개 GeoJSON 피드(CORS 허용). 규모 4.5 이상 최근 1주 중 동아시아·서태평양만 걸러
 * 지진해일 화면의 참고 지표로 쓴다. 국내 지진통보(기상청)가 아니며 지진해일 발생 판단에도 쓰지 않는다.
 */
export interface QuakeEvent {
  id: string
  /** epoch ms */
  time: number
  magnitude: number
  place: string
  lat: number
  lng: number
  depthKm: number
  /** USGS가 지진해일 가능성 경고를 붙인 사건 */
  tsunami: boolean
  url: string
  /** 제주(33.38N, 126.53E)까지 거리 */
  distanceKm: number
}

const FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"
const JEJU = { lat: 33.38, lng: 126.53 }
const BOX = { minLat: 20, maxLat: 50, minLng: 118, maxLng: 150 }
const TTL_MS = 10 * 60 * 1000

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

interface UsgsFeature {
  id: string
  properties: { mag: number; place: string; time: number; tsunami: number; url: string }
  geometry: { coordinates: [number, number, number] }
}

let cache: { at: number; promise: Promise<QuakeEvent[]> } | null = null

async function request(): Promise<QuakeEvent[]> {
  const res = await fetch(FEED)
  if (!res.ok) throw new Error(`USGS 지진 조회 실패 (HTTP ${res.status})`)
  const body = (await res.json()) as { features?: UsgsFeature[] }
  return (body.features ?? [])
    .map((f) => {
      const [lng, lat, depth] = f.geometry.coordinates
      return {
        id: f.id,
        time: f.properties.time,
        magnitude: f.properties.mag,
        place: f.properties.place,
        lat,
        lng,
        depthKm: depth,
        tsunami: f.properties.tsunami === 1,
        url: f.properties.url,
        distanceKm: Math.round(haversineKm(JEJU, { lat, lng })),
      }
    })
    .filter((q) => q.lat >= BOX.minLat && q.lat <= BOX.maxLat && q.lng >= BOX.minLng && q.lng <= BOX.maxLng)
    .sort((a, b) => b.time - a.time)
}

export function fetchEastAsiaQuakes(): Promise<QuakeEvent[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise
  const promise = request()
  cache = { at: Date.now(), promise }
  promise.catch(() => {
    cache = null
  })
  return promise
}
