/**
 * 기상청 초단기실황(getUltraSrtNcst, EXT-KMA-001) 조회 기준시각·응답 정리 — 순수 함수라 tests/에서 바로 검증한다.
 */

/** 화면이 쓰는 항목만 추린다: 기온·1시간 강수량·풍속·습도·강수형태·풍향 */
export const NCST_CATEGORIES = ["T1H", "RN1", "WSD", "REH", "PTY", "VEC"] as const
export type NcstCategory = (typeof NCST_CATEGORIES)[number]

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
/** 실황은 정시 자료를 약 10분 뒤부터 조회할 수 있다(명세서: 매시 10분 이후 호출) */
const PUBLISH_DELAY_MIN = 10

const pad = (n: number) => String(n).padStart(2, "0")

/** 지금(KST) 기준으로 이미 올라와 있는 가장 최근 정시의 base_date/base_time(HH00). */
export function resolveNcstBase(now: Date): { baseDate: string; baseTime: string } {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  // 10분이 안 지났으면 직전 정시 — 시각을 먼저 되돌린 뒤 날짜를 뽑으면 자정 넘김도 같이 처리된다.
  const usable = new Date(kst.getTime() - PUBLISH_DELAY_MIN * 60 * 1000)
  return {
    baseDate: `${usable.getUTCFullYear()}${pad(usable.getUTCMonth() + 1)}${pad(usable.getUTCDate())}`,
    baseTime: `${pad(usable.getUTCHours())}00`,
  }
}

export function pickNcstValues(items: { category: string; obsrValue: string }[]): Partial<Record<NcstCategory, string>> {
  const values: Partial<Record<NcstCategory, string>> = {}
  for (const item of items) {
    if ((NCST_CATEGORIES as readonly string[]).includes(item.category)) values[item.category as NcstCategory] = item.obsrValue
  }
  return values
}
