import { useSyncExternalStore } from "react"
import type { DataSource } from "../components/ui/dataSource"
import type { HeatShelter } from "../types/heat"
import { heatShelters } from "./mockHeat"

/**
 * 무더위쉼터 — 행정안전부_무더위쉼터(DSSP-IF-10942)에서 scripts/fetch-heat-shelters.mjs로 받아 둔 제주 쉼터 목록(public/data/heat-shelters.json).
 * 시작할 때 파일을 읽어 비어 있던 heatShelters를 채운다. 실시간 API가 아니라 받아 둔 파일인 이유는 스크립트 머리말 참고.
 * 파일이 없거나 읽지 못하면 배열은 빈 채로 두고 화면은 기존 샘플 표시를 쓴다.
 */
interface ShelterFile {
  fetchedAt: string
  lastModifiedAt?: string
  items: HeatShelter[]
}

let loaded = false
let fetchedAt = ""
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

let loading: Promise<void> | null = null
export function loadHeatShelters(): Promise<void> {
  loading ??= fetch(`${import.meta.env.BASE_URL}data/heat-shelters.json`, { cache: "no-store" })
    .then((res) => {
      // 파일이 없을 때 개발 서버는 index.html을 200으로 돌려주므로 JSON 응답인지도 본다
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) throw new Error("no file")
      return res.json() as Promise<ShelterFile>
    })
    .then((file) => {
      if (!Array.isArray(file.items) || file.items.length === 0) return
      heatShelters.splice(0, heatShelters.length, ...file.items)
      fetchedAt = file.fetchedAt
      loaded = true
      listeners.forEach((fn) => fn())
    })
    .catch(() => {
      loading = null
    })
  return loading
}

/** 화면 구독용 — 목록이 채워지면 다시 그려진다 */
export function useHeatShelters(): boolean {
  return useSyncExternalStore(subscribe, () => loaded)
}

/** 카드 표식 — 받아 둔 날짜 기준 스냅샷. 아직 못 읽었으면 undefined(기존 샘플·더미 표시) */
export function heatSheltersSource(): DataSource | undefined {
  return loaded ? { kind: "snapshot", asOf: fetchedAt.slice(0, 10).replace(/-/g, ".") } : undefined
}
