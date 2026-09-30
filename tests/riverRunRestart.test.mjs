import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"

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
  load(url, context, next) {
    if (url.startsWith(src) && /\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), "utf8")
      return {
        format: "module", shortCircuit: true,
        source: ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
      }
    }
    return next(url, context)
  },
})

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
}

const { advance, approveAlert, approveDispatch, forceCloseRun, getRunState, loadTimeline, resetRun } = await import("../src/data/riverRunState.ts")
const { riverFlowRatioAnalysis } = await import("../src/data/riverFlowRatioAnalysis.ts")
const { riverAlertDispatch, riverClosure, riverDispatchRequest } = await import("../src/data/mockRiver.ts")
const points = [
  { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 70 },
  { location: "돈내코", observedAt: "2026-09-30 09:30", flowRatioPercent: 80 },
]

test("강제 종료 뒤 같은 시계열을 다시 업로드하면 새 실행으로 진행된다", () => {
  loadTimeline(points)
  advance()
  approveAlert()
  approveDispatch()
  const oldRunId = getRunState().runId
  forceCloseRun()
  assert.equal(getRunState().endReason, "예외 강제 종료")
  assert.equal(riverClosure.caseId, oldRunId)

  loadTimeline(points)
  const restarted = getRunState()
  assert.notEqual(restarted.runId, oldRunId)
  assert.equal(restarted.endedAtSim, undefined)
  assert.equal(restarted.endReason, undefined)
  assert.equal(restarted.alertSnapshot, undefined)
  assert.equal(restarted.dispatchSnapshot, undefined)
  assert.equal(restarted.playheadIndex, -1)
  assert.deepEqual(restarted.history, [])
  assert.equal(riverAlertDispatch.sentAt, "-")
  assert.equal(riverDispatchRequest.requestedAt, "-")
  assert.equal(riverClosure.caseId, "-")

  advance()
  assert.equal(getRunState().playheadIndex, 0)
  assert.equal(getRunState().pointState.돈내코.flowRatioPercent, 70)
  assert.equal(getRunState().endedAtSim, undefined)

  let reloadCount = 0
  globalThis.window = { location: { reload: () => { reloadCount += 1 } } }
  assert.equal(resetRun(), true)
  assert.equal(stored.has("jeju-ax-river-run"), false)
  assert.equal(reloadCount, 1)
})

test("상황 분석 Q% 추이는 현재 시점까지만 표시하고 지점별 직전 관측을 유지한다", () => {
  const timeline = [
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 20 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 30 },
    { location: "돈내코", observedAt: "2026-09-30 09:30", flowRatioPercent: 80 },
    { location: "쇠소깍", observedAt: "2026-09-30 10:00", flowRatioPercent: 90 },
  ]
  const { series, latest } = riverFlowRatioAnalysis({ timeline, playheadIndex: 2 })
  assert.deepEqual(series.map(({ donnaeko, soesokkak }) => [donnaeko, soesokkak]), [[20, 30], [80, 30]])
  assert.equal(latest.돈내코.observedAt, "2026-09-30 09:30")
  assert.equal(latest.쇠소깍.observedAt, "2026-09-30 09:00")
  assert.equal(series.some((row) => row.observedAt === "2026-09-30 10:00"), false)
})
