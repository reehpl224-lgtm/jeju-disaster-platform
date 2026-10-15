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

const { MSG_KINDS, MSG_SERVICES, buildMessage, checkLength, channelOf, gradeText } = await import("../src/data/messageTemplates.ts")

test("재난문자 문안: 모든 유형·문안 종류가 휴대폰 90자(CBS) 안에 들어오고 시각·지역·행동 지시를 담는다", () => {
  for (const svc of MSG_SERVICES) {
    for (const k of MSG_KINDS) {
      const m = buildMessage(svc, k.id, "alert", "", "15:00")
      assert.ok(m.startsWith("[제주도] 15:00"), `${svc} ${k.id}`)
      const cbs = checkLength(m).find((c) => c.id === "cbs")
      assert.ok(cbs.ok, `${svc} ${k.id} ${cbs.len}자: ${m}`)
    }
  }
})

test("문안 규칙: 특보 서비스는 주의보·경보, 대피명령만 긴급재난 채널·과태료 안내, 글자 수 점검은 공백 포함", () => {
  assert.equal(gradeText("heavy-rain", "warning"), "주의보")
  assert.equal(gradeText("heavy-rain", "danger"), "경보")
  assert.equal(gradeText("river", "alert"), "경계 단계")
  assert.equal(channelOf("order"), "긴급재난")
  assert.deepEqual(MSG_KINDS.filter((k) => k.channel === "긴급재난").map((k) => k.id), ["order"])
  assert.match(buildMessage("river", "order", "danger", "", "09:00"), /200만원 이하 과태료/)
  assert.equal(checkLength("가 나").find((c) => c.id === "cbs").len, 3)
  assert.equal(checkLength("가".repeat(91)).find((c) => c.id === "cbs").ok, false)
})
