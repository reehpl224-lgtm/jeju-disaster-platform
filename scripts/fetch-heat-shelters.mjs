// 행정안전부_무더위쉼터(재난안전데이터공유플랫폼 DSSP-IF-10942)에서 제주 쉼터만 받아 public/data/heat-shelters.json으로 저장한다.
//
//   SAFETYDATA_KEY=<서비스키> node scripts/fetch-heat-shelters.mjs
//
// 왜 앱이 직접 호출하지 않고 파일로 받아 두는가: 이 서비스키는 신청할 때 적은 IP에서만 호출되는 것으로 보이고(신청서에 '유저아이피'가 있음),
// 쉼터 목록은 자주 바뀌지 않아(2026-10-07 기준 제주 최근 수정 2026-08-25) 실시간일 필요가 없다. 키를 앱·프록시에 넣지 않아도 된다.
// 제주만 남기고 화면이 쓰는 항목만 저장한다(전국 6만 건 → 제주 약 800건).
import { writeFileSync } from "node:fs"

const URL_BASE = "https://www.safetydata.go.kr/V2/api/DSSP-IF-10942"
const PAGE = 1000

/** 이름에 든 말로 시설 유형을 나눈다(코드표가 공개돼 있지 않아 이름 기준 — 해당 없으면 '기타') */
export function shelterType(name) {
  for (const k of ["경로당", "마을회관", "복지관"]) if (name.includes(k)) return k
  return "기타"
}

/** 제주 여부: 시도 법정동코드 앞 두 자리 50 또는 도로명주소가 '제주'로 시작 */
export function isJeju(row) {
  return String(row.ARCD ?? "").startsWith("50") || (row.RN_DTL_ADRES ?? "").startsWith("제주")
}

export function toShelter(row) {
  const address = (row.RN_DTL_ADRES ?? "").replace(/\s+/g, " ").trim().replace(/^제주특별자치도 /, "")
  const region = address.startsWith("서귀포시") ? "서귀포시" : "제주시"
  return {
    id: String(row.RSTR_FCLTY_NO),
    name: String(row.RSTR_NM ?? "").trim(),
    region,
    address,
    type: shelterType(String(row.RSTR_NM ?? "")),
    // 정원이 비어 있는 곳이 있다 — 0으로 바꾸지 않고 null로 둔다
    capacity: typeof row.USE_PSBL_NMPR === "number" ? row.USE_PSBL_NMPR : null,
  }
}

async function main() {
  const key = process.env.SAFETYDATA_KEY
  if (!key) throw new Error("SAFETYDATA_KEY 환경변수가 필요합니다.")
  const rows = []
  for (let page = 1; ; page++) {
    const url = `${URL_BASE}?serviceKey=${encodeURIComponent(key)}&returnType=json&numOfRows=${PAGE}&pageNo=${page}`
    const res = await fetch(url)
    const body = await res.json()
    if (body.header?.resultCode !== "00") throw new Error(`${body.header?.resultCode} ${body.header?.errorMsg ?? ""}`)
    rows.push(...(body.body ?? []))
    if (!body.body?.length || rows.length >= body.totalCount) break
  }
  const items = rows.filter(isJeju).map(toShelter)
  const modified = rows.filter(isJeju).map((r) => String(r.MODF_TIME ?? "")).sort().at(-1)
  const out = {
    source: "행정안전부_무더위쉼터 (재난안전데이터공유플랫폼 DSSP-IF-10942)",
    fetchedAt: new Date().toISOString(),
    lastModifiedAt: modified,
    total: rows.length,
    items,
  }
  writeFileSync(new URL("../public/data/heat-shelters.json", import.meta.url), JSON.stringify(out))
  console.log(`전국 ${rows.length}건 중 제주 ${items.length}건 저장 (마지막 수정 ${modified})`)
}

// 테스트에서 import해도 실행되지 않게 직접 실행할 때만 돈다
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("fetch-heat-shelters.mjs")) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
