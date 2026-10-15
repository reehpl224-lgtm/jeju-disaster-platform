import assert from "node:assert/strict"
import test from "node:test"
import { resolveWarnings, warnIsActive, warnLvlLabel, warnLvlRisk, warnRisk } from "../src/data/warningLevel.ts"

const e = (tmFc, lvl, extra = {}) => ({ tmFc, tmEf: tmFc, regId: "L1091440", regionLabel: "서귀포시", wrn: "R", wrnLabel: "호우", lvl, lvlLabel: "", ...extra })

test("기상청 특보 수준 이름·등급: 1 예비특보, 2 주의보, 3 경보", () => {
  assert.deepEqual([warnLvlLabel("1"), warnLvlLabel("2"), warnLvlLabel("3")], ["예비특보", "주의보", "경보"])
  assert.deepEqual([warnLvlRisk("1"), warnLvlRisk("2"), warnLvlRisk("3")], ["warning", "warning", "alert"])
})

test("발표·변경·해제 이력을 구간으로 풀어 해제를 반영하고, 같은 시·종류·수준은 하나만 남긴다", () => {
  // 실제 서귀포시 호우: 주의보 발표 06:05 → 경보로 변경 07:10 → 주의보로 변경 09:00 → 주의보 해제 10:00 (최신순으로 들어온다)
  const list = [e("202610121000", "2", { cmd: "3" }), e("202610120900", "2", { cmd: "6" }), e("202610120710", "3", { cmd: "6" }), e("202610120605", "2", { cmd: "1" })]
  const out = resolveWarnings(list)
  assert.equal(out.length, 2)
  assert.deepEqual(out.map((x) => [x.lvl, x.tmFc, x.state, x.endAt]), [
    ["2", "202610120900", "released", "202610121000"],
    ["3", "202610120710", "changed", "202610120900"],
  ])
  assert.equal(out[1].changedLvl, "2")
  assert.equal(out.some(warnIsActive), false)
  // 해제되지 않은 발표는 발효 중, 다른 시·다른 종류는 따로 센다
  const live = resolveWarnings([...list.slice(1), e("202610121000", "2", { regionLabel: "제주시", regId: "L1091340", cmd: "1" }), e("202610121000", "2", { wrn: "W", cmd: "1" })])
  assert.equal(live.filter(warnIsActive).length, 3)
  assert.equal(live.length, 4)
})

test("해제 정보(CMD)가 없는 옛 응답은 가장 최근 발표만 남기고 발효 중으로 본다", () => {
  const out = resolveWarnings([e("202610121000", "2"), e("202610120900", "2"), e("202610120710", "3")])
  assert.equal(out.length, 2)
  assert.equal(out.every(warnIsActive), true)
})

test("24시간 창 앞에서 발표된 특보의 해제는 해제 기록으로 남긴다", () => {
  const out = resolveWarnings([e("202610120300", "2", { cmd: "3" })])
  assert.deepEqual(out.map((x) => [x.state, x.endAt]), [["released", "202610120300"]])
})

test("제주도 단계 기준: 태풍은 주의보·경보 모두 경계, 그 밖은 예비특보·주의보 주의 · 경보 경계", () => {
  assert.deepEqual(["1", "2", "3"].map((l) => warnRisk(l, "T")), ["warning", "alert", "alert"])
  assert.deepEqual(["1", "2", "3"].map((l) => warnRisk(l, "R")), ["warning", "warning", "alert"])
  assert.deepEqual(["1", "2", "3"].map((l) => warnRisk(l)), ["warning", "warning", "alert"])
})
