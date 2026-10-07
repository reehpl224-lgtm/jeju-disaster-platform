import assert from "node:assert/strict"
import test from "node:test"
import { isJejuMsg, parseCrtDt, pickJejuRecent, toDisasterMsg } from "../vercel-proxy/kma-weather-proxy/lib/disasterMsg.ts"

// 2026-10-07 실제 응답 모양
const jeju = { SN: 900001, MSG_CN: "[제주특별자치도] 강풍경보 발효\r\n해안가 접근 자제", RCPTN_RGN_NM: "제주특별자치도 제주시 ", CRT_DT: "2026/10/06 11:05:30", EMRG_STEP_NM: "긴급재난", DST_SE_NM: "강풍" }
const other = { SN: 900002, MSG_CN: "실종자를 찾습니다", RCPTN_RGN_NM: "경기도 김포시 ", CRT_DT: "2026/10/06 12:00:00", EMRG_STEP_NM: "안전안내", DST_SE_NM: "기타" }
const old = { SN: 1, MSG_CN: "오래된 문자", RCPTN_RGN_NM: "제주특별자치도 서귀포시 ", CRT_DT: "2026/08/01 09:00:00", EMRG_STEP_NM: "안전안내", DST_SE_NM: "기타" }

test("CRT_DT를 KST ISO로 바꾼다", () => {
  assert.equal(parseCrtDt("2026/10/05 17:55:05"), "2026-10-05T17:55:05+09:00")
  assert.equal(parseCrtDt("2026-10-05 17:55"), "2026-10-05T17:55:00+09:00")
  assert.equal(parseCrtDt("-"), null)
})

test("제주 수신 여부는 지역명에 '제주'가 들어 있는가", () => {
  assert.ok(isJejuMsg(jeju) && isJejuMsg(old))
  assert.equal(isJejuMsg(other), false)
})

test("줄바꿈·공백을 정리하고, 시각이나 본문이 없으면 버린다", () => {
  assert.equal(toDisasterMsg(jeju).text, "[제주특별자치도] 강풍경보 발효 해안가 접근 자제")
  assert.equal(toDisasterMsg({ ...jeju, CRT_DT: "" }), null)
  assert.equal(toDisasterMsg({ ...jeju, MSG_CN: "  " }), null)
})

test("제주 문자 중 최근 N일만 최신순으로 고른다", () => {
  const now = new Date("2026-10-07T00:00:00+09:00")
  const picked = pickJejuRecent([old, other, jeju], now, 14)
  assert.deepEqual(picked.map((m) => m.id), ["900001"])
  assert.equal(pickJejuRecent([old, other, jeju], now, 90).length, 2)
})
