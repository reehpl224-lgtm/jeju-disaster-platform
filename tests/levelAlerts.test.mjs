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
const { LEVEL_SAMPLE, levelAlertsOf, levelStageOf } = await import("../src/data/levelAlerts.ts")
const { LEGACY_FEEDS } = await import("../src/data/legacyFeed.ts")

test("수위 단계: 기준과 같으면 넘은 것, 가장 높은 단계 하나, 미만이면 없음", () => {
  const p = { ...LEVEL_SAMPLE[0], steps: { 관심: 1, 주의: 2, 경계: 3, 심각: 4 } }
  assert.equal(levelStageOf({ ...p, levelM: 0.99 }), null)
  assert.equal(levelStageOf({ ...p, levelM: 1 }), "관심")
  assert.equal(levelStageOf({ ...p, levelM: 3 }), "경계")
  assert.equal(levelStageOf({ ...p, levelM: 9 }), "심각")
})

test("알림은 주의 이상만, 등급 매핑과 만료 시각이 맞다", () => {
  const alerts = levelAlertsOf(LEVEL_SAMPLE)
  assert.deepEqual(alerts.map((a) => [a.id, a.level]).sort(), [["level-lv-hancheon", "warning"], ["level-lv-j037", "alert"]])
  const a = alerts.find((x) => x.id === "level-lv-hancheon")
  assert.equal(a.expiresAt, "2026-10-13T10:40:00")
  assert.ok(a.title.includes("(샘플)"))
})

test("수신 항목 표의 판정이 알림과 같은 값에서 나온다", () => {
  for (const id of ["ls-river-mon", "ls-flood-warn"]) {
    const f = LEGACY_FEEDS[id]
    assert.equal(f.rows.length, LEVEL_SAMPLE.filter((p) => p.system === id).length)
    for (const r of f.rows) assert.equal(r.length, f.columns.length)
  }
  const judged = [...LEGACY_FEEDS["ls-river-mon"].rows, ...LEGACY_FEEDS["ls-flood-warn"].rows].filter((r) => r[4] !== "—").length
  assert.equal(judged, 2)
})
