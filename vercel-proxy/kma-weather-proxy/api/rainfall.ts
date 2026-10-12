/**
 * 기상청 API허브 방재기상관측(AWS) 매분자료 프록시(nph-aws2_min) — /river(하천범람)의
 * "돌발 강우 조기경보"를 실시간 우량계 값으로 보완하기 위한 용도. KMA_APIHUB_KEY 필요
 * (태풍정보·기상특보·해양관측과 동일 키). 이 API는 별도 활용신청 없이 이미 접근 가능했음
 * (2026-09-09 확인).
 *
 * 컬럼 순서는 2026-09-09 실측 헤더로 확인(문서에 표 없이 PDF 링크만 있어서 실측으로 검증):
 *   TM, STN, WD1, WS1, WDS, WSS, WD10, WS10, TA, RE, RN-15m, RN-60m, RN-12H, RN-DAY, HM, PA, PS, TD
 * RE(강수유무)를 포함한 결측값은 "-99.9" 같은 값으로 온다 — 그대로 두고 프론트에서 처리.
 *
 * 효돈천(돈내코·쇠소깍) 정확히 같은 이름의 AWS 지점은 없음 — 가장 가까운 저지대 실측 지점인
 * 189(서귀포, 서귀동, 52m)를 참고 지점으로 씀. www.kma.go.kr/cgi-bin/aws/nph-aws_txt_min의
 * 지점 목록(공개, 인증키 불필요)으로 2026-09-09 직접 확인 — 지어낸 지점번호 아님.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"

const RAINFALL_URL = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min"

const RIVER_AWS_COLUMNS = [
  "TM", "STN", "WD1", "WS1", "WDS", "WSS", "WD10", "WS10", "TA", "RE",
  "RN15m", "RN60m", "RN12H", "RNDAY", "HM", "PA", "PS", "TD",
] as const

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

/** 재시도할 때 조회 시각을 몇 분 전으로 둘지 — 처음은 2분 전(막 지난 1분은 값이 덜 채워짐), 그다음은 더 오래된 분 */
const RETRY_BACK_MINUTES = [2, 4, 8]
const ATTEMPT_TIMEOUT_MS = 5000
const STALE_MS = 5 * 60 * 1000

/** 같은 인스턴스가 살아 있는 동안 마지막으로 받은 정상 결과 — 기상청이 빈 응답을 줄 때 잠깐 대신 쓴다 */
let lastGood: { at: number; stations: Record<string, string>[] } | null = null

const isMissing = (v: string | undefined) => v === undefined || v === "" || Number(v) <= -90

/** 한 번 조회해서 지점 목록과, 우량(RN60m·RNDAY)이 결측이 아닌 지점 수를 돌려준다 */
async function fetchStations(authKey: string, backMinutes: number) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 - backMinutes * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  const tm2 = `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}`
  const url = `${RAINFALL_URL}?stn=0&tm2=${tm2}&disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
  const upstream = await fetch(url, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) })
  const buf = await upstream.arrayBuffer()
  let text = new TextDecoder("euc-kr").decode(buf)
  if (!upstream.ok) {
    try {
      text = new TextDecoder("utf-8").decode(buf)
    } catch {
      /* EUC-KR 디코딩 결과를 그대로 사용 */
    }
    throw new Error(`기상청 API허브 응답 오류: HTTP ${upstream.status} — ${text.slice(0, 200)}`)
  }
  const stations = parseDelimitedText(text).map((row) => {
    const obj: Record<string, string> = {}
    RIVER_AWS_COLUMNS.forEach((col, i) => {
      obj[col] = row[i] ?? ""
    })
    return obj
  })
  const valid = stations.filter((s) => !isMissing(s.RN60m) || !isMissing(s.RNDAY)).length
  return { stations, valid }
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
    // tm2를 생략하면 서버가 이상하게 빈 배열을 주는 경우가 있어(2026-09-09 실측) 현재 KST를
    // 명시적으로 넘긴다. 방금 막 지난 1분은 아직 값이 안 채워져 전부 -99.9로 오는 걸 실측
    // 확인해서, 여유를 두고 2분 전 시각으로 조회한다.
    //
    // 2026-10-12: 기상청이 200을 주면서 본문을 비우거나(약 30초 걸린 뒤 지점 0개) 값이 전부 결측으로 오는 경우가 있어
    // 앞단 화면에서 우량 값이 "-"로 돌아갔다. 비거나 쓸 값이 없으면 더 오래된 분(2→4→8분 전)으로 다시 시도하고,
    // 시도마다 시간 제한(5초)을 둔다. 끝까지 안 되면 마지막으로 받아 둔 정상 값(5분 이내)을 stale 표시와 함께 준다.
    let lastError = ""
    for (const back of RETRY_BACK_MINUTES) {
      try {
        const result = await fetchStations(authKey, back)
        if (result.valid > 0) {
          lastGood = { at: Date.now(), stations: result.stations }
          res.setHeader("Cache-Control", "no-store")
          res.status(200).json({ stations: result.stations, attempt: back })
          return
        }
        lastError = `기상청 응답에 쓸 수 있는 우량 값이 없습니다(${result.stations.length}개 지점, ${back}분 전 기준)`
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    if (lastGood && Date.now() - lastGood.at < STALE_MS) {
      res.setHeader("Cache-Control", "no-store")
      res.status(200).json({ stations: lastGood.stations, stale: true, staleSeconds: Math.round((Date.now() - lastGood.at) / 1000) })
      return
    }
    throw new Error(lastError || "기상청 우량 관측 조회 실패")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
