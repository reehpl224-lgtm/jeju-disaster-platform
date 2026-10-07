import assert from "node:assert/strict"
import test from "node:test"
import { SERVICES, fullySample, trendDirection, trendPosition } from "../src/data/panelInputLogic.ts"

const t = (observed, extra = {}) => ({ id: "x", service: "river", name: "n", unit: "%", observed, forecast: [], threshold: 70, thresholdLabel: "경계 기준", worse: "above", level: "warning", ...extra })

test("추세는 마지막 두 값으로, 눈금 위치는 기준값 대비로 계산한다", () => {
  assert.equal(trendDirection(t([10, 20, 30])), "up")
  assert.equal(trendDirection(t([30, 20])), "down")
  assert.equal(trendDirection(t([30, 30])), "flat")
  assert.equal(trendDirection(t([30])), "flat")
  const near = trendPosition(t([10, 60]))
  const far = trendPosition(t([10, 20]))
  assert.ok(near > far && near <= 0.98 && far >= 0.02)
  // 기준값 이하가 위험(below)이면 값이 작을수록 위쪽
  assert.ok(trendPosition(t([30, 20], { worse: "below", threshold: 28 })) > trendPosition(t([30, 40], { worse: "below", threshold: 28 })))
})

test("영역이 하나라도 입력되면 그 탭은 '전체 샘플'이 아니다(영역별로 따로 판단)", () => {
  assert.ok(fullySample.sensor({}) && fullySample.trend({}) && fullySample.response({}))
  const withStages = { stages: [] }
  assert.equal(fullySample.response(withStages), false) // 값이 빈 목록이어도 '입력함' — 샘플로 메우지 않는다
  assert.ok(fullySample.sensor(withStages)) // 다른 탭은 그대로
  assert.equal(fullySample.sensor({ sensorAlerts: [] }), false)
})

test("서비스 목록은 중복 없는 9개", () => {
  assert.equal(new Set(SERVICES.map((s) => s.id)).size, SERVICES.length)
  assert.equal(SERVICES.length, 9)
})
