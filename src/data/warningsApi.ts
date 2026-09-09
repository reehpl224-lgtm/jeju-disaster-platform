/**
 * 기상청 API허브 기상특보 실시간 연동 — kma-weather-proxy(Vercel)의 /api/warnings 경유.
 * 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로 받아온다.
 *
 * wrn_met_data.php는 "현재 발효 중" 플래그를 안 줘서, 프록시가 최근 24시간 발표분만 추려서
 * 준다 — 그래서 이 데이터는 "최근 발표된 특보"로 표시하고 "지금 발효 중"이라고 단정하지 않는다.
 */
import type { WarningsResponse } from "../types/warningsApi"

const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

export async function fetchJejuWarnings(): Promise<WarningsResponse> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  const res = await fetch(`${PROXY_URL}/api/warnings`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 특보 조회 실패 (HTTP ${res.status})`)
  }
  return res.json()
}
