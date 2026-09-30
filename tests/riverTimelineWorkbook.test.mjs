import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"

const src = new URL("../src/", import.meta.url).href
const nodeReader = new URL("../node_modules/read-excel-file/node/index.js", import.meta.url).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "read-excel-file/browser") {
      return { url: new URL("./test-excel-reader.js", import.meta.url).href, shortCircuit: true }
    }
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
    if (url.endsWith("/test-excel-reader.js")) {
      return { format: "module", shortCircuit: true, source: `import { readSheet as read } from ${JSON.stringify(nodeReader)}; export async function readSheet(file, sheet) { return read(Buffer.from(await file.arrayBuffer()), sheet) }` }
    }
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

const { parseRiverTimelineWorkbook } = await import("../src/data/riverTimelineWorkbook.ts")
const template = readFileSync(new URL("../public/하천_시나리오_시간별입력_템플릿.xlsx", import.meta.url))
const file = (bytes) => new File([bytes], "test.xlsx")

test("템플릿의 예시 7행을 그대로 파싱한다", async () => {
  const points = await parseRiverTimelineWorkbook(file(template))
  assert.equal(points.length, 7)
  assert.deepEqual(points[0], { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 10 })
  assert.ok(points.every((p) => p.location === "돈내코" || p.location === "쇠소깍"))
})

test("같은 지점·같은 시각 중복은 거부한다", async () => {
  const dupFixture = readFileSync(new URL("./fixtures/river-timeline-duplicate.xlsx", import.meta.url))
  await assert.rejects(() => parseRiverTimelineWorkbook(file(dupFixture)), /중복됩니다/)
})
