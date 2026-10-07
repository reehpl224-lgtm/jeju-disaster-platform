import assert from "node:assert/strict"
import test from "node:test"
import { buildSafemapUrl, parseWmsRequest } from "../vercel-proxy/kma-weather-proxy/lib/safemap.ts"

// 제주 서귀포 일대 3857 타일 하나(Leaflet이 보내는 모양)
const ok = { layer: "river", bbox: "14046000,3920000,14150000,3990000", width: "256", height: "256" }

test("Leaflet WMS 요청을 검증해 꺼낸다", () => {
  const r = parseWmsRequest(ok)
  assert.deepEqual(r, { layer: "river", bbox: [14046000, 3920000, 14150000, 3990000], width: 256, height: 256 })
})

test("레이어·범위·크기가 올바르지 않으면 거절한다", () => {
  assert.ok("error" in parseWmsRequest({ ...ok, layer: "x" }))
  assert.ok("error" in parseWmsRequest({ ...ok, bbox: "1,2,3" }))
  assert.ok("error" in parseWmsRequest({ ...ok, bbox: "14150000,3920000,14046000,3990000" })) // 뒤집힌 범위
  assert.ok("error" in parseWmsRequest({ ...ok, bbox: "0,0,100,100" })) // 허용 범위 밖
  assert.ok("error" in parseWmsRequest({ ...ok, width: "4096" }))
  assert.ok("error" in parseWmsRequest({ ...ok, height: "abc" }))
})

test("키는 한 번만 인코딩하고 레이어별 엔드포인트를 쓴다", () => {
  const r = parseWmsRequest(ok)
  const url = buildSafemapUrl(r, "AB-12/+=")
  assert.ok(url.startsWith("https://www.safemap.go.kr/openapi2/IF_0100_WMS?"))
  assert.ok(url.endsWith("&serviceKey=AB-12%2F%2B%3D"))
  assert.ok(url.includes("srs=EPSG%3A3857"))
  const trace = buildSafemapUrl({ ...r, layer: "trace" }, "k")
  assert.ok(trace.includes("/IF_0092_WMS?"))
})
