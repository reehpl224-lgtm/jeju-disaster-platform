import { serviceStatusCards } from "./mockDashboard"
import { usePanelInput } from "./panelInput"
import { useWarningEntries } from "./boardLive"
import { SAMPLE_SERVICE_STAGES } from "./sidePanelSamples"
import { serviceCardReading } from "./serviceCardCounts"

/** 종합·GIS·서비스 보드와 헤더가 동일한 입력값·특보·샘플 집계를 구독한다. */
export function useServiceStatusCards() {
  const input = usePanelInput()
  const warnings = useWarningEntries()
  return serviceStatusCards.map((card) => ({ ...card, ...serviceCardReading(card.id, input.stages, warnings, SAMPLE_SERVICE_STAGES) }))
}
