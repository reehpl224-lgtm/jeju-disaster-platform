import assert from "node:assert/strict"
import test from "node:test"
import { dedupeWarnings, warnLvlLabel, warnLvlRisk } from "../src/data/warningLevel.ts"

const e = (tmFc, lvl, extra = {}) => ({ tmFc, tmEf: tmFc, regId: "L1091440", regionLabel: "서귀포시", wrn: "R", wrnLabel: "호우", lvl, lvlLabel: "", ...extra })

test("기상청 특보 수준 이름·등급: 1 예비특보, 2 주의보, 3 경보", () => {
  assert.deepEqual([warnLvlLabel("1"), warnLvlLabel("2"), warnLvlLabel("3")], ["예비특보", "주의보", "경보"])
  assert.deepEqual([warnLvlRisk("1"), warnLvlRisk("2"), warnLvlRisk("3")], ["caution", "warning", "alert"])
})

test("같은 시·종류·수준의 반복 발표는 가장 최근 하나만 남기고 최신순을 유지한다", () => {
  // 주의보 06:05 → 경보 07:10 → 주의보 09:00 → 주의보 10:00 (최신순으로 들어온다)
  const list = [e("202610121000", "2"), e("202610120900", "2"), e("202610120710", "3"), e("202610120605", "2")]
  const out = dedupeWarnings(list)
  assert.equal(out.length, 2)
  assert.deepEqual(out.map((x) => `${x.lvl}@${x.tmFc}`), ["2@202610121000", "3@202610120710"])
  // 다른 시·다른 종류는 따로 센다
  assert.equal(dedupeWarnings([...list, e("202610121000", "2", { regionLabel: "제주시" }), e("202610121000", "2", { wrn: "W" })]).length, 4)
})
