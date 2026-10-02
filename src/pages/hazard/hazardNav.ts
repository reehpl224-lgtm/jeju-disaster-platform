import { HAZARDS, type HazardId } from "../../data/mockHazards"

/** 산불·지진해일·대설 하위 메뉴 — 호우(HEAVY_RAIN_NAV)와 같은 5개 구성, 순서는 하천범람 기준. items[0]("홈")은 위치 고정 */
export const hazardNav = (id: HazardId) => {
  const p = HAZARDS[id].path
  return [
    { to: p, label: "홈", end: true },
    { to: `${p}/analysis`, label: "상세 분석" },
    { to: `${p}/alert`, label: "경보 발송" },
    { to: `${p}/closure`, label: "종료 보고" },
    { to: `${p}/data`, label: "데이터 수집" },
  ]
}

export const WILDFIRE_NAV = hazardNav("wildfire")
export const TSUNAMI_NAV = hazardNav("tsunami")
export const SNOW_NAV = hazardNav("snow")
