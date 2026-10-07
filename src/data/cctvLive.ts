import { useMemo, useSyncExternalStore } from "react"
import type { CctvCamera } from "../types/domain"
import { cctvCameras } from "./mockCctv"

/**
 * 제주시 감시 CCTV(월파·하천·적설) 실연동 — kma-weather-proxy의 /api/cctv가 data.go.kr 6510000 세 서비스를 합쳐 준다.
 * 목록 데이터는 재난 판정에 쓰이지 않는 기반 정보라 스테이징(모의)에서도 호출한다.
 * 받아온 카메라는 `cctvCameras`(현재 조회 목록)에 넣고, 화면은 useCctvCameras()로 읽어 도착하면 다시 그린다.
 */
const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

type Kind = "wave" | "river" | "snow"
interface ApiCamera {
  id: string
  kind: Kind
  name: string
  lat: number
  lng: number
  streamUrl: string
  inUse: boolean
}

const DOMAIN_OF: Record<Kind, CctvCamera["domain"]> = { wave: "coast", river: "river", snow: "snow" }
const KIND_LABEL: Record<Kind, string> = { wave: "월파", river: "하천", snow: "적설" }
const FEED_COUNT = 3

export interface CctvLoadState {
  phase: "loading" | "ready" | "partial" | "failed" | "unconfigured"
  receivedFeeds: number
  checkedAt: number | null
}

/** 응답 → 화면 타입. 응답에 주소·수신 시각이 없어 address는 종류 문구, lastFrameAt은 비워 둔다(화면이 비어 있으면 감춘다). */
export function toCctvCamera(c: ApiCamera): CctvCamera {
  return {
    id: `jejusi-${c.id}`,
    name: c.name,
    address: `제주시 ${KIND_LABEL[c.kind]} 감시 CCTV`,
    domain: DOMAIN_OF[c.kind],
    operator: "제주시",
    status: c.inUse ? "online" : "offline",
    lastFrameAt: "",
    lat: c.lat,
    lng: c.lng,
    streamUrl: c.streamUrl,
  }
}

/**
 * 상태 문구 — 제주시 API는 "사용 여부(useYn)"만 주고 영상 수신 상태는 주지 않는다.
 * 그래서 이 카메라들은 "연결/오프라인"이라고 쓰면 실시간 수신 상태로 오해돼 "사용/미사용"으로 쓴다.
 */
export function cctvStatusLabel(c: Pick<CctvCamera, "operator" | "status">): string {
  if (c.operator === "제주시") return c.status === "online" ? "사용" : "미사용"
  return c.status === "online" ? "연결" : "오프라인"
}

let version = 0
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
let loadState: CctvLoadState = {
  phase: PROXY_URL ? "loading" : "unconfigured",
  receivedFeeds: 0,
  checkedAt: null,
}
const notifyChange = () => {
  version += 1
  listeners.forEach((fn) => fn())
}

let loading: Promise<void> | null = null
/** 앱 시작 때 호출 — 일부/전체 실패 여부를 목록과 별도로 공개한다. */
export function loadJejuCctv(): Promise<void> {
  if (!PROXY_URL) return Promise.resolve()
  if (loading) return loading
  loadState = { ...loadState, phase: "loading" }
  notifyChange()
  loading = fetch(`${PROXY_URL}/api/cctv`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((body: { cameras: ApiCamera[]; errors?: unknown[] }) => {
      const live = body.cameras.map(toCctvCamera)
      cctvCameras.splice(0, cctvCameras.length, ...cctvCameras.filter((c) => !c.id.startsWith("jejusi-")), ...live)
      const failedFeeds = Array.isArray(body.errors) ? Math.min(FEED_COUNT, body.errors.length) : 0
      loadState = {
        phase: failedFeeds === FEED_COUNT ? "failed" : failedFeeds > 0 ? "partial" : "ready",
        receivedFeeds: Math.max(0, FEED_COUNT - failedFeeds),
        checkedAt: failedFeeds === FEED_COUNT ? null : Date.now(),
      }
      notifyChange()
    })
    .catch(() => {
      loadState = { phase: "failed", receivedFeeds: 0, checkedAt: null }
      notifyChange()
    })
    .finally(() => { loading = null })
  return loading
}

/** 영상 재생 주소 — 영상 서버(http·IP)를 HTTPS 화면이 직접 재생할 수 없어 프록시(/api/cctv-stream)로 받는다. 영상 주소가 없으면 null. */
export function cctvStreamSrc(c: Pick<CctvCamera, "streamUrl">): string | null {
  if (!PROXY_URL || !c.streamUrl) return null
  return `${PROXY_URL}/api/cctv-stream?u=${encodeURIComponent(c.streamUrl)}`
}

// 재생 창에 띄울 카메라 — 지도 팝업·카드 어디서든 열 수 있게 한 곳에 둔다(창은 CctvPlayerHost 하나)
let playing: CctvCamera | null = null
const playListeners = new Set<() => void>()
const subscribePlaying = (fn: () => void) => {
  playListeners.add(fn)
  return () => playListeners.delete(fn)
}
export function openCctvPlayer(camera: CctvCamera) {
  playing = camera
  playListeners.forEach((fn) => fn())
}
export function closeCctvPlayer() {
  playing = null
  playListeners.forEach((fn) => fn())
}
export function usePlayingCctv(): CctvCamera | null {
  return useSyncExternalStore(subscribePlaying, () => playing)
}

/** 화면용 — 목록이 채워지면 새 배열을 돌려줘 하위 컴포넌트(지도 마커 등)가 다시 그려진다 */
export function useCctvCameras(): CctvCamera[] {
  const v = useSyncExternalStore(subscribe, () => version)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- v는 목록 변경 신호로만 쓴다
  return useMemo(() => [...cctvCameras], [v])
}

/** API 수신 상태 — 빈 목록(0대)과 로딩/오류를 구별하기 위한 별도 스냅샷 */
export function useCctvLoadState(): CctvLoadState {
  return useSyncExternalStore(subscribe, () => loadState)
}
