import { useEffect, useSyncExternalStore } from "react"

/**
 * 대피·수용 시설(행정안전부 재난안전데이터공유플랫폼 5종)에서 scripts/fetch-shelters.mjs로 받아 둔 제주 목록(public/data/shelters-jeju.json).
 * 실시간 API가 아니라 받아 둔 파일(스냅샷)인 이유는 스크립트 머리말 참고. 종합상황 우측 '자산현황'이 읽는다.
 */
export interface ShelterItem {
  name: string
  address: string
  region: "제주시" | "서귀포시" | ""
  capacity: number | null
  lat: number | null
  lng: number | null
  detail: string
  open: boolean
}
export interface ShelterKind {
  id: string
  label: string
  api: string
  /** 전국 전체 건수(제주 자료가 없는 서비스도 있다) */
  nationwide: number
  items: ShelterItem[]
}
export interface ShelterFile {
  source: string
  fetchedAt: string
  kinds: ShelterKind[]
}
export type ShelterState = { status: "loading" } | { status: "missing" } | { status: "ready"; file: ShelterFile }

let state: ShelterState = { status: "loading" }
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
let loading: Promise<void> | null = null

function load() {
  loading ??= fetch(`${import.meta.env.BASE_URL}data/shelters-jeju.json`, { cache: "no-store" })
    .then((res) => {
      // 파일이 없을 때 개발 서버는 index.html을 200으로 돌려주므로 JSON 응답인지도 본다
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) throw new Error("no file")
      return res.json() as Promise<ShelterFile>
    })
    .then((file) => {
      state = Array.isArray(file.kinds) && file.kinds.length > 0 ? { status: "ready", file } : { status: "missing" }
    })
    .catch(() => {
      state = { status: "missing" }
    })
    .finally(() => listeners.forEach((fn) => fn()))
}

/** 시설 스냅샷 — 처음 쓸 때 한 번 읽는다 */
export function useShelters(): ShelterState {
  useEffect(load, [])
  return useSyncExternalStore(subscribe, () => state)
}
