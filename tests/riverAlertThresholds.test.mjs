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

const { classifyRiverRisk } = await import("../src/data/riverAlertThresholds.ts")
const { riverStageCriteria } = await import("../src/data/mockRiver.ts")

test("riverStageCriteria 경계값과 정확히 일치한다", () => {
  assert.equal(classifyRiverRisk(0), "safe")
  assert.equal(classifyRiverRisk(19.9), "safe")
  assert.equal(classifyRiverRisk(20), "caution")
  assert.equal(classifyRiverRisk(49.9), "caution")
  assert.equal(classifyRiverRisk(50), "warning")
  assert.equal(classifyRiverRisk(69.9), "warning")
  assert.equal(classifyRiverRisk(70), "alert")
  assert.equal(classifyRiverRisk(99.9), "alert")
  assert.equal(classifyRiverRisk(100), "danger")
  assert.equal(classifyRiverRisk(150), "danger")
})

test("riverStageCriteria에 정의된 5단계와 순서가 같다", () => {
  assert.deepEqual(riverStageCriteria.map((c) => c.level), ["safe", "caution", "warning", "alert", "danger"])
})
