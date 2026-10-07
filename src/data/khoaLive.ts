import { useSyncExternalStore } from "react"
import type { DataSource } from "../components/ui/dataSource"
import { toKhoaArrays, type KhoaApiStation } from "./khoaMapping"
import { khoaLiveObservations } from "./mockAqua"
import { khoaBuoyMarineConditions } from "./mockKhoaBuoy"
import { khoaMoseulpoTide } from "./mockRiver"

/**
 * 국립해양조사원(KHOA) 조위관측소·해양관측부이 실연동 — kma-weather-proxy의 /api/khoa가 모슬포 조위와 부이 3곳(중문·제주해협·제주남부)의
 * 최신 관측값을 준다. 2026-09-29에 비워 둔 세 배열(khoaBuoyMarineConditions·khoaLiveObservations·khoaMoseulpoTide)을 시작할 때 한 번 채우고,
 * 화면은 useKhoaLive()로 구독해 도착하면 다시 그린다. 값이 없는 관측점은 빼고 지어내지 않는다.
 */
const PROXY_URL = import.meta.env.VITE_WEATHER_PROXY_URL as string | undefined

let loaded = false
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let loading: Promise<void> | null = null
export function loadKhoa(): Promise<void> {
  if (!PROXY_URL) return Promise.resolve()
  loading ??= fetch(`${PROXY_URL}/api/khoa`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then((body: { stations: KhoaApiStation[] }) => {
      const { buoys, observations, tide } = toKhoaArrays(body.stations)
      khoaBuoyMarineConditions.splice(0, khoaBuoyMarineConditions.length, ...buoys)
      khoaLiveObservations.splice(0, khoaLiveObservations.length, ...observations)
      if (tide) {
        khoaMoseulpoTide.series.splice(0, khoaMoseulpoTide.series.length, ...tide.series)
        khoaMoseulpoTide.observedAt = tide.observedAt
      }
      loaded = buoys.length + observations.length > 0 || tide !== null
      listeners.forEach((fn) => fn())
    })
    .catch(() => {
      loading = null
    })
  return loading
}

/** 화면 구독용 — KHOA 값이 채워지면 다시 그려진다. 값은 모듈 배열을 그대로 읽는다. */
export function useKhoaLive(): boolean {
  return useSyncExternalStore(subscribe, () => loaded)
}

/** 카드의 데이터 종류 표식 — 실시간으로 받았으면 '실시간', 아직이면 기존 표식(비어 있음) */
export function khoaSource(fallback: DataSource): DataSource {
  return loaded ? { kind: "live" } : fallback
}
