import assert from "node:assert/strict"
import test from "node:test"
import { pickNcstValues, resolveNcstBase } from "../vercel-proxy/kma-weather-proxy/lib/ultraNcst.ts"

// KST = UTC+9 — Date.UTC로 만든 UTC 시각을 KST 벽시계로 읽어 기대값을 적는다.
const at = (iso) => resolveNcstBase(new Date(iso))

test("정시 10분 이후면 그 시각 정시를 쓴다", () => {
  assert.deepEqual(at("2026-10-07T01:10:00Z"), { baseDate: "20261007", baseTime: "1000" }) // KST 10:10
  assert.deepEqual(at("2026-10-07T01:59:00Z"), { baseDate: "20261007", baseTime: "1000" })
})

test("정시 10분 전이면 직전 정시를 쓴다", () => {
  assert.deepEqual(at("2026-10-07T01:09:59Z"), { baseDate: "20261007", baseTime: "0900" }) // KST 10:09
  assert.deepEqual(at("2026-10-07T01:00:00Z"), { baseDate: "20261007", baseTime: "0900" })
})

test("자정 직후에는 전날 23시 자료를 쓴다", () => {
  assert.deepEqual(at("2026-10-06T15:05:00Z"), { baseDate: "20261006", baseTime: "2300" }) // KST 10/07 00:05
  assert.deepEqual(at("2026-10-06T15:10:00Z"), { baseDate: "20261007", baseTime: "0000" }) // KST 10/07 00:10
})

test("화면에 쓰는 항목만 남긴다", () => {
  const values = pickNcstValues([
    { category: "T1H", obsrValue: "18.4" },
    { category: "RN1", obsrValue: "0" },
    { category: "UUU", obsrValue: "1.2" },
    { category: "WSD", obsrValue: "3.1" },
    { category: "REH", obsrValue: "62" },
  ])
  assert.deepEqual(values, { T1H: "18.4", RN1: "0", WSD: "3.1", REH: "62" })
})
