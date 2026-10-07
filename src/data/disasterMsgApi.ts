/**
 * 긴급재난문자(제주 수신분) — kma-weather-proxy의 /api/disaster-msg 경유(행정안전부 재난안전데이터공유플랫폼 DSSP-IF-00247).
 * 프록시가 마지막 쪽들만 받아 제주 문자만 추려 준다. 키(SAFETYDATA_MSG_KEY)는 프록시 쪽에만 있다.
 */
const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

export interface DisasterMsg {
  id: string
  /** ISO(+09:00) */
  at: string
  region: string
  /** 안전안내 | 긴급재난 | 위급재난 */
  step: string
  /** 재난 구분(기타·호우·태풍·화재 등) */
  kind: string
  text: string
}

export async function fetchDisasterMessages(days = 14): Promise<DisasterMsg[]> {
  if (!PROXY_URL) throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다.")
  const res = await fetch(`${PROXY_URL}/api/disaster-msg?days=${days}`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `긴급재난문자 조회 실패 (HTTP ${res.status})`)
  }
  const body = (await res.json()) as { messages?: DisasterMsg[] }
  return Array.isArray(body.messages) ? body.messages : []
}
