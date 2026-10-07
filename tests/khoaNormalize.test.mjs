import assert from "node:assert/strict"
import test from "node:test"
import { extractKhoaItems, normalizeKhoaItems } from "../vercel-proxy/kma-weather-proxy/lib/khoa.ts"
import { toKhoaArrays } from "../src/data/khoaMapping.ts"

// 명세서(3-4·3-5절) 응답 예시 모양
const tideRow = { obsvtrNm: "모슬포", iot: "126.25", lat: "33.21", obsrvnDt: "2026-10-07 10:00", wndrct: "344.00", wspd: "5.0", artmp: "21.4", atmpr: "1012.4", wtem: "22.90", bscTdlvHgt: "133.00", slntQty: "33.90", crdir: "", crsp: "" }
const buoyRow = { obsvtrNm: "중문해수욕장", iot: "126.4", lat: "33.24", obsrvnDt: "2026-10-07 10:00", wndrct: "77.84", wspd: "3.7", artmp: "20.4", atmpr: "1002.1", wvhgt: "0.3", wvpd: "3.2", crdir: "276.04", crsp: "10.30", wtem: "22.55", sIntQty: "31.40" }

test("항목을 숫자로 바꾸고 시각 오름차순으로 정렬한다", () => {
  const rows = normalizeKhoaItems([{ ...tideRow, obsrvnDt: "2026-10-07 11:00" }, tideRow, { obsvtrNm: "x" }])
  assert.equal(rows.length, 2)
  assert.equal(rows[0].observedAt, "2026-10-07 10:00")
  assert.equal(rows[0].values.tideCm, 133)
  assert.equal(rows[0].values.salinityPsu, 33.9)
  assert.equal(rows[0].values.currentSpeedCms, undefined) // 빈 문자열은 값 없음
})

test("염분 철자 sIntQty도 읽고 파고·주기를 옮긴다", () => {
  const [row] = normalizeKhoaItems([buoyRow])
  assert.equal(row.values.salinityPsu, 31.4)
  assert.equal(row.values.waveHeightM, 0.3)
  assert.equal(row.values.wavePeriodSec, 3.2)
})

test("항목이 하나뿐이어서 객체로 와도 목록으로 꺼낸다", () => {
  assert.equal(extractKhoaItems({ response: { body: { items: { item: tideRow } } } }).length, 1)
  assert.equal(extractKhoaItems({ response: { body: { items: { item: [tideRow, tideRow] } } } }).length, 2)
  assert.equal(extractKhoaItems({}).length, 0)
})

test("화면 배열: 값이 모자란 관측점은 빼고 조위 시계열을 채운다", () => {
  const [t] = normalizeKhoaItems([tideRow])
  const [b] = normalizeKhoaItems([buoyRow])
  const out = toKhoaArrays([
    { code: "DT_0023", kind: "tide", name: "모슬포", latest: t, series: [{ time: "10:00", tideLevelCm: 133 }] },
    { code: "TW_0075", kind: "buoy", name: "중문해수욕장", latest: b, series: [] },
    { code: "KG_0021", kind: "buoy", name: "제주남부", latest: { observedAt: "2026-10-07 10:00", values: { waveHeightM: 0.5 } }, series: [] },
  ])
  assert.deepEqual(out.buoys.map((x) => x.stationCode), ["TW_0075"]) // 제주남부는 풍속·기압이 없어 뺀다
  assert.equal(out.observations.length, 2) // 모슬포(조위관측소)·중문(부이) — 수온·염분이 있는 곳만
  assert.equal(out.observations[0].kind, "조위관측소")
  assert.equal(out.observations[1].currentSpeedCms, 10.3)
  assert.equal(out.observations[0].currentSpeedCms, undefined)
  assert.deepEqual(out.tide, { series: [{ time: "10:00", tideLevelCm: 133 }], observedAt: "2026-10-07 10:00" })
})
