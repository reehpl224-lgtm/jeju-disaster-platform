/**
 * 국립해양조사원(KHOA) 조위관측소·해양관측부이 최신 관측데이터(EXT-KHOA-001/002) 응답 정리 — 순수 함수라 tests/에서 검증한다.
 * 항목 필드는 활용가이드·실응답 기준: obsvtrNm, lot(경도 — 외부연계 명세서엔 iot로 오기), lat, obsrvnDt, wndrct, wspd, artmp, atmpr, wtem, bscTdlvHgt(조위 cm),
 * slntQty(조위관측소 염분 psu)·slnty(부이 염분 psu), crdir, crsp(유속 cm/s), wvhgt, wvpd. 명세서 표기가 소문자 l/대문자 I로 흔들려 두 철자를 모두 읽는다.
 */

export type KhoaKind = "tide" | "buoy"

/** 앱이 쓰는 제주 인근 관측점 — docs/khoa-ai-prediction-requests.md의 4개소 */
export const KHOA_STATIONS: { code: string; kind: KhoaKind; name: string }[] = [
  { code: "DT_0023", kind: "tide", name: "모슬포" },
  { code: "TW_0075", kind: "buoy", name: "중문해수욕장" },
  { code: "KG_0028", kind: "buoy", name: "제주해협" },
  { code: "KG_0021", kind: "buoy", name: "제주남부" },
]

export const KHOA_ENDPOINTS: Record<KhoaKind, string> = {
  // 오픈API 활용가이드(2026-10-07)의 호출 주소는 서비스명(GetDTRecentApiService)까지다 — 뒤에 오퍼레이션명(getDTRecentApi)을 붙이면
  // 키가 맞아도 '등록되지 않은 서비스키'(코드 30)가 온다. 부이도 같은 규칙(GetTWRecentApiService)으로 실호출해 정상 응답을 확인했다.
  tide: "https://apis.data.go.kr/1192136/dtRecent/GetDTRecentApiService",
  buoy: "https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService",
}

export interface KhoaValues {
  windDirDeg?: number
  windSpeedMs?: number
  airTempC?: number
  pressureHpa?: number
  waterTempC?: number
  salinityPsu?: number
  tideCm?: number
  waveHeightM?: number
  wavePeriodSec?: number
  currentDirDeg?: number
  currentSpeedCms?: number
}

export interface KhoaObservation {
  /** "YYYY-MM-DD HH:mm" (KST, 응답 그대로) */
  observedAt: string
  lat?: number
  lng?: number
  values: KhoaValues
}

const num = (v: unknown): number | undefined => {
  if (v == null || String(v).trim() === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

type Item = Record<string, unknown>

export function normalizeKhoaItem(item: Item): KhoaObservation | null {
  const observedAt = String(item.obsrvnDt ?? "").trim()
  if (!observedAt) return null
  return {
    observedAt: observedAt.slice(0, 16),
    lat: num(item.lat),
    lng: num(item.lot ?? item.iot),
    values: {
      windDirDeg: num(item.wndrct),
      windSpeedMs: num(item.wspd),
      airTempC: num(item.artmp),
      pressureHpa: num(item.atmpr),
      waterTempC: num(item.wtem),
      salinityPsu: num(item.slntQty ?? item.slnty ?? item.sIntQty),
      tideCm: num(item.bscTdlvHgt),
      waveHeightM: num(item.wvhgt ?? item.Wvhgt),
      wavePeriodSec: num(item.wvpd),
      currentDirDeg: num(item.crdir),
      currentSpeedCms: num(item.crsp),
    },
  }
}

/** 응답 항목 목록을 시각 오름차순 관측값으로 — 시각이 없는 항목은 버린다 */
export function normalizeKhoaItems(items: Item[]): KhoaObservation[] {
  return items
    .map(normalizeKhoaItem)
    .filter((o): o is KhoaObservation => o !== null)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
}

/** data.go.kr 응답에서 항목 목록을 꺼낸다 — 항목이 하나뿐이면 객체로 오는 경우가 있다 */
export function extractKhoaItems(json: any): Item[] {
  const items = json?.response?.body?.items?.item ?? json?.body?.items?.item ?? json?.response?.body?.items ?? json?.items
  return Array.isArray(items) ? items : items && typeof items === "object" ? [items] : []
}
