/**
 * 기상청 단기예보 조회서비스(getVilageFcst) 프록시.
 *
 * 이 앱(jeju-disaster-platform)은 서버 없는 정적 SPA라 브라우저가 공공데이터포털 API를
 * 직접 부르면 (1) 서비스키가 배포 번들에 그대로 노출되고 (2) 대체로 CORS가 막혀 응답을
 * 받지 못한다. 이 Worker가 서비스키를 Secret으로 들고 있다가 대신 호출해주고, 허용된
 * 프론트엔드 origin에만 CORS를 열어준다.
 *
 * 배포: `wrangler secret put KMA_SERVICE_KEY` (data.go.kr 마이페이지의 "인증키(Decoding)" 값)
 *       → `wrangler deploy`
 */

interface Env {
  KMA_SERVICE_KEY: string
  ALLOWED_ORIGINS: string
}

const KMA_BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

// AGENTS.md 확정 대상지 기준 시청 좌표 → 기상청 격자변환 공식(LCC, 기상청 공식 상수)으로 직접 계산한 값.
// 참고: 실제 API 응답을 스냅샷으로 박아넣는 게 아니라 매 요청 라이브 호출이므로, 좌표만 정확하면 됨.
const REGIONS: Record<string, { nx: number; ny: number; label: string }> = {
  jeju: { nx: 53, ny: 38, label: "제주시" },
  seogwipo: { nx: 53, ny: 33, label: "서귀포시" },
}

// 단기예보 발표시각(KST) — 실제 자료 반영까지 발표 후 약 10분 소요되는 걸 감안해 버퍼를 둠.
const BASE_TIMES = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]
const PUBLISH_DELAY_MIN = 10

const WANTED_CATEGORIES = ["TMP", "POP", "SKY", "PTY", "REH", "WSD"] as const
type WantedCategory = (typeof WANTED_CATEGORIES)[number]

function corsHeaders(origin: string | null, allowedOrigins: string[]): HeadersInit {
  const allow = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  }
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

async function fetchVilageFcst(env: Env, nx: number, ny: number): Promise<ForecastSlot[]> {
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
  // 피하려고 serviceKey만 별도로 붙인다(디코딩 키를 Secret에 넣었다는 전제로 한 번만 encode).
  const url = `${KMA_BASE_URL}?${params.toString()}&serviceKey=${encodeURIComponent(env.KMA_SERVICE_KEY)}`

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin")
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    const cors = corsHeaders(origin, allowedOrigins)

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors })
    }

    const url = new URL(request.url)
    if (url.pathname !== "/api/vilage-fcst") {
      return new Response("Not found", { status: 404, headers: cors })
    }

    const regionKey = url.searchParams.get("region") ?? "jeju"
    const region = REGIONS[regionKey]
    if (!region) {
      return new Response(JSON.stringify({ error: `알 수 없는 region: ${regionKey}` }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    const cache = caches.default
    const cacheKey = new Request(url.toString(), request)
    const cached = await cache.match(cacheKey)
    if (cached) {
      const res = new Response(cached.body, cached)
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    try {
      const slots = await fetchVilageFcst(env, region.nx, region.ny)
      const body = JSON.stringify({ region: regionKey, label: region.label, nx: region.nx, ny: region.ny, slots })
      const response = new Response(body, {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/json",
          // 단기예보는 3시간 간격 발표라 10분 캐시로도 충분 — data.go.kr 트래픽 쿼터 절약.
          "Cache-Control": "public, max-age=600",
        },
      })
      await cache.put(cacheKey, response.clone())
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }
  },
}
