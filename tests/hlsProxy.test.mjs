import assert from "node:assert/strict"
import test from "node:test"
import { parseAllowedStreamUrl, rewriteM3u8 } from "../vercel-proxy/kma-weather-proxy/lib/hlsProxy.ts"

const MASTER = "http://211.114.96.121:1935/jejusi6/11-11.stream/playlist.m3u8"

test("허용 서버·경로만 통과한다", () => {
  assert.ok(parseAllowedStreamUrl(MASTER))
  assert.equal(parseAllowedStreamUrl("http://evil.example.com/jejusi6/a.m3u8"), null)
  assert.equal(parseAllowedStreamUrl("http://211.114.96.121:1935/other/a.m3u8"), null)
  assert.equal(parseAllowedStreamUrl("http://211.114.96.121:8080/jejusi6/a.m3u8"), null)
  assert.equal(parseAllowedStreamUrl("https://211.114.96.121:1935/jejusi6/a.m3u8"), null)
  assert.equal(parseAllowedStreamUrl("not a url"), null)
})

test("상대 경로 재생목록 주소를 프록시 주소로 바꾼다", () => {
  const input = ["#EXTM3U", "#EXT-X-VERSION:3", '#EXT-X-STREAM-INF:BANDWIDTH=209056,CODECS="avc1.42001f"', "chunklist_w669545512.m3u8", ""].join("\n")
  const out = rewriteM3u8(input, new URL(MASTER)).split("\n")
  assert.equal(out[0], "#EXTM3U")
  assert.equal(out[3], `/api/cctv-stream?u=${encodeURIComponent("http://211.114.96.121:1935/jejusi6/11-11.stream/chunklist_w669545512.m3u8")}`)
  assert.equal(out[4], "")
})

test("조각(ts) 경로도 바꾸고 허용되지 않는 주소는 비운다", () => {
  const input = ["#EXTINF:10.0,", "media_w1_1.ts", "http://evil.example.com/x.ts", "#EXT-X-ENDLIST"].join("\n")
  const out = rewriteM3u8(input, new URL("http://211.114.96.121:1935/jejusi6/11-11.stream/chunklist_w1.m3u8")).split("\n")
  assert.ok(out[1].startsWith("/api/cctv-stream?u=http%3A%2F%2F211.114.96.121%3A1935%2Fjejusi6%2F11-11.stream%2Fmedia_w1_1.ts"))
  assert.equal(out[2], "")
  assert.equal(out[3], "#EXT-X-ENDLIST")
})

test("태그 안의 URI도 바꾼다", () => {
  const out = rewriteM3u8('#EXT-X-KEY:METHOD=AES-128,URI="key.bin"', new URL(MASTER))
  assert.ok(out.includes('URI="/api/cctv-stream?u='))
})
