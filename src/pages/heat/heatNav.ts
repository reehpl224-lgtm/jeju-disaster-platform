// 순서는 하천범람(RIVER_NAV) 기준 — 현황 → 발송 → 해제 → 데이터 수집. 없는 메뉴는 만들지 않는다.
export const HEAT_NAV = [
  { to: "/heat", label: "홈", end: true },
  { to: "/heat/analysis", label: "특보 현황" },
  { to: "/heat/alert", label: "안내 발송" },
  { to: "/heat/closure", label: "해제 보고" },
  { to: "/heat/data", label: "데이터 수집" },
]
