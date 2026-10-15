// 코드에 있는 기준값(위험 단계 조건·메시지 유형·글자 수 제한·보고체계·전파 채널)을 docs/db/seed-reference.sql로 뽑는다.
// 기준값을 바꾼 뒤 `npm run db:seed`로 다시 만들면 DB 시드와 코드가 어긋나지 않는다. (TS 파일을 읽으려고 tests와 같은 방식의 로더를 쓴다)
import { readFileSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
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

const { METRICS, KMA_SERVICES, kmaStageText, CRITERIA_STAGES } = await import("../src/data/riskCriteria.ts")
const { MSG_KINDS, MSG_LIMITS } = await import("../src/data/messageTemplates.ts")
const { reportingChain, propagationChannels } = await import("../src/data/mockPropagation.ts")

const q = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`)
const out = ["-- 자동 생성 파일 — scripts/db-seed.mjs (npm run db:seed). 직접 고치지 말고 코드의 기준값을 고친 뒤 다시 만든다.", "-- schema.sql과 seed.sql을 실행한 뒤 실행한다.", ""]

for (const [service, specs] of Object.entries(METRICS)) {
  for (const m of specs) {
    out.push(`INSERT INTO risk_metric (service_id, metric_id, label, unit, direction, note) VALUES (${q(service)}, ${q(m.id)}, ${q(m.label)}, ${q(m.unit)}, ${q(m.direction)}, ${q(m.note)});`)
    for (const s of m.steps) out.push(`INSERT INTO risk_threshold (service_id, metric_id, risk_code, threshold, is_strict) VALUES (${q(service)}, ${q(m.id)}, ${q(s.level)}, ${s.value}, ${s.strict ? "TRUE" : "FALSE"});`)
  }
}
for (const service of KMA_SERVICES) {
  for (const { level } of CRITERIA_STAGES) out.push(`INSERT INTO risk_stage_text (service_id, risk_code, body) VALUES (${q(service)}, ${q(level)}, ${q(kmaStageText(service, level))});`)
}
for (const k of MSG_KINDS) out.push(`INSERT INTO message_kind (id, label, channel, note) VALUES (${q(k.id)}, ${q(k.label)}, ${q(k.channel)}, ${q(k.note)});`)
for (const l of MSG_LIMITS) out.push(`INSERT INTO message_limit (id, label, max_chars) VALUES (${q(l.id)}, ${q(l.label)}, ${l.max});`)
reportingChain.forEach((r, i) => out.push(`INSERT INTO reporting_chain_step (id, seq, label, role) VALUES (${q(r.id)}, ${i + 1}, ${q(r.label)}, ${q(r.role)});`))
for (const c of propagationChannels) out.push(`INSERT INTO propagation_channel (id, name, detail) VALUES (${q(c.id)}, ${q(c.name)}, ${q(c.detail)});`)

writeFileSync(new URL("../docs/db/seed-reference.sql", import.meta.url), out.join("\n") + "\n", "utf8")
console.log(`seed-reference.sql: ${out.length - 3} rows`)
