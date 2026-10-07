/**
 * 생활안전지도(행정안전부) 하천범람지도·침수흔적도 WMS 타일 중계 — `GET /api/safemap-wms?layer=river|trace&bbox=…&width=256&height=256`.
 * 키(SAFEMAP_KEY)를 브라우저에 보이지 않으려고 프록시가 대신 받는다. 두 레이어는 1년 주기로 갱신돼 타일을 하루 동안 캐시해도 된다
 * (이미지라 CORS 문제의 영향을 받는 JSON 캐시와 달리 안전하다).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { buildSafemapUrl, parseWmsRequest } from "../lib/safemap"

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  const parsed = parseWmsRequest(req.query)
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error })
    return
  }
  const key = process.env.SAFEMAP_KEY
  if (!key) {
    res.status(500).json({ error: "SAFEMAP_KEY 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    const upstream = await fetch(buildSafemapUrl(parsed, key), { signal: AbortSignal.timeout(15000) })
    const type = upstream.headers.get("content-type") ?? ""
    if (!upstream.ok || !type.startsWith("image/")) {
      // 키·서비스 오류는 JSON으로 온다(resultCode 30 서비스키 미등록 등)
      const text = (await upstream.text()).replace(/\s+/g, " ").slice(0, 200)
      res.status(502).json({ error: `생활안전지도 응답 오류: HTTP ${upstream.status} ${text}` })
      return
    }
    res.setHeader("Content-Type", type)
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400")
    res.status(200).send(Buffer.from(await upstream.arrayBuffer()))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: `생활안전지도 중계 실패: ${message}` })
  }
}
