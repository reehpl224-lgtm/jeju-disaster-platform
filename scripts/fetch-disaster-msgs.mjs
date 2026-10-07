// 행정안전부_긴급재난문자(재난안전데이터공유플랫폼 DSSP-IF-00247)에서 제주 수신 문자를 골라 public/data/disaster-msgs-jeju.json으로 저장한다.
//
//   SAFETYDATA_KEY_00247=<서비스키> node scripts/fetch-disaster-msgs.mjs [일수=60]
//
// 왜 앱·프록시가 직접 호출하지 않고 파일로 받아 두는가: 이 서비스키는 신청한 IP에서만 통한다 — Vercel 프록시로 호출하면
// "32 등록되지 않은 IP"로 거부된다(2026-10-07 확인). 그래서 이 PC에서 받아 파일로 올린다. 문자는 새로 오므로 **주기적으로 다시 실행해
// 올려야** 최신이 된다(화면에는 받아 둔 시각이 '스냅샷 기준'으로 표시된다).
// 응답은 전국 6만여 건이 오래된 것부터 쌓여 있고(SN 오름차순) 지역·기간 필터가 없어, 마지막 두 쪽만 받아 제주만 추린다.
import { writeFileSync } from "node:fs"

const URL_BASE = "https://www.safetydata.go.kr/V2/api/DSSP-IF-00247"
const PAGE = 1000

/** "2026/10/05 17:55:05" → "2026-10-05T17:55:05+09:00" (형식이 다르면 null) */
export function parseCrtDt(v) {
  const m = String(v ?? "").match(/^(\d{4})[/-](\d{2})[/-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}+09:00` : null
}

/** 수신 지역에 제주가 들어 있는가 — 지역명은 "제주특별자치도 제주시 "처럼 온다 */
export const isJejuMsg = (r) => String(r.RCPTN_RGN_NM ?? "").includes("제주")

export function toDisasterMsg(r) {
  const at = parseCrtDt(r.CRT_DT)
  const text = String(r.MSG_CN ?? "").replace(/\s+/g, " ").trim()
  if (!at || !text) return null
  return { id: String(r.SN ?? `${at}-${text.slice(0, 12)}`), at, region: String(r.RCPTN_RGN_NM ?? "").trim(), step: String(r.EMRG_STEP_NM ?? "").trim(), kind: String(r.DST_SE_NM ?? "").trim(), text }
}

/** 제주 수신 문자만, 최근 `days`일 안만, 최신이 앞으로 */
export function pickJejuRecent(rows, now, days) {
  const since = now.getTime() - days * 24 * 60 * 60 * 1000
  return rows
    .filter(isJejuMsg)
    .map(toDisasterMsg)
    .filter((m) => m !== null && new Date(m.at).getTime() >= since)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

async function fetchPage(key, pageNo, numOfRows) {
  const res = await fetch(`${URL_BASE}?serviceKey=${encodeURIComponent(key)}&returnType=json&numOfRows=${numOfRows}&pageNo=${pageNo}`)
  const body = await res.json()
  if (body.header?.resultCode !== "00") throw new Error(`${body.header?.resultCode} ${body.header?.errorMsg ?? ""}`)
  return { rows: body.body ?? [], total: Number(body.totalCount) || 0 }
}

async function main() {
  const key = process.env.SAFETYDATA_KEY_00247
  if (!key) throw new Error("SAFETYDATA_KEY_00247 환경변수가 필요합니다.")
  const days = Number(process.argv[2]) || 60
  const { total } = await fetchPage(key, 1, 1)
  const last = Math.max(1, Math.ceil(total / PAGE))
  const pages = last > 1 ? [last, last - 1] : [last]
  const rows = (await Promise.all(pages.map((p) => fetchPage(key, p, PAGE)))).flatMap((r) => r.rows)
  const messages = pickJejuRecent(rows, new Date(), days)
  const out = { source: "행정안전부 긴급재난문자(재난안전데이터공유플랫폼 DSSP-IF-00247)", fetchedAt: new Date().toISOString(), windowDays: days, nationwide: total, messages }
  writeFileSync(new URL("../public/data/disaster-msgs-jeju.json", import.meta.url), JSON.stringify(out))
  console.log(`전국 ${total}건 중 최근 ${days}일 제주 수신 ${messages.length}건 저장 (가장 최근 ${messages[0]?.at ?? "-"})`)
}

// 테스트에서 import해도 실행되지 않게 직접 실행할 때만 돈다
if (process.argv[1]?.endsWith("fetch-disaster-msgs.mjs")) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
