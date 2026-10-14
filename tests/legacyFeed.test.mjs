import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test from "node:test"

const src = new URL("../src/", import.meta.url).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith(src) && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of [".ts", ".tsx"]) {
        try { return next(specifier + extension, context) } catch (error) {
          if (error.code !== "ERR_MODULE_NOT_FOUND") throw error
        }
      }
    }
    return next(specifier, context)
  },
})
const { LEGACY_FEEDS } = await import("../src/data/legacyFeed.ts")

test("레거시 수신 항목: 7개 시스템이 모두 있고 행 길이가 컬럼과 같다", () => {
  assert.deepEqual(Object.keys(LEGACY_FEEDS).sort(), ["ls-ews", "ls-flood-mgmt", "ls-flood-warn", "ls-rain-alert", "ls-river-flow", "ls-river-mon", "ls-sgp-rain", "ls-snow"].concat(["ls-2", "ls-quake", "ls-prov-cctv", "ls-alert-dispatch"]).sort())
  for (const [id, f] of Object.entries(LEGACY_FEEDS)) {
    assert.ok(f.rows.length > 0, id)
    for (const r of f.rows) assert.equal(r.length, f.columns.length, `${id}: ${r.join("|")}`)
  }
})

test("경보 이력·수집 상태·담당자: 조기경보 표는 이력에서 나오고, 모든 수신 시스템에 수집 상태와 담당자가 있다", async () => {
  const { LEGACY_ALERT_HISTORY, LEGACY_COLLECTION, alertMinutes } = await import("../src/data/legacyFeed.ts")
  const { LEGACY_CONTACTS } = await import("../src/data/legacyContacts.ts")
  assert.equal(LEGACY_FEEDS["ls-ews"].rows.length, LEGACY_ALERT_HISTORY.filter((r) => r.system === "ls-ews").length)
  assert.equal(alertMinutes({ ...LEGACY_ALERT_HISTORY[3] }), 90)
  assert.equal(alertMinutes(LEGACY_ALERT_HISTORY[0]), null)
  const feedIds = Object.keys(LEGACY_FEEDS).sort()
  assert.deepEqual(LEGACY_COLLECTION.map((c) => c.id).sort(), feedIds)
  for (const id of feedIds) if (id !== "ls-2") assert.ok(LEGACY_CONTACTS[id], id)
  for (const c of Object.values(LEGACY_CONTACTS)) assert.ok(c.agency.phone.startsWith("064-000-") || c.agency.phone === "—") // 가상 번호만
})
