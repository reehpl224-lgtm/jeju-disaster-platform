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

const { blankScenario, evaluateRun, passRate, phaseLevel, presetScenarios, runScenario } = await import("../src/data/scenarioLogic.ts")
const { defaultSteps } = await import("../src/data/esopLogic.ts")

const start = new Date(2026, 9, 13, 10, 0)

test("프리셋 시나리오는 정의표 기준으로 기대 단계와 같고, 전파·지시가 모두 이어진다", () => {
  const presets = presetScenarios()
  assert.equal(presets.length, 4)
  for (const s of presets) {
    const run = runScenario(s, {}, start)
    const checks = evaluateRun(run)
    assert.ok(checks.every((c) => c.ok), `${s.name}: ${checks.filter((c) => !c.ok).map((c) => c.kind + c.text).join(", ")}`)
    assert.equal(passRate(checks), 100)
  }
})

test("단계 시각은 앞 단계로부터의 경과 분을 더해 간다", () => {
  const run = runScenario(presetScenarios()[0], {}, start)
  assert.deepEqual(run.phases.map((p) => new Date(p.at).getMinutes() + new Date(p.at).getHours() * 60), [600, 620, 635, 650])
  assert.equal(run.phases[3].level, "danger")
  assert.match(run.phases[2].alert.title, /^\[시험\] 하천범람 경계/)
})

test("기대와 다른 값, 전파 대상이 비게 고친 e-SOP, 승인자가 빠진 심각 단계를 시험이 잡는다", () => {
  const s = presetScenarios()[0]
  const wrong = structuredClone(s)
  wrong.phases[1].value = 15 // 주의를 기대하지만 15%는 정상
  const r1 = evaluateRun(runScenario(wrong, {}, start)).filter((c) => !c.ok)
  assert.deepEqual(r1.map((c) => c.kind), ["단계 판정"])
  const noTarget = { "river:warning": [] }
  assert.ok(evaluateRun(runScenario(s, noTarget, start)).some((c) => !c.ok && c.kind === "상황 전파"))
  const steps = defaultSteps("river", "danger").filter((x) => !/의사결정|관리자/.test(x.target))
  assert.ok(evaluateRun(runScenario(s, { "river:danger": steps }, start)).some((c) => !c.ok && c.kind === "승인자 지정"))
})

test("값 → 단계: 기상청 특보 서비스는 1·2·3·4, 지표 서비스는 정의표", () => {
  const rain = presetScenarios()[3]
  assert.deepEqual([0, 1, 2, 3, 4].map((v) => phaseLevel(rain, v)), ["normal", "caution", "warning", "alert", "danger"])
  const coast = presetScenarios()[1]
  assert.equal(phaseLevel(coast, 0.5), "normal")
  assert.equal(phaseLevel(coast, 4.01), "danger")
  assert.equal(blankScenario("aqua").metricId, "salinity")
  assert.equal(blankScenario("snow").metricId, "kma")
})
