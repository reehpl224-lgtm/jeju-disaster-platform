import { useEffect, useState } from "react"
import { generatePilotBatch, type PilotBatch } from "./generate"

export interface PilotBatchState {
  batch: PilotBatch
  /** file = public/data/pilot-batch.json(배치 결과·실증사 데이터), generated = 파일이 없어 화면에서 직접 생성한 샘플 */
  origin: "file" | "generated"
}

let cached: Promise<PilotBatchState> | null = null

async function load(): Promise<PilotBatchState> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/pilot-batch.json`, { cache: "no-store" })
    // 파일이 없을 때 개발 서버는 index.html을 200으로 돌려주므로 JSON 응답인지도 본다
    if (res.ok && (res.headers.get("content-type") ?? "").includes("json")) {
      const body = (await res.json()) as PilotBatch
      if (body?.version === 1 && body.river && body.coast && body.aqua) return { batch: body, origin: "file" }
    }
  } catch {
    // 배치 파일을 못 읽으면 아래에서 직접 생성한다
  }
  return { batch: generatePilotBatch(), origin: "generated" }
}

/** 실증 3사 샘플 배치 데이터 — 배치 파일이 있으면 그것을, 없으면 같은 생성기로 지금 시각 기준 샘플을 만든다 */
export function usePilotBatch(): PilotBatchState | null {
  const [state, setState] = useState<PilotBatchState | null>(null)
  useEffect(() => {
    let cancelled = false
    cached ??= load()
    cached.then((s) => !cancelled && setState(s))
    return () => {
      cancelled = true
    }
  }, [])
  return state
}
