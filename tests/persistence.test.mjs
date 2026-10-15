import assert from "node:assert/strict"
import test from "node:test"
import { persistence, setPersistence } from "../src/data/persistence.ts"

test("저장 어댑터를 바꾸면 저장소가 쓰는 출입구가 바뀐다", () => {
  const mem = new Map()
  setPersistence({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) })
  persistence.setItem("k", "1")
  assert.equal(mem.get("k"), "1")
  assert.equal(persistence.getItem("k"), "1")
  persistence.removeItem("k")
  assert.equal(persistence.getItem("k"), null)
})
