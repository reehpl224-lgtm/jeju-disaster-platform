/**
 * 기상청 API허브 태풍정보 실시간 연동 — kma-weather-proxy(Vercel)의 /api/typhoon 경유.
 * 다른 mock*.ts와 달리 정적 더미데이터가 아니라 매 호출마다 라이브로 받아온다.
 *
 * typ_lst.php(연도별 태풍 이름 목록)만 실연동 — typ_now.php/typ_data.php(실시간 위치·경로·기압·풍속)는
 * data.go.kr 서비스키와 별개로 apihub.kma.go.kr 자체 활용신청 승인이 필요한데 2026-09-09 확인 결과
 * "활용신청이 필요한 API입니다"(HTTP 403)로 아직 막혀있다 — 승인 후 이 파일에 추가할 것.
 * 그래서 /typhoon 페이지의 실시간 위치·이동속도·기압·풍속은 여전히 mockTyphoon.ts(더미데이터)를 쓴다.
 */
import type { TyphoonNameEntry } from "../types/typhoonApi"

const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

export async function fetchTyphoonNameList(): Promise<TyphoonNameEntry[]> {
  if (!PROXY_URL) {
    throw new Error("VITE_WEATHER_PROXY_URL이 설정되지 않았습니다 — .env에 kma-weather-proxy 배포 주소를 넣어주세요.")
  }
  const res = await fetch(`${PROXY_URL}/api/typhoon?variant=lst`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `기상청 태풍 이름 목록 조회 실패 (HTTP ${res.status})`)
  }
  const body = await res.json()
  const rows: string[][] = body.rows ?? []
  // typ_lst.php 컬럼 순서: YY, SEQ, NOW, EFF, TM_ST(UTC), TM_ED(UTC), TYP_NAME, TYP_EN, REM
  return rows.map((r) => ({
    year: r[0],
    seq: r[1],
    tmStUtc: r[4],
    tmEdUtc: r[5],
    nameKo: r[6],
    nameEn: r[7],
    note: r[8],
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
