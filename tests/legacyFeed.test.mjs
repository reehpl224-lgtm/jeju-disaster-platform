import assert from "node:assert/strict"
import test from "node:test"
import { LEGACY_FEEDS } from "../src/data/legacyFeed.ts"

test("레거시 수신 항목: 7개 시스템이 모두 있고 행 길이가 컬럼과 같다", () => {
  assert.deepEqual(Object.keys(LEGACY_FEEDS).sort(), ["ls-ews", "ls-flood-mgmt", "ls-flood-warn", "ls-rain-alert", "ls-river-flow", "ls-river-mon", "ls-sgp-rain", "ls-snow"].concat(["ls-2", "ls-quake"]).sort())
  for (const [id, f] of Object.entries(LEGACY_FEEDS)) {
    assert.ok(f.rows.length > 0, id)
    for (const r of f.rows) assert.equal(r.length, f.columns.length, `${id}: ${r.join("|")}`)
  }
})
