/**
 * 국립해양조사원(KHOA) 조위관측소·해양관측부이 최신 관측데이터(EXT-KHOA-001/002) 응답 정리 — 순수 함수라 tests/에서 검증한다.
 * 항목 필드는 명세서(3-4·3-5절) 기준: obsvtrNm, iot, lat, obsrvnDt, wndrct, wspd, artmp, atmpr, wtem, bscTdlvHgt(조위 cm),
 * slntQty(염분 psu), crdir, crsp(유속 cm/s), wvhgt, wvpd. 명세서 표기가 소문자 l/대문자 I로 흔들려 두 철자를 모두 읽는다.
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
  tide: "https://apis.data.go.kr/1192136/dtRecent/GetDTRecentApiService/getDTRecentApi",
  // 명세서의 부이 요청 URL은 조위관측소와 같게 적힌 오기로 보여, 상세기능명(getTWRecentApi)과 서비스 경로(twRecent)로 맞췄다
  buoy: "https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService/getTWRecentApi",
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
    lng: num(item.iot),
    values: {
      windDirDeg: num(item.wndrct),
      windSpeedMs: num(item.wspd),
      airTempC: num(item.artmp),
      pressureHpa: num(item.atmpr),
      waterTempC: num(item.wtem),
      salinityPsu: num(item.slntQty ?? item.sIntQty),
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
