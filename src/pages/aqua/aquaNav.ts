/**
 * 저염분 고수온 메뉴 — GIS 보드 좌측 탭(domainConfigs.tsx)과 상세 화면 사이드바(DomainSidebar)가
 * 이 목록 하나를 같이 쓴다(2026-09-28). 라벨·순서를 바꿀 땐 여기만 고치면 두 메뉴가 함께 바뀐다.
 * also: 별도 메뉴 없이 이 항목 아래로 묶이는 하위 화면(사이드바 강조·경로 표시에 사용).
 */
export const AQUA_NAV = [
  { to: "/aqua", label: "홈", end: true },
  { to: "/aqua/data", label: "데이터 수집" },
  { to: "/aqua/prediction", label: "AI 예측" },
  { to: "/aqua/farms", label: "영향 양식장" },
  { to: "/aqua/alerts", label: "경보 발송" },
  { to: "/aqua/response", label: "e-SOP 대응", also: ["/aqua/monitoring"] },
  { to: "/aqua/closure", label: "종료 보고" },
]
