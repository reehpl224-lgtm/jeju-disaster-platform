import assert from "node:assert/strict"
import test from "node:test"
import { addLog, advanceOrder, closeIncident, emptyStore, incidentCsv, issueOrder, logsOf, openIncidentOf, ordersOf, summarize } from "../src/data/responseLogic.ts"

const t = (min) => new Date(2026, 9, 13, 10, min)

test("첫 기록이 사건을 열고 같은 서비스는 같은 사건 ID를 쓰며, 종료 뒤 새 기록은 다음 번호로 연다", () => {
  let s = addLog(emptyStore(), "river", { kind: "감지", text: "유량비 상승", by: "김" }, t(0))
  const id = openIncidentOf(s, "river").id
  assert.equal(id, "INC-20261013-RIV-01")
  s = addLog(s, "river", { kind: "메모", text: "현장 확인", by: "김" }, t(5))
  assert.equal(s.incidents.length, 1)
  assert.equal(logsOf(s, id).length, 2)
  s = closeIncident(s, "river", "김", t(30))
  assert.equal(openIncidentOf(s, "river"), undefined)
  s = addLog(s, "river", { kind: "감지", text: "재상승", by: "김" }, t(40))
  assert.equal(openIncidentOf(s, "river").id, "INC-20261013-RIV-02")
  assert.equal(openIncidentOf(s, "coast"), undefined)
})

test("지시는 지시→전달→수행 중→완료 순서로만 옮겨지고 결과가 이력에 남는다", () => {
  let s = issueOrder(emptyStore(), "coast", { title: "해수욕장 출입 통제", assignee: "현장 시설 운영자", dept: "해양 소관" }, "김", t(0))
  const o = s.orders[0]
  assert.equal(o.status, "지시")
  assert.equal(advanceOrder(s, o.id, "완료", "박", t(1)), s) // 건너뛰기 불가
  s = advanceOrder(s, o.id, "전달", "김", t(1))
  s = advanceOrder(s, o.id, "수행 중", "박", t(2))
  s = advanceOrder(s, o.id, "실패", "박", t(3), "통제선 부족")
  s = advanceOrder(s, o.id, "수행 중", "박", t(4))
  s = advanceOrder(s, o.id, "완료", "박", t(9), "통제 완료")
  const done = ordersOf(s, o.incidentId)[0]
  assert.equal(done.status, "완료")
  assert.equal(done.result, "통제 완료")
  assert.equal(done.events.length, 6)
  const kinds = logsOf(s, o.incidentId).map((l) => l.kind)
  assert.deepEqual(kinds, ["지시", "지시", "지시", "결과", "지시", "결과"])
})

test("사후분석 요약과 CSV", () => {
  let s = issueOrder(emptyStore(), "river", { title: "a", assignee: "x", dept: "" }, "김", t(0))
  const id = s.orders[0].id
  s = advanceOrder(advanceOrder(advanceOrder(s, id, "전달", "김", t(1)), id, "수행 중", "김", t(2)), id, "완료", "김", t(3), "끝")
  s = closeIncident(s, "river", "김", t(20))
  const sum = summarize(s)
  assert.equal(sum.incidents, 1)
  assert.equal(sum.avgMinutes, 20)
  assert.equal(sum.doneRate, 100)
  assert.equal(summarize(emptyStore()).avgMinutes, null)
  const csv = incidentCsv(s, s.incidents[0].id)
  assert.ok(csv.startsWith('"시각","구분","내용","기록자"'))
  assert.ok(csv.includes('"종료","상황 종료"'))
})
