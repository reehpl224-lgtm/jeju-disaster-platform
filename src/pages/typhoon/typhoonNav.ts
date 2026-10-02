// 순서는 하천범람(RIVER_NAV) 기준 — 분석 → 발령 → 종료 → 데이터 수집. 없는 메뉴는 만들지 않는다.
export const TYPHOON_NAV = [
  { to: "/typhoon", label: "홈", end: true },
  { to: "/typhoon/analysis", label: "경로 분석" },
  { to: "/typhoon/alert", label: "대비 발령" },
  { to: "/typhoon/closure", label: "종료 보고" },
  { to: "/typhoon/data", label: "데이터 수집" },
]
