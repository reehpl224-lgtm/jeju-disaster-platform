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

const { ACTUAL_CLASSIFIER, METRICS, aquaTempLevel, classifyMetric, kmaStageOf, stepText } = await import("../src/data/riskCriteria.ts")

test("정의표의 경계값이 화면이 쓰는 판정 함수와 모든 경계에서 같다", () => {
  const specs = Object.values(METRICS).flat()
  assert.equal(specs.length, 4)
  for (const spec of specs) {
    const probes = spec.steps.flatMap((s) => [s.value - 0.01, s.value, s.value + 0.01])
    for (const v of [...probes, 0, 1000, -5]) {
      assert.equal(classifyMetric(spec, v), ACTUAL_CLASSIFIER[spec.id](v), `${spec.id} ${v}`)
    }
  }
})

test("문구와 기상청 등급·수온 지속 규칙", () => {
  const wave = METRICS.coast.find((m) => m.id === "wave")
  assert.equal(stepText(wave, "danger"), "유의파고 4m 초과")
  assert.equal(stepText(METRICS.aqua[0], "alert"), "표층 염분 26psu 이하")
  assert.equal(kmaStageOf("1"), "warning") // 예비특보는 주의(행안부 매뉴얼, 관심 단계 없음)
  assert.equal(kmaStageOf("2", "T"), "alert") // 태풍주의보는 경계(제주도 재난대응 단계 및 요령)
  assert.equal(kmaStageOf("2"), "warning")
  assert.equal(kmaStageOf("3"), "alert")
  assert.equal(aquaTempLevel(28.5, 0), "warning")
  assert.equal(aquaTempLevel(28.5, 1), "alert")
  assert.equal(aquaTempLevel(28.5, 3), "danger")
  assert.equal(aquaTempLevel(24, 0), "safe")
  assert.equal(aquaTempLevel(27.9, 0), "safe") // 25.1~27.9℃는 징후 감시(정상)
})

test("4단계: 관심 구간은 정상에 합쳐지고, 경계값은 높은 단계에 포함된다", () => {
  const [flow] = METRICS.river
  assert.deepEqual(flow.steps.map((s) => s.level), ["warning", "alert", "danger"])
  assert.equal(classifyMetric(flow, 49.9), "safe")
  assert.equal(classifyMetric(flow, 50), "warning")
  const sal = METRICS.aqua[0]
  assert.equal(classifyMetric(sal, 28.1), "safe")
  assert.equal(classifyMetric(sal, 28.0), "warning")
  assert.equal(classifyMetric(sal, 26.0), "alert")
  assert.equal(classifyMetric(sal, 24.0), "danger")
  assert.equal(classifyMetric(sal, 24.1), "alert")
})

test("심각 자동 판정 — 호우: 경계 3시간 + 극한호우, 해제는 30분 유지", async () => {
  const { isSevere, severeCriteriaText } = await import("../src/data/severeRule.ts")
  const m = { rain1h: 75 }
  assert.equal(isSevere("heavy-rain", { alertMin: 179, metrics: m }), false)
  assert.equal(isSevere("heavy-rain", { alertMin: 180, metrics: m }), true)
  assert.equal(isSevere("heavy-rain", { alertMin: 200, metrics: { rain1h: 50, rain3h: 90 } }), true)
  assert.equal(isSevere("heavy-rain", { alertMin: 200, metrics: { rain1h: 50, rain3h: 80 } }), false)
  assert.equal(isSevere("heavy-rain", { alertMin: 200, metrics: { rain1h: 10 }, wasSevere: true, belowMin: 20 }), true)
  assert.equal(isSevere("heavy-rain", { alertMin: 200, metrics: { rain1h: 10 }, wasSevere: true, belowMin: 31 }), false)
  assert.equal(isSevere("snow", { alertMin: 999, metrics: { rain1h: 999 } }), false)
  assert.match(severeCriteriaText("typhoon"), /6시간/)
})

test("심각 자동 판정 — 태풍: 경계 6시간 + 44m/s", async () => {
  const { isSevere } = await import("../src/data/severeRule.ts")
  assert.equal(isSevere("typhoon", { alertMin: 360, metrics: { windMs: 44 } }), true)
  assert.equal(isSevere("typhoon", { alertMin: 359, metrics: { windMs: 50 } }), false)
  assert.equal(isSevere("typhoon", { alertMin: 400, metrics: { windMs: 43.9 } }), false)
})
