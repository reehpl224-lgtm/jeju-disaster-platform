/**
 * 국립해양조사원(KHOA) 조위관측소·해양관측부이 최신 관측데이터 프록시 — 모슬포 조위 + 중문·제주해협·제주남부 부이.
 * data.go.kr 일반 인증키(KMA_SERVICE_KEY 또는 DATA_GO_KR_KEY)를 쓰고, 각 데이터셋은 data.go.kr에서 활용신청이 돼 있어야 한다.
 * 한 관측점이 실패해도 나머지는 돌려주고 실패한 곳은 errors로 알린다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { extractKhoaItems, KHOA_ENDPOINTS, KHOA_STATIONS, normalizeKhoaItems } from "../lib/khoa"

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

const kstDate = () => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}${String(kst.getUTCDate()).padStart(2, "0")}`
}

async function fetchStation(station: (typeof KHOA_STATIONS)[number], serviceKey: string) {
  // min=60 → 시간 간격 1시간, 하루치(최대 24줄)를 받아 가장 늦은 시각을 최신값으로 쓴다
  const params = new URLSearchParams({ type: "json", obsCode: station.code, reqDate: kstDate(), min: "60", numOfRows: "300", pageNo: "1" })
  const upstream = await fetch(`${KHOA_ENDPOINTS[station.kind]}?${params.toString()}&serviceKey=${encodeURIComponent(serviceKey)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  })
  const text = await upstream.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`${station.name}(${station.code}): JSON이 아닌 응답 — ${text.slice(0, 120)}`)
  }
  const gate = json?.OpenAPI_ServiceResponse?.cmmMsgHeader
  if (gate) throw new Error(`${station.name}(${station.code}): ${gate.errMsg} ${gate.returnAuthMsg ?? ""}`)
  const code = String(json?.response?.header?.resultCode ?? json?.header?.resultCode ?? "00")
  if (code !== "00" && code !== "0") {
    throw new Error(`${station.name}(${station.code}): ${code} ${json?.response?.header?.resultMsg ?? ""}`)
  }
  const rows = normalizeKhoaItems(extractKhoaItems(json))
  const latest = rows.at(-1) ?? null
  return {
    code: station.code,
    kind: station.kind,
    name: station.name,
    lat: latest?.lat,
    lng: latest?.lng,
    latest,
    // 조위 시계열 — 하천 분석의 '수위 × 조위' 참고 차트용(시간별)
    series: station.kind === "tide" ? rows.filter((r) => r.values.tideCm != null).map((r) => ({ time: r.observedAt.slice(11), tideLevelCm: r.values.tideCm as number })) : [],
  }
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
  const results = await Promise.allSettled(KHOA_STATIONS.map((s) => fetchStation(s, serviceKey)))
  const stations = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
  const errors = results.flatMap((r) => (r.status === "rejected" ? [r.reason instanceof Error ? r.reason.message : String(r.reason)] : []))
  if (stations.length === 0) {
    res.status(502).json({ error: errors.join(" / ") })
    return
  }
  res.setHeader("Cache-Control", "no-store")
  res.status(200).json({ stations, errors })
}
