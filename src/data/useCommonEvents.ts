import { useEffect, useMemo, useState } from "react"
import { IS_STAGING } from "./appMode"
import { fromPilotBatch, fromSpEvent, simulateLiveEvent, type CommonEvent } from "./commonEvent"
import { usePilotBatch } from "./pilotBatch/usePilotBatch"
import { useSidePanelEvents } from "./useSidePanelEvents"

/**
 * 화면용 — 종합상황이 받는 사건(기상청 특보·태풍·재난문자)과 실증사 배치를 공통 이벤트로 바꿔 최신순으로 돌려준다.
 * pilot: loading(받는 중) · none(실증사 자료 없음 — 프로토타입의 값 없음) · ok. 스테이징은 샘플 배치가 ok로 들어온다.
 */
/** 스테이징 수신 시뮬레이션 간격 — 실증사 이벤트가 이 간격으로 한 건씩 들어온다 */
const LIVE_MS = 20_000
const LIVE_MAX = 30

export function useCommonEvents(): { events: CommonEvent[]; pilot: "loading" | "none" | "ok"; spNullSources: string[]; liveAt: Date | null } {
  const sp = useSidePanelEvents()
  const pilot = usePilotBatch()
  const [live, setLive] = useState<CommonEvent[]>([])
  const [liveAt, setLiveAt] = useState<Date | null>(null)
  const templates = useMemo(() => (IS_STAGING && pilot ? fromPilotBatch(pilot.batch) : []), [pilot])
  useEffect(() => {
    if (templates.length === 0) return
    let n = 0
    const id = setInterval(() => {
      const now = new Date()
      const ev = simulateLiveEvent(templates, ++n, now)
      if (!ev) return
      setLive((l) => [ev, ...l].slice(0, LIVE_MAX))
      setLiveAt(now)
    }, LIVE_MS)
    return () => clearInterval(id)
  }, [templates])
  return useMemo(() => {
    const fromSp = sp.events.map(fromSpEvent)
    const fromPilot = [...live, ...(pilot ? fromPilotBatch(pilot.batch) : [])]
    return {
      // [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 이벤트 목록에서 뺌 — 복원하려면 filter 제거
      events: [...fromSp, ...fromPilot].filter((e) => e.serviceId !== "heat" && e.serviceId !== "wildfire").sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      pilot: (pilot === undefined ? "loading" : pilot === null ? "none" : "ok") as "loading" | "none" | "ok",
      spNullSources: sp.nullSources,
      liveAt,
    }
  }, [sp.events, sp.nullSources, pilot, live, liveAt])
}
