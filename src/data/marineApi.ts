/**
 * 기상청 API허브 해양 종합 관측자료(sea_obs.php) 실시간 연동 — kma-weather-proxy(Vercel)의
 * /api/marine 경유. 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로 받아온다.
 *
 * 2026-09-09 실측으로 제주 인근 지점명을 직접 확인함(전국 지점을 받아 이름으로 필터) — 지어낸
 * 목록 아님. "협재"는 연안 3대 실증 대상지(함덕·삼양·협재) 중 하나와 정확히 일치하는 관측지점.
 */
import type { MarineStation } from "../types/marineApi"

const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

// 제주 인근으로 실측 확인된 지점명만 — 함덕·삼양과 정확히 같은 지점은 관측망에 없어서 근처
// 지점(김녕 등)까지만 참고용으로 포함. 정확 일치를 주장하지 않음.
const JEJU_STATION_NAMES = ["협재", "김녕", "서귀포", "성산포", "모슬포", "마라도", "추자도", "제주항"]

function toNum(v: string | undefined): number | null {
  if (v === undefined || v === "" || v.trim() === "") return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  // sea_obs.php는 결측값을 "-99" 같은 값으로 채워서 준다(2026-09-09 실측 확인) —
  // 이 단위들(m, m/s, ℃)에서 -90 이하는 나올 수 없으니 결측으로 처리.
  if (n <= -90) return null
  return n
}

export async function fetchMarineStations(): Promise<MarineStation[]> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  const res = await fetch(`${PROXY_URL}/api/marine`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 해양관측 조회 실패 (HTTP ${res.status})`)
  }
  const body = await res.json()
  const stations: Record<string, string>[] = body.stations ?? []
  const parsed: MarineStation[] = stations
    .filter((s) => JEJU_STATION_NAMES.includes((s.STN_KO ?? "").trim()))
    .map((s) => ({
      stnId: s.STN_ID,
      stnKo: (s.STN_KO ?? "").trim(),
      tm: s.TM,
      lat: Number(s.LAT),
      lon: Number(s.LON),
      waveHeightM: toNum(s.WH),
      windDirDeg: toNum(s.WD),
      windSpeedMs: toNum(s.WS),
      seaTempC: toNum(s.TW),
      airTempC: toNum(s.TA),
      pressureHpa: toNum(s.PA),
      humidityPercent: toNum(s.HM),
    }))
    // 값이 전부 결측인 지점은 보여줘도 의미가 없어서 제외.
    .filter((s) => s.waveHeightM !== null || s.windSpeedMs !== null || s.seaTempC !== null)

  // 같은 지명에 부이 종류가 여러 개 걸리는 경우(파고부이/해양부이/표류부이 등) — 값이 가장
  // 많이 채워진 것 하나만 대표로 남긴다.
  const filledCount = (s: MarineStation) => [s.waveHeightM, s.windSpeedMs, s.seaTempC, s.airTempC, s.pressureHpa].filter((v) => v !== null).length
  const byName = new Map<string, MarineStation>()
  for (const s of parsed) {
    const existing = byName.get(s.stnKo)
    if (!existing || filledCount(s) > filledCount(existing)) byName.set(s.stnKo, s)
  }
  return [...byName.values()]
}
