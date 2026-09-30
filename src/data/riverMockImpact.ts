import type { RiskLevel } from "../types/domain"
import type { RiverResourceKind } from "../types/riverRun"

type RiverLocation = "돈내코" | "쇠소깍"

/**
 * 고정 모의 시설 카탈로그(§11-3) — 실제 시설·거주 인구가 아니라 시연용 모의 대상이다.
 * 등급이 오르면 카탈로그 앞에서부터 순서대로 활성화해 결과가 재현되게 한다(임의 선택 금지).
 */
export const RIVER_MOCK_FACILITIES: Record<RiverLocation, { id: string; label: string }[]> = {
  돈내코: [
    { id: "D-01", label: "D-01 모의 하천변 산책구역" },
    { id: "D-02", label: "D-02 모의 하상 접근로" },
    { id: "D-03", label: "D-03 모의 임시주차구역" },
  ],
  쇠소깍: [
    { id: "S-01", label: "S-01 모의 하구 산책구역" },
    { id: "S-02", label: "S-02 모의 하상 접근로" },
    { id: "S-03", label: "S-03 모의 저지대 대기구역" },
  ],
}

interface LevelImpact {
  facilityCount: number
  /** 실제 피해 인원이 아니라 점검 대상으로 설정된 모의 영향대상 수(§11-3) */
  affectedPeople: number
  resources: { kind: RiverResourceKind; qty: number }[]
}

/** 계획홍수량비율(%) 등급별 영향·권고 규칙(§11-3, staging-river-scenario-sample §3과 동일) */
const IMPACT_BY_LEVEL: Record<RiskLevel, LevelImpact> = {
  safe: { facilityCount: 0, affectedPeople: 0, resources: [] },
  caution: { facilityCount: 1, affectedPeople: 5, resources: [] },
  warning: { facilityCount: 2, affectedPeople: 15, resources: [{ kind: "통제 인력", qty: 1 }, { kind: "차단기", qty: 1 }] },
  alert: { facilityCount: 3, affectedPeople: 30, resources: [{ kind: "통제 인력", qty: 2 }, { kind: "차단기", qty: 1 }, { kind: "출동차", qty: 1 }] },
  danger: { facilityCount: 3, affectedPeople: 50, resources: [{ kind: "통제 인력", qty: 2 }, { kind: "차단기", qty: 1 }, { kind: "출동차", qty: 1 }] },
  info: { facilityCount: 0, affectedPeople: 0, resources: [] },
  offline: { facilityCount: 0, affectedPeople: 0, resources: [] },
}

function activeFacilities(location: RiverLocation, level: RiskLevel) {
  return RIVER_MOCK_FACILITIES[location].slice(0, IMPACT_BY_LEVEL[level].facilityCount)
}

/** 한 지점의 현재 등급에서의 모의 영향(활성 시설·영향대상 인원) — 지점 카드 표시용 */
export function riverImpactForPoint(location: RiverLocation, level: RiskLevel) {
  return { facilities: activeFacilities(location, level), people: IMPACT_BY_LEVEL[level].affectedPeople }
}

/** 지점의 현재 등급에서 특정 자원 종류의 권고 수량(§11-3 "지점별 권고 자원") — 자원 배치 카드에 표시용 */
export function riverRecommendedQty(level: RiskLevel, kind: RiverResourceKind): number {
  return IMPACT_BY_LEVEL[level].resources.find((r) => r.kind === kind)?.qty ?? 0
}

/** 두 지점을 합산한 영향 요약 — riverRunState.projectToMock()이 RV.riverImpact에 반영한다 */
export function riverImpactSummary(pointState: Record<RiverLocation, { level: RiskLevel } | undefined>) {
  const locations: RiverLocation[] = ["돈내코", "쇠소깍"]
  let totalPeople = 0
  const facilities: { id: string; label: string; location: RiverLocation }[] = []
  for (const loc of locations) {
    const level = pointState[loc]?.level ?? "safe"
    totalPeople += IMPACT_BY_LEVEL[level].affectedPeople
    for (const f of activeFacilities(loc, level)) facilities.push({ ...f, location: loc })
  }
  return { facilities, totalPeople }
}
