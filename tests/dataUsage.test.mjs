import assert from "node:assert/strict"
import test from "node:test"
import { DATA_USAGE, usageSummary } from "../src/data/dataUsage.ts"

test("데이터 사용 명세: id 중복 없음, 모든 칸이 채워져 있고 두 서비스 구분이 모두 있다", () => {
  assert.equal(new Set(DATA_USAGE.map((i) => i.id)).size, DATA_USAGE.length)
  for (const i of DATA_USAGE) for (const [k, v] of Object.entries(i)) assert.ok(String(v).trim(), `${i.id}.${k}`)
  assert.deepEqual([...new Set(DATA_USAGE.map((i) => i.track))].sort(), ["legacy", "outside", "pilot"])
  assert.equal(usageSummary(DATA_USAGE).total, DATA_USAGE.length)
})
