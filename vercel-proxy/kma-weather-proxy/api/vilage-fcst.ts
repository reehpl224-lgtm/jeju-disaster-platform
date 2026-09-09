/**
 * 기상청 단기예보 조회서비스(getVilageFcst) 프록시 — Vercel Serverless Function 버전.
 *
 * workers/kma-weather-proxy(Cloudflare Workers 버전)와 로직은 동일합니다. Cloudflare
 * 계정 가입이 막혀서(에러 코드 1111, 어뷰징 방지 레이트리밋) GitHub 계정으로 바로 가입되는
 * Vercel로 옮겼습니다(2026-09-09). Workers 버전은 나중에 Cloudflare 가입이 풀리면 다시 쓸 수
 * 있게 삭제하지 않고 남겨뒀습니다.
 *
 * 배포: Vercel 프로젝트 설정(또는 `vercel env add KMA_SERVICE_KEY`)에서
 * KMA_SERVICE_KEY 환경변수(data.go.kr "인증키(Decoding)" 값)를 등록하세요.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"

const KMA_BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

// 이 프록시를 부를 수 있는 프론트엔드 origin — 비밀값이 아니라서 코드에 그대로 둠.
const ALLOWED_ORIGINS = ["https://reehpl224-lgtm.github.io", "http://localhost:5173", "http://localhost:5199"]

// AGENTS.md 확정 대상지 기준 시청 좌표 → 기상청 격자변환 공식(LCC, 기상청 공식 상수)으로 직접 계산한 값.
const REGIONS: Record<string, { nx: number; ny: number; label: string }> = {
  jeju: { nx: 53, ny: 38, label: "제주시" },
  seogwipo: { nx: 53, ny: 33, label: "서귀포시" },
}

// 단기예보 발표시각(KST) — 실제 자료 반영까지 발표 후 약 10분 소요되는 걸 감안해 버퍼를 둠.
const BASE_TIMES = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]
const PUBLISH_DELAY_MIN = 10

const WANTED_CATEGORIES = ["TMP", "POP", "SKY", "PTY", "REH", "WSD"] as const
type WantedCategory = (typeof WANTED_CATEGORIES)[number]

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader("Access-Control-Allow-Origin", allow)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Vary", "Origin")
}

/** 현재 KST 기준 가장 최근에 발표됐고(+발표지연 10분 경과) 이미 반영됐을 base_date/base_time을 고른다. */
function resolveBaseDateTime(now: Date): { baseDate: string; baseTime: string } {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0")
  const d = String(kst.getUTCDate()).padStart(2, "0")
  const hhmm = kst.getUTCHours() * 100 + kst.getUTCMinutes()

  let candidateDate = `${y}${m}${d}`
  let chosen: string | null = null
  for (let i = BASE_TIMES.length - 1; i >= 0; i--) {
    const t = BASE_TIMES[i]
    const hour = Number(t.slice(0, 2))
    const minute = Number(t.slice(2, 4))
    const readyAt = hour * 100 + minute + Math.floor(PUBLISH_DELAY_MIN / 60) * 100 + (PUBLISH_DELAY_MIN % 60)
    if (hhmm >= readyAt) {
      chosen = t
      break
    }
  }

  if (!chosen) {
    // 오늘 첫 발표(02:10)도 아직이면 전날 마지막 발표(23:00)를 쓴다.
    const prev = new Date(kst.getTime() - 24 * 60 * 60 * 1000)
    const py = prev.getUTCFullYear()
    const pm = String(prev.getUTCMonth() + 1).padStart(2, "0")
    const pd = String(prev.getUTCDate()).padStart(2, "0")
    candidateDate = `${py}${pm}${pd}`
    chosen = BASE_TIMES[BASE_TIMES.length - 1]
  }

  return { baseDate: candidateDate, baseTime: chosen }
}

interface KmaForecastItem {
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
}

interface ForecastSlot {
  date: string
  time: string
  values: Partial<Record<WantedCategory, string>>
}

async function fetchVilageFcst(serviceKey: string, nx: number, ny: number): Promise<ForecastSlot[]> {
  const { baseDate, baseTime } = resolveBaseDateTime(new Date())

  const params = new URLSearchParams({
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  })
  // data.go.kr 서비스키는 특수문자(+ / =)를 포함하는 경우가 많아, URLSearchParams의 이중 인코딩을
  // 피하려고 serviceKey만 별도로 붙인다(디코딩 키를 환경변수에 넣었다는 전제로 한 번만 encode).
  const url = `${KMA_BASE_URL}?${params.toString()}&serviceKey=${encodeURIComponent(serviceKey)}`

  const upstream = await fetch(url, { headers: { Accept: "application/json" } })
  if (!upstream.ok) {
    throw new Error(`기상청 API 응답 오류: HTTP ${upstream.status}`)
  }

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

  const items: KmaForecastItem[] = json?.response?.body?.items?.item ?? []

  const slotMap = new Map<string, ForecastSlot>()
  for (const item of items) {
    if (!WANTED_CATEGORIES.includes(item.category as WantedCategory)) continue
    const key = `${item.fcstDate}-${item.fcstTime}`
    if (!slotMap.has(key)) {
      slotMap.set(key, { date: item.fcstDate, time: item.fcstTime, values: {} })
    }
    slotMap.get(key)!.values[item.category as WantedCategory] = item.fcstValue
  }

  return Array.from(slotMap.values())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 12) // 다음 12개 시간대(3시간 간격 기준 최대 36시간)만 반환 — 응답 크기 축소
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res)

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
    const slots = await fetchVilageFcst(serviceKey, region.nx, region.ny)
    // 단기예보는 3시간 간격 발표라 10분 캐시(CDN)로도 충분 — data.go.kr 트래픽 쿼터 절약.
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300")
    res.status(200).json({ region: regionKey, label: region.label, nx: region.nx, ny: region.ny, slots })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
