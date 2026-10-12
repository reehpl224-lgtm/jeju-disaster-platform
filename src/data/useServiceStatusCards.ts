import { serviceStatusCards } from "./mockDashboard"
import { usePanelInput } from "./panelInput"
import { useWarningEntries } from "./boardLive"
import { SAMPLE_SERVICE_STAGES } from "./sidePanelSamples"
import { serviceCardReading } from "./serviceCardCounts"
import { IS_STAGING } from "./appMode"
import { useSidePanelEvents } from "./useSidePanelEvents"

/** 종합·GIS·서비스 보드와 헤더가 동일한 입력값·특보·샘플 집계를 구독한다. */
export function useServiceStatusCards() {
  const input = usePanelInput()
  const warnings = useWarningEntries()
  // 타임라인에 "발령"으로 올라오는 태풍(기상청 태풍 현황 — 스테이징은 샘플)은 제주 특보가 아니어도 태풍 카드에 관심으로 센다
  const { events } = useSidePanelEvents()
  const typhoons = events.filter((e) => e.source === "typhoon" && e.status === "발령").length
  return serviceStatusCards.map((card) => {
    let r = serviceCardReading(card.id, input.stages, warnings, IS_STAGING ? SAMPLE_SERVICE_STAGES : [])
    // 스테이징은 실제로 발효 중인 특보가 없으면(0건) 샘플 등급을 보여줘 카드의 등급 표기를 확인할 수 있게 한다 — 있으면 실제 값이 우선
    if (IS_STAGING && r.source === "warnings" && Object.values(r.counts).every((n) => n === 0)) {
      r = serviceCardReading(card.id, undefined, { status: "failed" }, SAMPLE_SERVICE_STAGES)
    }
    // 스테이징이 일부러 보여주는 샘플은 "데이터 없음"이 아니라 그냥 "샘플". 프로토타입은 샘플을 넘기지 않아 값이 비어 있다
    // 입력값이 아니면 태풍 카드에 태풍 현황을 관심(타임라인의 태풍 등급과 같다)으로 더한다
    if (card.id === "typhoon" && typhoons > 0 && r.source !== "input") {
      r = { ...r, counts: { ...r.counts, caution: r.counts.caution + typhoons }, unavailable: false, sourceLabel: r.source === "warnings" ? "기상청 특보·태풍 현황" : r.sourceLabel }
    }
    return { ...card, ...r, sourceLabel: IS_STAGING && r.sourceLabel === "샘플 · 데이터 없음" ? "샘플" : r.sourceLabel }
  })
}
