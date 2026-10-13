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
  assert.equal(stepText(METRICS.aqua[0], "alert"), "표층 염분 26psu 미만")
  assert.equal(kmaStageOf("1"), "caution")
  assert.equal(kmaStageOf("2"), "warning")
  assert.equal(kmaStageOf("3"), "alert")
  assert.equal(aquaTempLevel(28.5, 0), "warning")
  assert.equal(aquaTempLevel(28.5, 1), "alert")
  assert.equal(aquaTempLevel(28.5, 3), "danger")
  assert.equal(aquaTempLevel(24, 0), "safe")
})
