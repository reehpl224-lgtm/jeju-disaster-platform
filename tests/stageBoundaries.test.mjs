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

const { classifySalinity, classifyTemperature, classifyMarineRisk } = await import("../src/data/marineAlertThresholds.ts")
const { classifyWave, classifyWind, classifyCoastRisk } = await import("../src/data/coastAlertThresholds.ts")

test("저염분·고수온 4단계: 경계값은 높은 단계에 포함(28.0 주의 · 26.0 경계 · 24.0 심각), 관심 구간은 정상", () => {
  assert.deepEqual([30.9, 28.1, 28.0, 26.1, 26.0, 24.1, 24.0, 20].map(classifySalinity), ["NORMAL", "NORMAL", "WATCH", "WATCH", "ALERT", "ALERT", "CRITICAL", "CRITICAL"])
  assert.equal(classifyTemperature(27.9), "NORMAL") // 25.1~27.9℃ 징후 감시
  assert.deepEqual([0, 1, 3].map((d) => classifyTemperature(28, d)), ["WATCH", "ALERT", "CRITICAL"])
  assert.equal(classifyMarineRisk(28.1, 26.5), "NORMAL") // 수온 징후 + 염분 정상 → 정상
  assert.equal(classifyMarineRisk(28.0, 26.5), "WATCH") // 복합 주의
  assert.equal(classifyMarineRisk(27, 28.5), "ALERT") // 수온 28℃↑ AND 염분 28 이하 → 최소 경계
  assert.equal(classifyMarineRisk(25.5, 28.5), "CRITICAL") // 수온 28℃↑ AND 염분 26 이하 → 심각
})

test("연안 4단계: 파고 1.5 주의 · 2.5 경계 · 4.0 초과 심각, 풍속 10 · 14 · 20 초과, 1.0~1.5m는 정상(징후 감시)", () => {
  assert.deepEqual([1.2, 1.5, 2.4, 2.5, 4.0, 4.1].map(classifyWave), ["safe", "warning", "warning", "alert", "alert", "danger"])
  assert.deepEqual([6, 9.9, 10, 14, 20, 20.1].map(classifyWind), ["safe", "safe", "warning", "alert", "alert", "danger"])
  assert.equal(classifyCoastRisk({ waveM: 1.2 }).level, "safe")
  assert.equal(classifyCoastRisk({ waveM: 1.2, tide: "고조 도달" }).level, "warning") // 징후 감시 + 고조 → 한 단계 상향
  assert.equal(classifyCoastRisk({ waveM: 0.5, tide: "고조 도달" }).level, "safe")
  assert.equal(classifyCoastRisk({ waveM: 2.0, tide: "고조 도달" }).level, "alert")
  assert.equal(classifyCoastRisk({ event: "위험구역 진입" }).level, "safe") // 징후 감시
  assert.equal(classifyCoastRisk({ event: "월파 감지" }).level, "alert")
})
