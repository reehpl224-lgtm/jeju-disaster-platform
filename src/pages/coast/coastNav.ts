/** 연안 안전관리 메뉴 — GIS 보드 좌측 탭과 상세 화면 사이드바가 이 목록 하나를 같이 쓴다(aquaNav.ts 설명 참고) */
export const COAST_NAV = [
  { to: "/coast", label: "홈", end: true },
  { to: "/coast/data", label: "데이터 수집" },
  { to: "/coast/events", label: "위험 이벤트" },
  { to: "/coast/alerts", label: "경보 발송" },
  { to: "/coast/dispatch", label: "현장 공조" },
  { to: "/coast/monitoring", label: "현장 모니터링" },
  { to: "/coast/closure", label: "종료 보고" },
]
