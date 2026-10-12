import { heatShelters } from "./mockHeat"
import { riskMarkers } from "./mockDashboard"
import { useAllBoardFacts } from "./boardFacts"
import { groupWarnings, useWarningEntries, warningMarkers, type ServiceWarnings } from "./boardLive"
import { useHeatShelters } from "./heatSheltersLive"
import { shelterMarkers } from "./heatMapMarkers"
import { WARNING_CODES } from "./serviceCardCounts"
import type { RiskMarker } from "../types/domain"

/** 서비스 보드 id(경로) ↔ 지도 분야(domain) */
const SERVICES: { id: string; domain: RiskMarker["domain"] }[] = [
  { id: "river", domain: "river" },
  { id: "coast", domain: "coast" },
  { id: "aqua", domain: "aqua" },
  { id: "heavy-rain", domain: "heavyRain" },
  { id: "typhoon", domain: "typhoon" },
  { id: "heat", domain: "heat" },
  { id: "wildfire", domain: "wildfire" },
  { id: "tsunami", domain: "tsunami" },
  { id: "snow", domain: "snow" },
]

/**
 * GIS 상황 지도에 찍을 점 전체 — 서비스 보드 지도와 같은 점을 모두 모은다:
 * 기본 위치 점(riskMarkers) + 기상청 특보가 발효 중인 시 + 서비스별 실제 관측 점(우량·해양·지진 등) + 폭염 무더위쉼터 모음 점.
 * enabled가 아니면(GIS 화면이 아닐 때) 실제 값을 받지 않고 기본 위치 점만 돌려준다.
 */
export function useGisMarkers(enabled: boolean): RiskMarker[] {
  const warnings = useWarningEntries(enabled)
  const facts = useAllBoardFacts(SERVICES.map((s) => s.id), enabled)
  const sheltersLoaded = useHeatShelters()
  return SERVICES.flatMap(({ id, domain }) => {
    const codes = WARNING_CODES[id]
    const warn: ServiceWarnings = warnings.status === "ready" && codes ? { status: "ready", groups: groupWarnings(warnings.entries, codes) } : { status: "idle" }
    const fact: RiskMarker[] = (facts[id]?.markers ?? []).map((m, i) => ({ id: `fact-${id}-${i}`, name: m.name, x: 0, y: 0, level: m.level, domain, lat: m.lat, lng: m.lng, value: m.value }))
    const dots = id === "heat" && sheltersLoaded ? shelterMarkers(heatShelters, domain) : []
    return [...riskMarkers.filter((m) => m.domain === domain), ...warningMarkers(warn, domain), ...fact, ...dots]
  })
}
