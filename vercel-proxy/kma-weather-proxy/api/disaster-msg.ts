/**
 * 긴급재난문자(제주 수신분) 프록시 — 재난안전데이터공유플랫폼 DSSP-IF-00247을 끝쪽 두 페이지만 받아 제주 문자만 추려 준다.
 * `GET /api/disaster-msg?days=14` → { messages, fetchedAt, windowDays }. 키는 환경변수 SAFETYDATA_MSG_KEY(서비스별 키라 따로 둔다).
 * 안전데이터 키는 신청 IP에서만 통하는 경우가 있다 — Vercel에서 막히면 error(코드 20·32 등)로 알려 준다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { pickJejuRecent, type DisasterMsgRow } from "../lib/disasterMsg"

const URL_BASE = "https://www.safetydata.go.kr/V2/api/DSSP-IF-00247"
const PAGE = 1000

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

async function fetchPage(key: string, pageNo: number, numOfRows = PAGE): Promise<{ body: DisasterMsgRow[]; totalCount: number }> {
  const upstream = await fetch(`${URL_BASE}?serviceKey=${encodeURIComponent(key)}&returnType=json&numOfRows=${numOfRows}&pageNo=${pageNo}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  const text = await upstream.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`긴급재난문자: JSON이 아닌 응답 — ${text.slice(0, 120)}`)
  }
  const code = String(json?.header?.resultCode ?? "")
  if (code !== "00") throw new Error(`긴급재난문자: ${code} ${json?.header?.errorMsg ?? json?.header?.resultMsg ?? ""}`)
  return { body: Array.isArray(json.body) ? json.body : [], totalCount: Number(json.totalCount) || 0 }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }
  const key = process.env.SAFETYDATA_MSG_KEY
  if (!key) {
    res.status(500).json({ error: "SAFETYDATA_MSG_KEY 환경변수가 설정되지 않았습니다." })
    return
  }
  const days = Math.min(30, Math.max(1, Number(Array.isArray(req.query.days) ? req.query.days[0] : req.query.days) || 14))

  try {
    // 마지막 쪽 번호를 알려면 전체 건수가 필요하다 — 한 건만 받아 totalCount를 읽는다
    const { totalCount } = await fetchPage(key, 1, 1)
    const last = Math.max(1, Math.ceil(totalCount / PAGE))
    const pages = last > 1 ? [last, last - 1] : [last]
    const rows = (await Promise.all(pages.map((p) => fetchPage(key, p)))).flatMap((r) => r.body)
    res.setHeader("Cache-Control", "no-store")
    res.status(200).json({ messages: pickJejuRecent(rows, new Date(), days), fetchedAt: new Date().toISOString(), windowDays: days })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
