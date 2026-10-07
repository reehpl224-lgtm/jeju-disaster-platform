/**
 * 제주시 감시 CCTV 영상(HLS) 중계용 순수 함수 — tests/에서 바로 검증한다.
 * 영상 서버가 `http://IP:1935`라 HTTPS 화면이 직접 재생하지 못해 프록시가 대신 받아 준다.
 * 아무 주소나 중계하는 열린 프록시가 되지 않게 허용 서버·경로를 코드에 고정한다.
 */

/** 제주시 CCTV API(cctvUrl)가 가리키는 영상 서버 — 2026-10-07 확인. 바뀌면 이 값만 고친다. */
export const ALLOWED_HOST = "211.114.96.121:1935"
const ALLOWED_PATH_PREFIX = "/jejusi"

/** 허용된 영상 주소만 URL로 돌려주고, 아니면 null */
export function parseAllowedStreamUrl(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== "http:" || url.host !== ALLOWED_HOST) return null
  if (!url.pathname.startsWith(ALLOWED_PATH_PREFIX)) return null
  return url
}

const proxied = (abs: URL) => `/api/cctv-stream?u=${encodeURIComponent(abs.toString())}`

/**
 * m3u8 안의 주소(변형 재생목록·세그먼트·암호 키)를 프록시 주소로 바꾼다.
 * 상대 경로는 재생목록 주소를 기준으로 풀고, 허용되지 않는 주소는 그대로 두지 않고 빈 줄로 만든다.
 */
export function rewriteM3u8(text: string, base: URL): string {
  const rewrite = (ref: string) => {
    const abs = parseAllowedStreamUrl(new URL(ref, base).toString())
    return abs ? proxied(abs) : null
  }
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line === "") return line
      if (line.startsWith("#")) {
        // #EXT-X-KEY / #EXT-X-MAP 같은 태그의 URI="..."
        return line.replace(/URI="([^"]*)"/g, (whole, ref: string) => {
          const to = rewrite(ref)
          return to ? `URI="${to}"` : whole
        })
      }
      return rewrite(line.trim()) ?? ""
    })
    .join("\n")
}
