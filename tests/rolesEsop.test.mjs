import assert from "node:assert/strict"
import test from "node:test"
import { canAccess, defaultPolicy, mergePolicy, serviceOf } from "../src/data/rolesLogic.ts"
import { currentLevel, defaultSteps, moveStep, stepsOf } from "../src/data/esopLogic.ts"

test("역할별 접근 범위: 화면 권한과 서비스 범위를 각각 본다", () => {
  const p = defaultPolicy()
  assert.equal(canAccess("admin", "/roles", p), true)
  assert.equal(canAccess("control", "/roles", p), false)
  assert.equal(canAccess("vendor", "/monitoring", p), true)
  assert.equal(canAccess("vendor", "/approvals", p), false)
  assert.equal(canAccess("field", "/river/alert", p), true)
  assert.equal(canAccess("field", "/heavy-rain", p), false)
  assert.equal(canAccess("restricted", "/dashboard", p), false)
  assert.equal(canAccess("field", "/vlm", p), true)
  assert.equal(serviceOf("/heavy-rain/dashboard"), "heavy-rain")
})

test("저장된 정의가 깨졌거나 모자라도 기본값 위에 합치고, 관리자는 잠기지 않는다", () => {
  assert.deepEqual(mergePolicy("깨짐"), defaultPolicy())
  const m = mergePolicy({ perms: { admin: { roles: false }, vendor: { reports: true } }, services: { field: ["coast", "없는서비스"] } })
  assert.equal(m.perms.admin.roles, true)
  assert.equal(m.perms.vendor.reports, true)
  assert.deepEqual(m.services.field, ["coast"])
})

test("e-SOP 절차: 고친 값이 우선, 없으면 샘플, 순서 이동은 범위를 지킨다", () => {
  assert.ok(defaultSteps("river", "danger").length >= 3)
  const edited = [{ id: "x", target: "a", dept: "b", action: "c" }]
  assert.deepEqual(stepsOf({ "river:danger": edited }, "river", "danger"), edited)
  assert.deepEqual(stepsOf({}, "river", "danger"), defaultSteps("river", "danger"))
  assert.deepEqual(moveStep([1, 2, 3], 0, -1), [1, 2, 3])
  assert.deepEqual(moveStep([1, 2, 3], 0, 1), [2, 1, 3])
  assert.equal(currentLevel({ caution: 2, alert: 1, danger: 0 }), "alert")
  assert.equal(currentLevel({}), undefined)
})

test("e-SOP 초기값: 단계가 오를수록 절차가 늘고, 모든 칸이 채워지며, 심각에는 승인 권한자가 있다", () => {
  const n = (lv) => defaultSteps("heavy-rain", lv).length
  assert.ok(n("warning") < n("alert") && n("alert") <= n("danger"))
  for (const lv of ["warning", "alert", "danger"]) {
    const steps = defaultSteps("river", lv)
    assert.equal(new Set(steps.map((x) => x.id)).size, steps.length)
    assert.ok(steps.every((x) => x.target.trim() && x.dept.trim() && x.action.trim()))
  }
  assert.ok(defaultSteps("coast", "danger").some((x) => /관리자|의사결정/.test(x.target)))
})
