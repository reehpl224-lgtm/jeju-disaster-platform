import type { RiskMarker } from "../types/domain"
import type { HeatShelter } from "../types/heat"

/**
 * 폭염 지도 점 — 행정안전부 무더위쉼터 자료에는 좌표가 없어(주소만) 쉼터를 한 곳씩 찍을 수 없다.
 * 대신 주소에 읍·면 이름이 있는 쉼터는 그 읍·면의 대표점(아래 근사 좌표)에 개수로 모아 찍고, 동 지역(도로명 주소만 있는 곳)은 해당 시청 위치에 모은다.
 * 대표점은 읍·면 중심의 근사 위치이며 쉼터의 실제 위치가 아니다 — 점 이름·값에 그렇게 적는다. 정확한 위치는 주소→좌표 변환(지오코딩)이 필요하다.
 */
const EUPMYEON: Record<string, { lat: number; lng: number }> = {
  한림읍: { lat: 33.4136, lng: 126.2688 },
  애월읍: { lat: 33.4637, lng: 126.3319 },
  구좌읍: { lat: 33.5226, lng: 126.8553 },
  조천읍: { lat: 33.5434, lng: 126.6372 },
  한경면: { lat: 33.3376, lng: 126.1895 },
  추자면: { lat: 33.9526, lng: 126.2979 },
  우도면: { lat: 33.5046, lng: 126.9519 },
  남원읍: { lat: 33.2789, lng: 126.72 },
  대정읍: { lat: 33.2237, lng: 126.2523 },
  성산읍: { lat: 33.4372, lng: 126.9093 },
  안덕면: { lat: 33.2554, lng: 126.3256 },
  표선면: { lat: 33.326, lng: 126.834 },
}
const CITY_HALL: Record<string, { lat: number; lng: number }> = { 제주시: { lat: 33.4996, lng: 126.5312 }, 서귀포시: { lat: 33.2541, lng: 126.5601 } }

export function shelterMarkers(shelters: HeatShelter[], domain: RiskMarker["domain"]): RiskMarker[] {
  const groups = new Map<string, { name: string; lat: number; lng: number; n: number }>()
  for (const s of shelters) {
    const city = s.region
    const area = s.address.split(" ").find((t, i) => i > 0 && i < 3 && EUPMYEON[t] !== undefined)
    const pos = area ? EUPMYEON[area] : CITY_HALL[city]
    if (!pos) continue
    const key = area ? `${city} ${area}` : `${city} 동 지역`
    const g = groups.get(key) ?? { name: key, lat: pos.lat, lng: pos.lng, n: 0 }
    g.n++
    groups.set(key, g)
  }
  return [...groups.values()].map((g) => ({
    id: `shelter-${g.name}`,
    name: `${g.name} 무더위쉼터 ${g.n}곳`,
    x: 0,
    y: 0,
    level: "safe",
    domain,
    lat: g.lat,
    lng: g.lng,
    value: "대표점(근사) — 행안부 쉼터 자료에 좌표 없음",
  }))
}
