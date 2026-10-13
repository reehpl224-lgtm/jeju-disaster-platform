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

const { advanceIssue, buildChecks, recheckIssue, registerIssue } = await import("../src/data/integrationLogic.ts")
const { generatePilotBatch } = await import("../src/data/pilotBatch/generate.ts")

const now = (m) => new Date(2026, 9, 13, 10, m)
const base = { nullSources: [], sourcesLoaded: true, cctv: { phase: "ready", receivedFeeds: 3 }, batch: null, eventIds: ["a", "b"] }

test("수신 점검: 못 받은 출처·CCTV 일부 수신을 오류로 잡고, 받는 중에는 점검하지 않는다", () => {
  const ok = buildChecks(base)
  assert.ok(ok.every((c) => c.ok))
  const bad = buildChecks({ ...base, nullSources: ["재난문자"], cctv: { phase: "partial", receivedFeeds: 2 } })
  assert.deepEqual(bad.filter((c) => !c.ok).map((c) => c.id), ["recv:재난문자", "recv:CCTV"])
  assert.equal(bad.find((c) => c.id === "recv:CCTV").type, "일부 수신 실패")
  assert.equal(buildChecks({ ...base, sourcesLoaded: false, cctv: { phase: "loading", receivedFeeds: 0 } }).length, 1)
})

test("값 대조: 원본 등급이 화면 판정과 다르면 값 불일치, 이벤트 ID 중복도 잡는다", () => {
  const batch = generatePilotBatch(new Date(2026, 9, 13, 10, 0))
  assert.ok(buildChecks({ ...base, batch }).every((c) => c.ok))
  const broken = structuredClone(batch)
  broken.river.points[0].level = broken.river.points[0].level === "danger" ? "safe" : "danger"
  const c = buildChecks({ ...base, batch: broken }).filter((x) => !x.ok)
  assert.equal(c.length, 1)
  assert.equal(c[0].type, "값 불일치")
  assert.ok(c[0].raw && c[0].shown)
  assert.equal(buildChecks({ ...base, eventIds: ["a", "a", "b"] }).find((x) => x.id === "dup:event-id").ok, false)
})

test("오류 처리: 접수는 중복되지 않고, 완료는 재검증이 정상일 때만 된다", () => {
  let l = registerIssue([], { checkId: "recv:CCTV", system: "CCTV", type: "수신 실패", detail: "x" }, "김", now(0))
  assert.equal(registerIssue(l, { checkId: "recv:CCTV", system: "CCTV", type: "수신 실패", detail: "x" }, "김", now(1)).length, 1)
  const id = l[0].id
  assert.equal(advanceIssue(l, id, "재검증", "김", now(2)), l) // 건너뛰기 불가
  l = advanceIssue(l, id, "수정 중", "김", now(2), "프록시 재배포")
  l = advanceIssue(l, id, "재검증", "김", now(3))
  assert.equal(advanceIssue(l, id, "완료", "김", now(4)), l) // 재검증 결과 없음
  l = recheckIssue(l, id, { ok: false, text: "여전히 실패" }, now(4))
  assert.equal(advanceIssue(l, id, "완료", "김", now(5)), l)
  l = advanceIssue(l, id, "수정 중", "김", now(5))
  l = advanceIssue(l, id, "재검증", "김", now(6))
  assert.equal(l[0].lastCheck, undefined) // 다시 재검증 단계로 오면 이전 결과는 지운다
  l = recheckIssue(l, id, { ok: true, text: "3/3종 수신" }, now(7))
  l = advanceIssue(l, id, "완료", "김", now(8))
  assert.equal(l[0].status, "완료")
  assert.equal(l[0].events.length, 6)
  // 완료된 점검은 같은 점검으로 다시 접수할 수 있다
  assert.equal(registerIssue(l, { checkId: "recv:CCTV", system: "CCTV", type: "수신 실패", detail: "x" }, "김", now(9)).length, 2)
})
