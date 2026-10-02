/**
 * 저염분 고수온 메뉴 — GIS 보드 좌측 탭(domainConfigs.tsx)과 상세 화면 사이드바(DomainSidebar)가
 * 이 목록 하나를 같이 쓴다(2026-09-28). 라벨·순서를 바꿀 땐 여기만 고치면 두 메뉴가 함께 바뀐다.
 * also: 별도 메뉴 없이 이 항목 아래로 묶이는 하위 화면(사이드바 강조·경로 표시에 사용).
 * e-SOP 대응(/aqua/response)은 운영 > e-SOP 대응(/esop)으로 옮겨 메뉴에서 뺐다(2026-10-02) — 경로는 그대로 살아 있다.
 * 실시간 모니터링(/aqua/monitoring)은 e-SOP 대응에 묶여 있다가 e-SOP가 빠지면서 독립 메뉴가 됐다(경보 발송 뒤).
 */
export const AQUA_NAV = [
  { to: "/aqua", label: "홈", end: true },
  { to: "/aqua/prediction", label: "AI 예측" },
  { to: "/aqua/farms", label: "영향 대상" },
  { to: "/aqua/alerts", label: "경보 발송", also: ["/aqua/response"] },
  { to: "/aqua/monitoring", label: "실시간 모니터링" },
  { to: "/aqua/closure", label: "종료 보고" },
  { to: "/aqua/data", label: "데이터 수집" },
]
