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
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 - 2 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, "0")
    const tm2 = `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}`
    const url = `${RAINFALL_URL}?stn=0&tm2=${tm2}&disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
    const upstream = await fetch(url)
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

    const rows = parseDelimitedText(text)
    const stations = rows.map((row) => {
      const obj: Record<string, string> = {}
      RIVER_AWS_COLUMNS.forEach((col, i) => {
        obj[col] = row[i] ?? ""
      })
      return obj
    })

    res.setHeader("Cache-Control", "no-store")
    res.status(200).json({ stations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
