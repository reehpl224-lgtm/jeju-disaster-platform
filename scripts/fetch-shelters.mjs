// 행정안전부 재난안전데이터공유플랫폼(safetydata.go.kr)의 대피·수용 시설 5종에서 제주만 골라 public/data/shelters-jeju.json으로 저장한다.
//
//   SAFETYDATA_KEY_00195=… SAFETYDATA_KEY_10944=… SAFETYDATA_KEY_00706=… SAFETYDATA_KEY_10943=… SAFETYDATA_KEY_00008=… node scripts/fetch-shelters.mjs
//
// 키가 없는 서비스는 건너뛴다(기존 파일의 그 서비스는 유지하지 않고 비운다 — 일부만 갱신하려면 전체 키를 같이 준다).
// 왜 앱이 직접 호출하지 않고 파일로 받아 두는가: 안전데이터 서비스키는 신청한 IP에서만 통하는 경우가 있고(무더위쉼터와 같은 이유),
// 시설 목록은 자주 바뀌지 않아 실시간일 필요가 없다. 키를 앱·프록시에 넣지 않아도 된다.
import { writeFileSync } from "node:fs"

const URL_BASE = "https://www.safetydata.go.kr/V2/api"
const PAGE = 1000

const num = (v) => {
  const n = Number(v)
  return v === null || v === undefined || v === "" || !Number.isFinite(n) ? null : n
}
const round = (n, d = 6) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d)
const dms = (deg, min, sec) => (num(deg) === null ? null : round(Number(deg) + Number(min ?? 0) / 60 + Number(sec ?? 0) / 3600))
const clean = (s) => (s === null || s === undefined ? "" : String(s).replace(/\s+/g, " ").trim())
/** 제주도 주소에서 행정시를 뽑는다(없으면 제주시로 보지 않고 빈 값) */
export const regionOf = (address) => (address.includes("서귀포") ? "서귀포시" : /제주/.test(address) ? "제주시" : "")
const isJejuAddress = (a) => /^제주/.test(clean(a))

/** 시설 종류별 — api(서비스 번호), 제주 판별, 응답 한 줄 → 화면용 항목 */
export const KINDS = [
  {
    id: "civil-defense",
    api: "DSSP-IF-00195",
    label: "민방위 대피소",
    isJeju: (r) => isJejuAddress(r.FCLT_ADDR_RONA) || isJejuAddress(r.FCLT_ADDR_LOTNO),
    toItem: (r) => {
      const address = clean(r.FCLT_ADDR_RONA) || clean(r.FCLT_ADDR_LOTNO)
      return { name: clean(r.FCLT_NM), address, region: regionOf(address), capacity: num(r.SHNT_PSBLTY_NOPE), lat: dms(r.LAT_PROVIN, r.LAT_MIN, r.LAT_SEC), lng: dms(r.LOT_PROVIN, r.LOT_MIN, r.LOT_SEC), detail: clean(r.ORTM_UTLZ_TYPE), open: r.OPN_YN !== "N" }
    },
  },
  {
    id: "tsunami",
    api: "DSSP-IF-10944",
    label: "지진해일 긴급대피장소",
    isJeju: (r) => String(r.ARCD ?? "").startsWith("50") || isJejuAddress(r.RN_DTL_ADRES) || isJejuAddress(r.SHNT_PLACE_DTL_POSITION),
    toItem: (r) => {
      const address = clean(r.RN_DTL_ADRES) || clean(r.SHNT_PLACE_DTL_POSITION)
      return { name: clean(r.SHNT_PLACE_NM), address, region: regionOf(address), capacity: num(r.PSBL_NMPR), lat: round(num(r.LA)), lng: round(num(r.LO)), detail: r.EV_ANTCTY === null || r.EV_ANTCTY === undefined ? "" : `해안 대피 ${r.EV_ANTCTY}m`, open: r.USE_AT !== "N" }
    },
  },
  {
    id: "quake-shelter",
    api: "DSSP-IF-00706",
    label: "지진 대피장소",
    isJeju: (r) => String(r.CTPV_NM ?? "").includes("제주") || isJejuAddress(r.ADDR),
    toItem: (r) => {
      const address = clean(r.ADDR)
      return { name: clean(r.SHLT_NM), address, region: regionOf(address), capacity: num(r.ACTC_PSBLTY_TNOP), lat: round(num(r.LAT)), lng: round(num(r.LOT)), detail: clean(r.SHLT_TYPE), open: r.DEL_YN !== "Y" }
    },
  },
  {
    id: "quake-outdoor",
    api: "DSSP-IF-10943",
    label: "지진 옥외대피장소",
    isJeju: (r) => String(r.ARCD ?? "").startsWith("50") || isJejuAddress(r.RN_DTL_ADRES) || isJejuAddress(r.EQK_ACMDFCLTY_ADRES),
    toItem: (r) => {
      const address = clean(r.RN_DTL_ADRES) || clean(r.EQK_ACMDFCLTY_ADRES)
      return { name: clean(r.VT_ACMDFCLTY_NM), address, region: regionOf(address), capacity: num(r.VT_ACMD_PSBL_NMPR), lat: round(num(r.LA)), lng: round(num(r.LO)), detail: "", open: true }
    },
  },
  {
    id: "accommodation",
    api: "DSSP-IF-00008",
    label: "수용(구호) 시설",
    // 법정동코드(STDG_CD)·시군구코드(RGN_CD) 앞 두 자리 50 = 제주특별자치도, 5011 = 제주시, 5013 = 서귀포시
    isJeju: (r) => String(r.STDG_CD ?? r.RGN_CD ?? "").startsWith("50"),
    toItem: (r) => {
      const code = String(r.STDG_CD ?? r.RGN_CD ?? "")
      const region = code.startsWith("5013") ? "서귀포시" : code.startsWith("5011") ? "제주시" : ""
      return { name: clean(r.DSSTR_ACTC_FCLT_NM), address: clean(r.RONA_DADDR) || clean(r.DADDR), region, capacity: num(r.DSSTR_ACTC_PSBLTY_TNOP), lat: round(num(r.LAT)), lng: round(num(r.LOT)), detail: r.UDGD_YN === "1" ? "지하" : "", open: r.DEL_YN !== "Y" }
    },
  },
]

async function fetchAll(api, key) {
  const rows = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${URL_BASE}/${api}?serviceKey=${encodeURIComponent(key)}&returnType=json&numOfRows=${PAGE}&pageNo=${page}`)
    const body = await res.json()
    if (body.header?.resultCode !== "00") throw new Error(`${api}: ${body.header?.resultCode} ${body.header?.errorMsg ?? ""}`)
    rows.push(...(body.body ?? []))
    if (!body.body?.length || rows.length >= body.totalCount) return { rows, total: body.totalCount }
  }
}

async function main() {
  const kinds = []
  for (const k of KINDS) {
    const key = process.env[`SAFETYDATA_KEY_${k.api.slice(-5)}`]
    if (!key) {
      console.log(`${k.label}(${k.api}): 키 없음 — 건너뜀`)
      continue
    }
    const { rows, total } = await fetchAll(k.api, key)
    const items = rows.filter(k.isJeju).map(k.toItem).filter((i) => i.name)
    kinds.push({ id: k.id, label: k.label, api: k.api, nationwide: total, items })
    console.log(`${k.label}(${k.api}): 전국 ${total}건 중 제주 ${items.length}건`)
  }
  const out = { source: "행정안전부 재난안전데이터공유플랫폼", fetchedAt: new Date().toISOString(), kinds }
  writeFileSync(new URL("../public/data/shelters-jeju.json", import.meta.url), JSON.stringify(out))
  console.log("저장: public/data/shelters-jeju.json")
}

// 테스트에서 import해도 실행되지 않게 직접 실행할 때만 돈다
if (process.argv[1]?.endsWith("fetch-shelters.mjs")) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
