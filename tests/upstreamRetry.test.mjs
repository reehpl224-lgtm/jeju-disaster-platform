import assert from "node:assert/strict"
import test from "node:test"
import { withLastGood } from "../src/data/lastGood.ts"
import { fetchUpstream, staleCache } from "../vercel-proxy/kma-weather-proxy/lib/upstream.ts"

const resp = (status, body = "") => ({ ok: status >= 200 && status < 300, status, arrayBuffer: async () => new TextEncoder().encode(body).buffer })

test("프록시: 504는 다시 시도해서 성공하면 그 본문을 돌려준다", async () => {
  const calls = []
  const fetchImpl = async () => {
    calls.push(1)
    return calls.length < 3 ? resp(504) : resp(200, "ok")
  }
  const buf = await fetchUpstream("http://x", { backoffMs: 1, fetchImpl })
  assert.equal(new TextDecoder().decode(buf), "ok")
  assert.equal(calls.length, 3)
})

test("프록시: 끝까지 5xx면 오류를 던지고, 4xx는 다시 시도하지 않는다", async () => {
  let n = 0
  await assert.rejects(fetchUpstream("http://x", { backoffMs: 1, fetchImpl: async () => (n++, resp(504)) }), /HTTP 504/)
  assert.equal(n, 3)
  n = 0
  await assert.rejects(fetchUpstream("http://x", { backoffMs: 1, fetchImpl: async () => (n++, resp(401, "denied")) }), /HTTP 401/)
  assert.equal(n, 1)
})

test("프록시: 네트워크 오류·시간 초과도 다시 시도한다", async () => {
  let n = 0
  const fetchImpl = async () => {
    n++
    if (n < 2) throw new Error("timeout")
    return resp(200, "late")
  }
  assert.equal(new TextDecoder().decode(await fetchUpstream("http://x", { backoffMs: 1, fetchImpl })), "late")
})

test("프록시: stale 보관은 키별로 두고 시간이 지나면 버린다", async () => {
  const c = staleCache(20)
  c.set("a", 1)
  assert.equal(c.get("a")?.value, 1)
  assert.equal(c.get("b"), null)
  await new Promise((r) => setTimeout(r, 40))
  assert.equal(c.get("a"), null)
})

test("앱: 실패하면 직전 성공 값을 쓰고, 처음부터 실패하면 오류를 던진다", async () => {
  let fail = false
  let calls = 0
  const f = withLastGood(async (k) => {
    calls++
    if (fail) throw new Error("504")
    return `v-${k}`
  }, { retryDelayMs: 1 })
  assert.equal(await f("a"), "v-a")
  fail = true
  assert.equal(await f("a"), "v-a") // 직전 성공 값
  assert.ok(calls >= 3) // 성공 1 + 실패 후 재시도 포함
  await assert.rejects(f("b"), /504/) // 인자가 다르면 직전 값 없음
})

test("앱: 직전 성공 값은 maxAge가 지나면 쓰지 않는다", async () => {
  let fail = false
  const f = withLastGood(async () => {
    if (fail) throw new Error("down")
    return 1
  }, { maxAgeMs: 20, retryDelayMs: 1, retries: 0 })
  await f()
  fail = true
  assert.equal(await f(), 1)
  await new Promise((r) => setTimeout(r, 40))
  await assert.rejects(f(), /down/)
})
