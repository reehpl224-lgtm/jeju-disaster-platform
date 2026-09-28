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
  // e-SOP 대응·실시간 모니터링은 메뉴에서 뺐지만(아래 주석) "대응 여정" 카드 등으로 여전히 열리므로,
  // 열렸을 때 사이드바·경로 표시가 비지 않도록 경보 이후 단계인 "경보 발송" 아래로 묶는다(2026-09-28).
  // e-SOP 대응 메뉴를 복원하면 also에서 두 경로를 빼고 아래 줄을 살리면 된다.
  { to: "/aqua/alerts", label: "경보 발송", also: ["/aqua/response", "/aqua/monitoring"] },
  // 2026-09-28 사용자 요청으로 메뉴에서 주석 처리 — 화면·라우트(/aqua/response)는 그대로 두었으니
  // 복원할 땐 이 줄만 다시 살리면 됨(navTabs가 AQUA_NAV 기준으로 두 메뉴를 함께 만든다).
  // { to: "/aqua/response", label: "e-SOP 대응", also: ["/aqua/monitoring"] },
  { to: "/aqua/closure", label: "종료 보고" },
]
