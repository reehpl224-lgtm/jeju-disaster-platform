/**
 * 기상청 초단기실황(getUltraSrtNcst, 외부연계 명세서 EXT-KMA-001) 프록시 — 종합상황의 '현재 날씨'(기온·강수·풍속·습도)용.
 *
 * 단기예보(vilage-fcst.ts)와 같은 data.go.kr 서비스(VilageFcstInfoService_2.0)라 같은 KMA_SERVICE_KEY를 쓴다.
 * 명세서는 apihub.kma.go.kr 경로를 적었지만, 이 프로젝트의 단기예보가 이미 data.go.kr 경로로 실연동돼 있어 그대로 맞췄다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { pickNcstValues, resolveNcstBase } from "../lib/ultraNcst"

const NCST_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"

// vilage-fcst.ts와 같은 격자 좌표(제주시청·서귀포시청 기준)
const REGIONS: Record<string, { nx: number; ny: number; label: string }> = {
  jeju: { nx: 53, ny: 38, label: "제주시" },
  seogwipo: { nx: 53, ny: 33, label: "서귀포시" },
}

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

  const regionKey = (req.query.region as string) ?? "jeju"
  const region = REGIONS[regionKey]
  if (!region) {
    res.status(400).json({ error: `알 수 없는 region: ${regionKey}` })
    return
  }

  const serviceKey = process.env.KMA_SERVICE_KEY
  if (!serviceKey) {
    res.status(500).json({ error: "KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    const { baseDate, baseTime } = resolveNcstBase(new Date())
    const params = new URLSearchParams({
      pageNo: "1",
      numOfRows: "20",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: String(region.nx),
      ny: String(region.ny),
    })
    // serviceKey만 따로 붙인다 — URLSearchParams가 한 번 더 인코딩하면 키의 + / = 가 깨진다(vilage-fcst.ts와 동일).
    const upstream = await fetch(`${NCST_URL}?${params.toString()}&serviceKey=${encodeURIComponent(serviceKey)}`, {
      headers: { Accept: "application/json" },
    })
    if (!upstream.ok) throw new Error(`기상청 API 응답 오류: HTTP ${upstream.status}`)

    const text = await upstream.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`기상청 API가 JSON이 아닌 응답을 반환했습니다(서비스키 오류일 가능성): ${text.slice(0, 200)}`)
    }
    const header = json?.response?.header
    if (!header || header.resultCode !== "00") {
      throw new Error(`기상청 API 오류: ${header?.resultCode ?? "unknown"} ${header?.resultMsg ?? ""}`)
    }

    const values = pickNcstValues(json?.response?.body?.items?.item ?? [])
    res.setHeader("Cache-Control", "no-store")
    res.status(200).json({ region: regionKey, label: region.label, nx: region.nx, ny: region.ny, baseDate, baseTime, values })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
