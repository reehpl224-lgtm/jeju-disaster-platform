/**
 * 제주시 감시 CCTV 3종(월파·하천·적설, data.go.kr 6510000) 응답 정리 — 순수 함수라 tests/에서 바로 검증한다.
 * 세 서비스는 항목 구조가 같다: dataCd, laCrdnt(위도), loCrdnt(경도), spotSe, spotNm, cctvUrl(HLS), useYn.
 */

export type CctvKind = "wave" | "river" | "snow"

/** 서비스별 오퍼레이션 — 명세서에 이름이 없어 실호출로 확인했다(2026-10-07) */
export const CCTV_SERVICES: Record<CctvKind, { url: string; label: string }> = {
  wave: { url: "https://apis.data.go.kr/6510000/waveoverCctvInfoService/getWaveoverCctvList", label: "월파" },
  river: { url: "https://apis.data.go.kr/6510000/riverCctvService/getRiverCctvList", label: "하천" },
  snow: { url: "https://apis.data.go.kr/6510000/snowfallCctvService/getSnowfallCctvList", label: "적설" },
}

export interface CctvItem {
  id: string
  kind: CctvKind
  name: string
  lat: number
  lng: number
  /** HLS(m3u8) 주소 — http·IP 주소라 HTTPS 화면에서는 직접 재생할 수 없다 */
  streamUrl: string
  /** useYn — 사용 여부이지 영상 수신 상태가 아니다 */
  inUse: boolean
}

/** 좌표가 숫자가 아닌 항목은 지도에 놓을 수 없어 버린다. */
export function normalizeCctvItems(kind: CctvKind, items: Record<string, string>[]): CctvItem[] {
  const out: CctvItem[] = []
  for (const raw of items) {
    // Number("")은 0이라 빈 좌표가 (0, 0)으로 통과한다 — 비어 있으면 먼저 버린다
    if (!raw.laCrdnt?.trim() || !raw.loCrdnt?.trim()) continue
    const lat = Number(raw.laCrdnt)
    const lng = Number(raw.loCrdnt)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    out.push({
      id: `${kind}-${raw.dataCd}`,
      kind,
      name: (raw.spotNm ?? "").trim() || `${CCTV_SERVICES[kind].label} CCTV ${raw.dataCd}`,
      lat,
      lng,
      streamUrl: raw.cctvUrl ?? "",
      inUse: raw.useYn === "Y",
    })
  }
  return out
}
