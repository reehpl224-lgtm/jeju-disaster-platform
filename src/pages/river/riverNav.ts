// 순서는 대응 흐름 기준(상황 파악 → 판단 → 경보 → 출동·통제 → 종료)이고, 데이터 확인·시나리오 설정은 후순위다.
// 실시간 모니터링은 저염분·연안과 같이 종료 보고 앞에 둔다(대응 중 관측 확인). 출동과 현장 통제는 실제 상황에서 병행될 수 있어 이 순서가 집행 순서를 강제하지는 않는다
// (staging-river-dashboard-review-2026-10-01 §4). items[0]("홈")은 DomainSidebar·navTabs()가 "상세
// 대시보드"로 바꿔치기하는 자리라 순서를 바꾸면 안 된다 — 위치 고정, 아래부터만 재배치 대상.
export const RIVER_NAV = [
  { to: "/river", label: "홈", end: true },
  { to: "/river/analysis", label: "상황 분석" },
  { to: "/river/alert", label: "경보 발송" },
  { to: "/river/dispatch", label: "출동 요청" },
  { to: "/river/control", label: "현장 통제" },
  { to: "/river/monitoring", label: "실시간 모니터링" },
  { to: "/river/closure", label: "종료 보고" },
  { to: "/river/data", label: "데이터 수집" },
  { to: "/river/scenario", label: "시나리오 실행", divider: true },
]
