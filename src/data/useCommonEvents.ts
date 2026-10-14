import { useMemo } from "react"
import { fromPilotBatch, fromSpEvent, type CommonEvent } from "./commonEvent"
import { usePilotBatch } from "./pilotBatch/usePilotBatch"
import { useSidePanelEvents } from "./useSidePanelEvents"

/**
 * 화면용 — 종합상황이 받는 사건(기상청 특보·태풍·재난문자)과 실증사 배치를 공통 이벤트로 바꿔 최신순으로 돌려준다.
 * pilot: loading(받는 중) · none(실증사 자료 없음 — 프로토타입의 값 없음) · ok. 스테이징은 샘플 배치가 ok로 들어온다.
 */
export function useCommonEvents(): { events: CommonEvent[]; pilot: "loading" | "none" | "ok"; spNullSources: string[] } {
  const sp = useSidePanelEvents()
  const pilot = usePilotBatch()
  return useMemo(() => {
    const fromSp = sp.events.map(fromSpEvent)
    const fromPilot = pilot ? fromPilotBatch(pilot.batch) : []
    return {
      // [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 이벤트 목록에서 뺌 — 복원하려면 filter 제거
      events: [...fromSp, ...fromPilot].filter((e) => e.serviceId !== "heat" && e.serviceId !== "wildfire").sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      pilot: (pilot === undefined ? "loading" : pilot === null ? "none" : "ok") as "loading" | "none" | "ok",
      spNullSources: sp.nullSources,
    }
  }, [sp.events, sp.nullSources, pilot])
}
