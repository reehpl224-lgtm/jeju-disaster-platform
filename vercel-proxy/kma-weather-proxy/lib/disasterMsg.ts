/**
 * 행정안전부_긴급재난문자(재난안전데이터공유플랫폼 DSSP-IF-00247) 응답 정리 — 순수 함수라 tests/에서 검증한다.
 * 응답은 전국 6만여 건이 **오래된 것부터** 쌓여 있고(SN 오름차순, 2026-10-07 확인) 지역·기간 필터 파라미터가 없다. 그래서 프록시는
 * 마지막 쪽들만 받아 제주 수신 문자만 추려 준다.
 */
export interface DisasterMsgRow {
  SN?: number
  MSG_CN?: string
  RCPTN_RGN_NM?: string
  CRT_DT?: string // "2026/10/05 17:55:05" (KST)
  EMRG_STEP_NM?: string // 안전안내 | 긴급재난 | 위급재난
  DST_SE_NM?: string // 재난 구분(기타·호우·태풍·화재·산불 등)
}

export interface DisasterMsg {
  id: string
  /** ISO(+09:00) */
  at: string
  region: string
  step: string
  kind: string
  text: string
}

/** "2026/10/05 17:55:05" → "2026-10-05T17:55:05+09:00" (형식이 다르면 null) */
export function parseCrtDt(v: string | undefined): string | null {
  const m = String(v ?? "").match(/^(\d{4})[/-](\d{2})[/-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}+09:00` : null
}

/** 수신 지역에 제주가 들어 있는가 — 지역명은 "제주특별자치도 제주시 "처럼 온다 */
export const isJejuMsg = (r: DisasterMsgRow) => String(r.RCPTN_RGN_NM ?? "").includes("제주")

export function toDisasterMsg(r: DisasterMsgRow): DisasterMsg | null {
  const at = parseCrtDt(r.CRT_DT)
  const text = String(r.MSG_CN ?? "").replace(/\s+/g, " ").trim()
  if (!at || !text) return null
  return { id: String(r.SN ?? `${at}-${text.slice(0, 12)}`), at, region: String(r.RCPTN_RGN_NM ?? "").trim(), step: String(r.EMRG_STEP_NM ?? "").trim(), kind: String(r.DST_SE_NM ?? "").trim(), text }
}

/** 제주 수신 문자만, 최근 `days`일 안만, 최신이 앞으로 */
export function pickJejuRecent(rows: DisasterMsgRow[], now: Date, days: number): DisasterMsg[] {
  const since = now.getTime() - days * 24 * 60 * 60 * 1000
  return rows
    .filter(isJejuMsg)
    .map(toDisasterMsg)
    .filter((m): m is DisasterMsg => m !== null && new Date(m.at).getTime() >= since)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}
