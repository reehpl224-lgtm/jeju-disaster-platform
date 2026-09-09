/**
 * 기상청 API허브 태풍정보(typ_now.php) 프록시 — /typhoon 페이지의 mockTyphoon.ts를
 * 실시간으로 대체하기 위한 용도. data.go.kr 서비스키(KMA_SERVICE_KEY)와는 별개로
 * apihub.kma.go.kr 자체 인증키(KMA_APIHUB_KEY)가 필요하다.
 *
 * 원본 API는 고정폭/구분자 텍스트를 반환한다(JSON 아님) — disp=1(콤마구분)로 요청해서 파싱한다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"

// 활용신청 승인 범위 확인용 — 임시로 세 하위 API를 다 시도해볼 수 있게 함(끝나면 typ_now 하나로 정리 예정).
const TYPHOON_URLS: Record<string, string> = {
  lst: "https://apihub.kma.go.kr/api/typ01/url/typ_lst.php",
  data: "https://apihub.kma.go.kr/api/typ01/url/typ_data.php",
  now: "https://apihub.kma.go.kr/api/typ01/url/typ_now.php",
}

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

// typ01 계열 API는 '#'로 시작하는 주석/헤더 줄과 데이터 줄이 섞인 텍스트를 반환한다.
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

  const variant = (req.query.variant as string) || "now"
  const base = TYPHOON_URLS[variant] ?? TYPHOON_URLS.now

  try {
    const url = `${base}?disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
    const upstream = await fetch(url)
    const buf = await upstream.arrayBuffer()
    // apihub.kma.go.kr의 typ01 계열 텍스트 API는 EUC-KR로 응답한다(UTF-8로 디코딩하면 한글이 깨짐).
    // 에러 응답(JSON)은 UTF-8이라 EUC-KR로 잘못 디코딩되면 파싱 실패하므로 그때만 UTF-8로 재시도.
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
    res.setHeader("Cache-Control", "no-store")
    // 원본 콤마구분 행을 그대로 전달 — 컬럼 의미는 typ_now.php 문서 순서를 프론트에서 참고.
    res.status(200).json({ raw: text, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
