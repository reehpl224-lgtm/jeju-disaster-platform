import assert from "node:assert/strict"
import test from "node:test"
import { serviceCardReading } from "../src/data/serviceCardCounts.ts"

const samples = [{ id: "river", level: "alert", count: 3 }, { id: "aqua", level: "warning", count: 2 }]
const entry = (extra = {}) => ({ regId: "L10913", wrn: "R", lvl: "1", tmFc: "202610120900", ...extra })
const empty = { caution: 0, warning: 0, alert: 0, danger: 0 }

test("실제 0건은 샘플로 대체하지 않고, 없는 데이터만 샘플로 표시한다", () => {
  const received = { status: "ready", entries: [] }
  assert.deepEqual(serviceCardReading("river", undefined, received, samples).counts, empty)
  assert.equal(serviceCardReading("river", undefined, received, samples).source, "warnings")
  const missing = serviceCardReading("river", undefined, { status: "failed" }, samples)
  assert.equal(missing.counts.alert, 3)
  assert.equal(missing.sourceLabel, "샘플 · 데이터 없음")
  assert.equal(serviceCardReading("aqua", undefined, received, samples).counts.warning, 2)
  assert.equal(serviceCardReading("river", undefined, { status: "loading" }, samples).sourceLabel, "샘플 · 조회 중")
})

test("특보 종류·등급·지역별로 집계하고 반복 발표와 무관한 특보를 제외한다", () => {
  const warnings = { status: "ready", entries: [
    entry(), entry({ tmFc: "202610121000" }), entry({ regId: "L10914" }),
    entry({ wrn: "W", lvl: "2" }), entry({ wrn: "H" }), entry({ lvl: "3" }),
  ] }
  assert.deepEqual(serviceCardReading("river", undefined, warnings, samples).counts, { ...empty, warning: 2, alert: 1 })
  assert.equal(serviceCardReading("heat", undefined, warnings, samples).counts.warning, 1)
})

test("직접 입력값을 우선하고 빈 영역·빈 값은 샘플로 채우지 않는다", () => {
  const warnings = { status: "ready", entries: [entry()] }
  const stage = { id: "river", level: "danger", count: 12, done: 0, doing: 0, waiting: 0 }
  const input = serviceCardReading("river", [stage], warnings, samples)
  assert.equal(input.source, "input")
  assert.deepEqual(input.counts, { ...empty, danger: 12 })
  assert.deepEqual(serviceCardReading("river", [{ ...stage, count: 0 }], warnings, samples).counts, empty)
  assert.equal(serviceCardReading("river", [{ ...stage, count: null }], warnings, samples).unavailable, true)
  assert.equal(serviceCardReading("river", [], warnings, samples).unavailable, true)
  assert.equal(serviceCardReading("aqua", [stage], warnings, samples).source, "input")
})

test("샘플을 넘기지 않으면(프로토타입) 받은 값이 없는 카드는 숫자를 비운다", () => {
  const missing = serviceCardReading("river", undefined, { status: "failed" }, [])
  assert.equal(missing.unavailable, true)
  assert.equal(missing.source, "none")
  assert.equal(missing.sourceLabel, "데이터 없음")
  assert.equal(serviceCardReading("river", undefined, { status: "loading" }, []).sourceLabel, "조회 중")
  // 받은 값이 0건이면 그대로 0건이다(없는 것과 다르다)
  assert.equal(serviceCardReading("river", undefined, { status: "ready", entries: [] }, []).unavailable, undefined)
})
