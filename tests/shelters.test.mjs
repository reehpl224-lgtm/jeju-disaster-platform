import assert from "node:assert/strict"
import test from "node:test"
import { KINDS, regionOf } from "../scripts/fetch-shelters.mjs"

const kind = (id) => KINDS.find((k) => k.id === id)

// 2026-10-07 실제 응답에서 가져온 모양
const civil = { FCLT_NM: "미화아파트(지하주차장 1층)", FCLT_ADDR_RONA: "제주특별자치도 제주시 아란12길 8 (아라일동, 아라미화아파트)", SHNT_PSBLTY_NOPE: "1857", LAT_PROVIN: 33, LAT_MIN: 28, LAT_SEC: 14, LOT_PROVIN: 126, LOT_MIN: 32, LOT_SEC: 41, ORTM_UTLZ_TYPE: "기타시설", OPN_YN: "Y" }
const civilOther = { FCLT_NM: "태전동 미진아파트", FCLT_ADDR_RONA: "경기도 광주시 태봉로13번길 6", SHNT_PSBLTY_NOPE: "2632" }
const outdoor = { VT_ACMDFCLTY_NM: "한국국제고등학교 제2운동장", RN_DTL_ADRES: "제주특별자치도 서귀포시 대정읍 글로벌에듀로260번길 29", ARCD: "5013000000", LA: "33.287678", LO: "126.283443", VT_ACMD_PSBL_NMPR: 9208 }
const accommodation = { DSSTR_ACTC_FCLT_NM: "강정체육공원", STDG_CD: "5013011600", DSSTR_ACTC_PSBLTY_TNOP: 9905, LAT: 33.2344948655, LOT: 126.4862099501, DEL_YN: null }

test("행정시는 주소에서 뽑는다(서귀포 → 서귀포시, 그 밖의 제주 → 제주시, 제주가 아니면 빈 값)", () => {
  assert.equal(regionOf("제주특별자치도 서귀포시 대정읍"), "서귀포시")
  assert.equal(regionOf("제주특별자치도 제주시 아란12길"), "제주시")
  assert.equal(regionOf("경기도 광주시"), "")
})

test("민방위 대피소: 제주만 고르고 도분초 좌표를 소수 좌표로 바꾼다", () => {
  const k = kind("civil-defense")
  assert.ok(k.isJeju(civil))
  assert.equal(k.isJeju(civilOther), false)
  const item = k.toItem(civil)
  assert.equal(item.region, "제주시")
  assert.equal(item.capacity, 1857)
  assert.ok(Math.abs(item.lat - 33.470556) < 1e-5 && Math.abs(item.lng - 126.544722) < 1e-5)
})

test("옥외대피장소·수용시설: 제주 판별과 항목 변환", () => {
  const o = kind("quake-outdoor")
  assert.ok(o.isJeju(outdoor))
  assert.equal(o.toItem(outdoor).region, "서귀포시")
  assert.equal(o.toItem(outdoor).capacity, 9208)
  const a = kind("accommodation")
  assert.ok(a.isJeju(accommodation) && !a.isJeju({ STDG_CD: "4882025023" }))
  assert.equal(a.toItem(accommodation).region, "서귀포시") // 법정동코드 5013 = 서귀포시
  assert.equal(a.toItem(accommodation).name, "강정체육공원")
})

test("지진해일·지진 대피장소는 제주 코드(50)가 있어야만 제주로 본다", () => {
  assert.equal(kind("tsunami").isJeju({ ARCD: "4777000000", RN_DTL_ADRES: "경상북도 영덕군" }), false)
  assert.ok(kind("tsunami").isJeju({ ARCD: "5013000000" }))
  assert.equal(kind("quake-shelter").isJeju({ CTPV_NM: "부산광역시", ADDR: "부산광역시 강서구" }), false)
})
