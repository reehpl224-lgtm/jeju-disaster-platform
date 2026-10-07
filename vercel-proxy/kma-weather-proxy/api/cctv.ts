/**
 * 제주시 감시 CCTV 목록(월파 19·하천 62·적설 10, 2026-10-07 기준) 프록시 — data.go.kr 6510000 세 서비스를 한 번에 합쳐 준다.
 * 키는 data.go.kr 일반 인증키(Decoding). 전용 키를 따로 넣고 싶으면 DATA_GO_KR_KEY, 없으면 기상청과 같은 KMA_SERVICE_KEY를 쓴다
 * (data.go.kr 인증키는 계정 하나에 하나라 같은 계정이면 같은 값이다).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { CCTV_SERVICES, normalizeCctvItems, type CctvItem, type CctvKind } from "../lib/cctv"

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

async function fetchKind(kind: CctvKind, serviceKey: string): Promise<CctvItem[]> {
  const params = new URLSearchParams({ pageNo: "1", numOfRows: "200", type: "json" })
  // serviceKey는 따로 붙인다 — URLSearchParams가 한 번 더 인코딩하면 키의 + / = 가 깨진다(다른 프록시와 동일).
  const upstream = await fetch(`${CCTV_SERVICES[kind].url}?${params.toString()}&serviceKey=${encodeURIComponent(serviceKey)}`, {
    headers: { Accept: "application/json" },
  })
  const text = await upstream.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`${CCTV_SERVICES[kind].label} CCTV: JSON이 아닌 응답(서비스키 오류일 가능성) — ${text.slice(0, 120)}`)
  }
  // 키·서비스 오류는 data.go.kr 게이트웨이가 OpenAPI_ServiceResponse 모양으로 돌려준다
  const gate = json?.OpenAPI_ServiceResponse?.cmmMsgHeader
  if (gate) throw new Error(`${CCTV_SERVICES[kind].label} CCTV: ${gate.errMsg} ${gate.returnAuthMsg ?? ""}`)
  const header = json?.response?.header
  if (!header || header.resultCode !== "00") {
    throw new Error(`${CCTV_SERVICES[kind].label} CCTV: ${header?.resultCode ?? "unknown"} ${header?.resultMsg ?? ""}`)
  }
  const items = json?.response?.body?.items?.item
  return normalizeCctvItems(kind, Array.isArray(items) ? items : items ? [items] : [])
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  const serviceKey = process.env.DATA_GO_KR_KEY ?? process.env.KMA_SERVICE_KEY
  if (!serviceKey) {
    res.status(500).json({ error: "DATA_GO_KR_KEY(또는 KMA_SERVICE_KEY) 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    // 하나가 실패해도 나머지는 보여준다 — 실패한 서비스는 errors로 알린다
    const kinds = Object.keys(CCTV_SERVICES) as CctvKind[]
    const results = await Promise.allSettled(kinds.map((k) => fetchKind(k, serviceKey)))
    const cameras = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    const errors = results.flatMap((r) => (r.status === "rejected" ? [r.reason instanceof Error ? r.reason.message : String(r.reason)] : []))
    if (cameras.length === 0 && errors.length > 0) throw new Error(errors.join(" / "))
    res.setHeader("Cache-Control", "no-store")
    res.status(200).json({ cameras, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
