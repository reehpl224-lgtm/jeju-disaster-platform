/**
 * 기상청 API허브 해양 종합 관측자료(sea_obs.php) 프록시 — /coast(연안)에 파고(WH) 데이터를
 * 추가하기 위한 용도. KMA_APIHUB_KEY 필요(태풍정보와 동일 키).
 *
 * 태풍정보(typ_now.php 등)와 달리 이 API는 이미 UTF-8 JSON을 반환한다(disp 파라미터도 없음).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"

const MARINE_URL = "https://apihub.kma.go.kr/api/typ01/url/sea_obs.php"

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

  const authKey = process.env.KMA_APIHUB_KEY
  if (!authKey) {
    res.status(500).json({ error: "KMA_APIHUB_KEY 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    // stn=0(전체지점) — 제주 인근 지점만 골라내는 건 실제 STN_KO 값을 확인한 뒤 프론트에서 필터.
    // disp=1을 붙이면 이 API는 (문서에 안 나와있지만 실제로는) JSON을 반환한다 — 없으면 typ01
    // 계열과 같은 '#START7777'류 텍스트가 온다. 2026-09-09 실측으로 확인.
    const url = `${MARINE_URL}?stn=0&disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
    const upstream = await fetch(url)
    const text = await upstream.text()
    if (!upstream.ok) {
      throw new Error(`기상청 API허브 응답 오류: HTTP ${upstream.status} — ${text.slice(0, 200)}`)
    }
    const stations = JSON.parse(text)
    res.setHeader("Cache-Control", "no-store")
    res.status(200).json({ stations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
