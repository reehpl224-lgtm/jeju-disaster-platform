/**
 * 기상청 API허브 방재기상관측(AWS) 매분자료 실시간 연동 — kma-weather-proxy(Vercel)의
 * /api/rainfall 경유. 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로
 * 받아온다.
 *
 * 효돈천(돈내코·쇠소깍)과 정확히 같은 이름의 AWS 지점은 없음 — 2026-09-09에
 * www.kma.go.kr/cgi-bin/aws/nph-aws_txt_min(지점 목록, 인증키 불필요)로 직접 확인한
 * 가장 가까운 저지대 지점만 참고용으로 씀. 지어낸 지점번호 아님.
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

export async function fetchRiverReferenceRainfall(): Promise<RainfallStation[]> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  const res = await fetch(`${PROXY_URL}/api/rainfall`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 우량 관측 조회 실패 (HTTP ${res.status})`)
  }
  const body = await res.json()
  const stations: Record<string, string>[] = body.stations ?? []
  const byId = new Map(stations.map((s) => [s.STN, s]))

  return RIVER_REFERENCE_STATIONS.map(({ stnId, label }) => {
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
    }
  })
}
