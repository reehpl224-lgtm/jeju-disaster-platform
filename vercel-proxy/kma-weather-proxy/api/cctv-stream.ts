/**
 * 제주시 감시 CCTV 영상(HLS) 중계 — `GET /api/cctv-stream?u=<영상 주소>`.
 * 영상 서버가 http·IP 주소라 HTTPS 화면에서 직접 재생되지 않아서 이 프록시가 재생목록(m3u8)과 조각(ts)을 대신 받아 준다.
 * 허용 서버·경로는 lib/hlsProxy.ts에 고정돼 있다. 영상은 약 200kbps라 조각이 작아 Vercel 응답 한도(4.5MB) 안에 든다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { parseAllowedStreamUrl, rewriteM3u8 } from "../lib/hlsProxy"

const MAX_SEGMENT_BYTES = 4 * 1024 * 1024

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

  const target = parseAllowedStreamUrl(String(req.query.u ?? ""))
  if (!target) {
    res.status(400).json({ error: "허용되지 않은 영상 주소입니다." })
    return
  }

  try {
    const upstream = await fetch(target, { signal: AbortSignal.timeout(8000) })
    if (!upstream.ok) {
      res.status(502).json({ error: `영상 서버 응답 오류: HTTP ${upstream.status}` })
      return
    }
    res.setHeader("Cache-Control", "no-store")

    if (target.pathname.endsWith(".m3u8")) {
      const text = await upstream.text()
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl")
      res.status(200).send(rewriteM3u8(text, target))
      return
    }

    const bytes = Buffer.from(await upstream.arrayBuffer())
    if (bytes.length > MAX_SEGMENT_BYTES) {
      res.status(502).json({ error: "영상 조각이 중계 한도를 넘습니다." })
      return
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "video/mp2t")
    res.status(200).send(bytes)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: `영상 중계 실패: ${message}` })
  }
}
