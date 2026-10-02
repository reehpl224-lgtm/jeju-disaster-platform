// 순서는 하천범람(RIVER_NAV) 기준 — 분석 → 경보 → 종료 → 데이터 수집. 없는 메뉴는 만들지 않는다.
export const HEAVY_RAIN_NAV = [
  { to: "/heavy-rain", label: "홈", end: true },
  { to: "/heavy-rain/analysis", label: "상세 분석" },
  { to: "/heavy-rain/alert", label: "경보 발송" },
  { to: "/heavy-rain/closure", label: "종료 보고" },
  { to: "/heavy-rain/data", label: "데이터 수집" },
]
