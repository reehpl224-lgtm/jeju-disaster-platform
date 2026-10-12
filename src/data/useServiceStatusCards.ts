import { serviceStatusCards } from "./mockDashboard"
import { usePanelInput } from "./panelInput"
import { useWarningEntries } from "./boardLive"
import { SAMPLE_SERVICE_STAGES } from "./sidePanelSamples"
import { serviceCardReading } from "./serviceCardCounts"
import { IS_STAGING } from "./appMode"

/** 종합·GIS·서비스 보드와 헤더가 동일한 입력값·특보·샘플 집계를 구독한다. */
export function useServiceStatusCards() {
  const input = usePanelInput()
  const warnings = useWarningEntries()
  return serviceStatusCards.map((card) => {
    const r = serviceCardReading(card.id, input.stages, warnings, IS_STAGING ? SAMPLE_SERVICE_STAGES : [])
    // 스테이징이 일부러 보여주는 샘플은 "데이터 없음"이 아니라 그냥 "샘플". 프로토타입은 샘플을 넘기지 않아 값이 비어 있다
    return { ...card, ...r, sourceLabel: IS_STAGING && r.sourceLabel === "샘플 · 데이터 없음" ? "샘플" : r.sourceLabel }
  })
}
