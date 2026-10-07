import assert from "node:assert/strict"
import test from "node:test"
import { isJeju, shelterType, toShelter } from "../scripts/fetch-heat-shelters.mjs"

// 2026-10-07 실제 응답에서 가져온 모양(제주 서귀포시·정원 없음 / 제주시 경로당)
const lib = { RSTR_FCLTY_NO: 5013000394, RSTR_NM: "제남도서관", RN_DTL_ADRES: "제주특별자치도 서귀포시 남원읍 남원체육관로 183 (제남도서관)", ARCD: "5013025000", USE_PSBL_NMPR: null }
const senior = { RSTR_FCLTY_NO: 50110289, RSTR_NM: "제성마을경로당", RN_DTL_ADRES: "제주특별자치도 제주시   제성3길 20 ", ARCD: "5011025000", USE_PSBL_NMPR: 32 }

test("시설 유형은 이름으로 나누고 없으면 기타", () => {
  assert.equal(shelterType("대흘1리경로당"), "경로당")
  assert.equal(shelterType("한림마을회관"), "마을회관")
  assert.equal(shelterType("서귀포노인복지관"), "복지관")
  assert.equal(shelterType("제남도서관"), "기타")
})

test("제주 판별: 시도코드 50 또는 제주 도로명주소", () => {
  assert.ok(isJeju(lib))
  assert.ok(isJeju({ ARCD: "", RN_DTL_ADRES: "제주특별자치도 제주시 x" }))
  assert.equal(isJeju({ ARCD: "2812552000", RN_DTL_ADRES: "인천광역시 제물포구 x" }), false)
})

test("주소 공백·도 이름을 정리하고 정원이 없으면 null로 둔다", () => {
  assert.deepEqual(toShelter(senior), { id: "50110289", name: "제성마을경로당", region: "제주시", address: "제주시 제성3길 20", type: "경로당", capacity: 32 })
  const s = toShelter(lib)
  assert.equal(s.region, "서귀포시")
  assert.equal(s.capacity, null) // 0이 아니라 null — 화면이 '정원 미등록'으로 표시한다
})
