/**
 * 생활안전지도(행정안전부) WMS 타일 중계용 순수 함수 — tests/에서 바로 검증한다.
 * 하천범람지도(지방하천, IF_0100_WMS)와 침수흔적도(IF_0092_WMS)를 Leaflet 지도에 올리기 위해, 키를 브라우저에 보이지 않고
 * 요청 범위를 제한해 프록시가 대신 받는다. 지도(EPSG:3857) 요청을 그대로 받는다 — 2026-10-07 두 레이어 모두 3857을 지원하는 것을 확인했다.
 */
export const SAFEMAP_LAYERS = {
  river: "IF_0100_WMS", // 하천범람지도(지방하천)
  trace: "IF_0092_WMS", // 침수흔적도
} as const
export type SafemapLayer = keyof typeof SAFEMAP_LAYERS

/** 웹 메르카토르 미터 범위 — 한반도 일대만 허용(제주는 x≈14.04~14.14M, y≈3.90~4.01M). 범위를 넘는 요청은 막아 남용을 줄인다. */
const LIMIT = { minX: 13_700_000, maxX: 14_800_000, minY: 3_700_000, maxY: 5_200_000 }
const MAX_SIZE = 1024

export interface WmsRequest {
  layer: SafemapLayer
  bbox: [number, number, number, number]
  width: number
  height: number
}

type Query = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Leaflet WMS 요청(layer는 우리 쪽 이름, bbox/width/height는 표준 파라미터)을 검증해 꺼낸다 */
export function parseWmsRequest(q: Query): WmsRequest | { error: string } {
  const layer = one(q.layer)
  if (layer !== "river" && layer !== "trace") return { error: "layer는 river 또는 trace여야 합니다." }
  const bbox = String(one(q.bbox) ?? "")
    .split(",")
    .map(Number)
  if (bbox.length !== 4 || !bbox.every(Number.isFinite)) return { error: "bbox는 minx,miny,maxx,maxy 숫자 네 개여야 합니다." }
  const [minX, minY, maxX, maxY] = bbox
  if (minX >= maxX || minY >= maxY) return { error: "bbox 범위가 올바르지 않습니다." }
  if (minX < LIMIT.minX || maxX > LIMIT.maxX || minY < LIMIT.minY || maxY > LIMIT.maxY) return { error: "bbox가 허용 범위(한반도 일대) 밖입니다." }
  const width = Number(one(q.width))
  const height = Number(one(q.height))
  if (![width, height].every((n) => Number.isInteger(n) && n >= 1 && n <= MAX_SIZE)) return { error: `width·height는 1~${MAX_SIZE} 정수여야 합니다.` }
  return { layer, bbox: [minX, minY, maxX, maxY], width, height }
}

export function buildSafemapUrl(req: WmsRequest, key: string): string {
  const params = new URLSearchParams({
    srs: "EPSG:3857",
    bbox: req.bbox.join(","),
    format: "image/png",
    width: String(req.width),
    height: String(req.height),
    transparent: "TRUE",
  })
  // serviceKey는 따로 붙인다(URLSearchParams가 한 번 더 인코딩하지 않게)
  return `https://www.safemap.go.kr/openapi2/${SAFEMAP_LAYERS[req.layer]}?${params.toString()}&serviceKey=${encodeURIComponent(key)}`
}
