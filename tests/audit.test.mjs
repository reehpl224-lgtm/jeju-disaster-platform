import assert from "node:assert/strict"
import test from "node:test"
import { appendAudit, auditCsv } from "../src/data/auditLogic.ts"

const t = (sec) => new Date(2026, 9, 13, 10, 0, sec)
const e = (o = {}) => ({ by: "김(a)", category: "시스템 변경", action: "e-SOP 절차 정의 수정", target: "river:alert", ...o })

test("같은 사람이 같은 일을 1분 안에 되풀이하면 한 줄로 묶고 횟수를 올린다", () => {
  let l = appendAudit([], e(), t(0))
  l = appendAudit(l, e(), t(10))
  l = appendAudit(l, e(), t(20))
  assert.equal(l.length, 1)
  assert.equal(l[0].count, 3)
  l = appendAudit(l, e({ target: "river:danger" }), t(25))
  assert.equal(l.length, 2)
  l = appendAudit(l, e({ target: "river:danger" }), t(25 + 61))
  assert.equal(l.length, 3)
})

test("보관 한도를 넘으면 오래된 것부터 버리고, CSV는 따옴표를 이스케이프한다", () => {
  let l = []
  for (let i = 0; i < 5; i++) l = appendAudit(l, e({ action: `일${i}` }), t(i), 3)
  assert.deepEqual(l.map((x) => x.action), ["일2", "일3", "일4"])
  const csv = auditCsv(appendAudit([], e({ action: '말 "인용"' }), t(0)))
  assert.ok(csv.startsWith('"시각","사용자","구분","내용","대상","횟수"'))
  assert.ok(csv.includes('"말 ""인용"""'))
})
