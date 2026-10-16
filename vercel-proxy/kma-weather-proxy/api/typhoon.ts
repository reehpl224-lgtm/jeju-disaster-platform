/**
 * 기상청 API허브 태풍정보 프록시 — /typhoon 페이지의 mockTyphoon.ts를 실시간으로 대체하기
 * 위한 용도. data.go.kr 서비스키(KMA_SERVICE_KEY)와는 별개로 apihub.kma.go.kr 자체
 * 인증키(KMA_APIHUB_KEY)가 필요하다.
 *
 * 기본(mode 없음): typ_now.php — 현재 진행 중인 태풍의 실시간 위치/기압/풍속(+예측).
 *                  진행 중인 태풍이 없으면 빈 배열이 정상(2026-09-09 실측 — 제24호 크로반이
 *                  9/7 종료돼서 지금은 없음).
 * mode=list:       typ_lst.php — 해당 연도 태풍 발표 이력(이름/기간). 최근 태풍 참고용.
 *
 * 원본 API는 EUC-KR 인코딩의 콤마구분(disp=1) 텍스트를 반환한다(JSON 아님).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { fetchUpstream, staleCache } from "../lib/upstream"

const TYP_NOW_URL = "https://apihub.kma.go.kr/api/typ01/url/typ_now.php"
const TYP_LST_URL = "https://apihub.kma.go.kr/api/typ01/url/typ_lst.php"

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function parseDelimitedText(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split(",").map((v) => v.trim()))
}

// typ_now.php 출력결과 컬럼 순서(문서 기준)
const NOW_COLUMNS = [
  "FT", "YY", "TYP", "SEQ", "TMD", "TYP_TM", "FT_TM", "LAT", "LON", "DIR", "SP", "PS", "WS",
  "RAD15", "RAD25", "RAD", "ED15", "ER15", "LOC", "ED25", "ER25",
] as const

// typ_lst.php 출력결과 컬럼 순서(문서 기준)
const LST_COLUMNS = ["YY", "SEQ", "NOW", "EFF", "TM_ST", "TM_ED", "TYP_NAME", "TYP_EN", "REM"] as const

function rowsToObjects<T extends readonly string[]>(rows: string[][], columns: T) {
  return rows.map((row) => {
    const obj: Record<string, string> = {}
    columns.forEach((col, i) => {
      obj[col] = row[i] ?? ""
    })
    return obj
  })
}

/** 직전 정상 응답(mode별) — 기상청이 504를 줘도 10분까지는 이 값을 stale 표시와 함께 준다 */
const stale = staleCache<{ mode: string; count: number; typhoons: Record<string, string>[] }>(10 * 60 * 1000)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  const authKey = process.env.KMA_APIHUB_KEY
  if (!authKey) {
    res.status(500).json({ error: "KMA_APIHUB_KEY 환경변수가 설정되지 않았습니다." })
    return
  }

  const mode = req.query.mode === "list" ? "list" : "now"
  const base = mode === "list" ? TYP_LST_URL : TYP_NOW_URL
  const columns = mode === "list" ? LST_COLUMNS : NOW_COLUMNS

  try {
    const url = `${base}?disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
    const buf = await fetchUpstream(url)
    const text = new TextDecoder("euc-kr").decode(buf)
    const rows = parseDelimitedText(text)
    const typhoons = rowsToObjects(rows, columns)

    res.setHeader("Cache-Control", "no-store")
    const payload = { mode, count: typhoons.length, typhoons }
    stale.set(mode, payload)
    res.status(200).json(payload)
  } catch (err) {
    const hit = stale.get(mode)
    if (hit) {
      res.setHeader("Cache-Control", "no-store")
      res.status(200).json({ ...hit.value, stale: true, staleSeconds: hit.ageSec })
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
