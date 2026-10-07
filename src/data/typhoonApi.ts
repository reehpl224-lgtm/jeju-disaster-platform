/**
 * 기상청 API허브 태풍정보 실시간 연동 — kma-weather-proxy(Vercel)의 /api/typhoon 경유.
 * 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로 받아온다.
 *
 * 2026-09-09: typ_lst.php(이름 목록)에 이어 typ_now.php(실시간 위치·기압·풍속+예측)도
 * apihub.kma.go.kr 활용신청 승인 완료 — 둘 다 실연동됨. 진행 중인 태풍이 없으면 typhoons가
 * 빈 배열인 게 정상(더미데이터로 대체하지 않음 — "지금은 없음"이 실제 상태).
 */
import type { TyphoonNameEntry, TyphoonNowEntry } from "../types/typhoonApi"

const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

function requireProxyUrl() {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  return PROXY_URL
}

export async function fetchTyphoonNameList(): Promise<TyphoonNameEntry[]> {
  const proxy = requireProxyUrl()
  const res = await fetch(`${proxy}/api/typhoon?mode=list`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 태풍 이름 목록 조회 실패 (HTTP ${res.status})`)
  }
  const body = await res.json()
  const rows: Record<string, string>[] = body.typhoons ?? []
  return rows.map((r) => ({
    year: r.YY,
    seq: r.SEQ,
    tmStUtc: r.TM_ST,
    tmEdUtc: r.TM_ED,
    nameKo: r.TYP_NAME,
    nameEn: r.TYP_EN,
    note: r.REM,
  }))
}

/** 현재 진행 중인 태풍의 실시간 위치·기압·풍속(+예측). 없으면 빈 배열. */
export async function fetchTyphoonNow(): Promise<TyphoonNowEntry[]> {
  const proxy = requireProxyUrl()
  const res = await fetch(`${proxy}/api/typhoon`, { cache: "no-store" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 태풍 실시간 정보 조회 실패 (HTTP ${res.status})`)
  }
  const body = await res.json()
  const rows: Record<string, string>[] = body.typhoons ?? []
  return rows.map((r) => ({
    ft: r.FT,
    year: r.YY,
    typ: r.TYP,
    seq: r.SEQ,
    typTmUtc: r.TYP_TM,
    ftTmUtc: r.FT_TM,
    lat: r.LAT,
    lon: r.LON,
    dir: r.DIR,
    speedKmh: r.SP,
    pressureHpa: r.PS,
    maxWindMs: r.WS,
    rad15Km: r.RAD15,
    rad25Km: r.RAD25,
  }))
}

/** "YYYYMMDDHHmm"(UTC) → Date */
function parseUtc(s: string): Date {
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:00Z`)
}

export function isActiveNow(entry: TyphoonNameEntry, now = new Date()): boolean {
  return now >= parseUtc(entry.tmStUtc) && now <= parseUtc(entry.tmEdUtc)
}

/** UTC 문자열을 KST(UTC+9) 표시용으로 변환 */
export function formatKst(utcStr: string): string {
  const d = parseUtc(utcStr)
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`
}
