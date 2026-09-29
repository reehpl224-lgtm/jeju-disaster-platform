/**
 * 시나리오 선택·초기화 (1차년도 실증용 프로토타입).
 *
 * 화면의 "지금 상황"은 각 mock*.ts의 값이다. 이 파일은 그 값을 **앱이 뜰 때 한 번** 시나리오 값으로 덮어쓸 수 있게 하는 틀이다.
 * 시나리오는 localStorage에 저장하고, 바꾸면 새로고침해서 처음부터 다시 적용한다 — 화면 코드는 시나리오를 몰라도 되고,
 * 모든 화면이 같은 값을 본다.
 *
 * 2026-09-29: 사용자 요청으로 기존 시나리오(하천 효돈천 주의·연안 협재 이안류)와 mock 더미·스냅샷을 전부 지웠다 — 시나리오는 새로
 * 만들 예정이라 지금은 "기본(빈 상태)"만 있다. 새 시나리오를 만들 때:
 *  1. SCENARIOS에 { id, label, summary, flow }를 추가한다.
 *  2. 아래 applyXxx() 함수를 쓰고 맨 아래에서 ACTIVE_SCENARIO_ID로 호출한다(replaceAll·patch·patchById 도구 사용).
 *  3. main.tsx에서 scenarioClock보다 **먼저** import된다 — 여기서 넣은 시각도 clock이 실제 현재 시각으로 옮긴다
 *     (mockRiver·mockCoast·mockAqua·mockDashboard의 anchor는 09:15 — 시각은 "지금 = 09:15" 기준으로 쓴다).
 *  4. 등급(level)은 손으로 지어내지 않고 확정 기준(coastAlertThresholds의 classifyCoastRisk, marineAlertThresholds의
 *     classifyMarineRiskLevel, 하천 riverStageCriteria의 계획홍수량 구간)에 맞춘다. 대상지는 확정값만: 하천=효돈천(돈내코·쇠소깍),
 *     연안=함덕·협재, 저염분=한경 금등·한경 용수·대정 일과.
 *  5. 같은 사실을 들고 있는 곳을 함께 맞춘다 — 서비스 카드 집계·지도 마커·dashboardSensors·timeSeries·sixHourSeries·recentActions
 *     (mockDashboard)와 각 서비스의 xxxFlowProgress. 어긋나는지는 consistency.ts가 검사한다(개발 서버 콘솔).
 */

export interface ScenarioInfo {
  id: string
  label: string
  summary: string
  /** 이 시나리오에서 팀장이 보게 되는 흐름 한 줄 */
  flow: string
}

export const SCENARIOS: ScenarioInfo[] = [
  {
    id: "default",
    label: "기본 (빈 상태)",
    summary: "모든 서비스가 평시이고 사건·이력·관측 더미가 없는 초기 상태. 실시간 API 패널만 실제 값을 보여줍니다.",
    flow: "진행 중인 사건 없음",
  },
]

const STORAGE_KEY = "jeju-ax-scenario"

export function getScenarioId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    return SCENARIOS.some((s) => s.id === id) ? (id as string) : "default"
  } catch {
    return "default"
  }
}

/** 시나리오를 바꾸고 새로고침한다(값을 앱 시작 시 한 번만 덮어쓰므로). "default"는 초기화. */
export function setScenario(id: string) {
  try {
    if (id === "default") localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* 저장이 막힌 환경(시크릿 창 등)에선 바꿀 수 없다 — 기본 유지 */
  }
  window.location.reload()
}

// ------------------------------------------------------------------ 덮어쓰기 도구(새 시나리오용)
export function replaceAll<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next)
}
export function patch<T extends object>(target: T, next: Record<string, unknown>) {
  Object.assign(target, next)
}
/** 배열에서 id가 같은 항목만 골라 필드를 덮어쓴다 */
export function patchById<T extends { id: string }>(list: T[], id: string, next: Record<string, unknown>) {
  const item = list.find((x) => x.id === id)
  if (item) Object.assign(item, next)
}

// ------------------------------------------------------------------ 적용
export const ACTIVE_SCENARIO_ID = getScenarioId()
// 새 시나리오를 만들면 여기서 호출한다: if (ACTIVE_SCENARIO_ID === "my-scenario") applyMyScenario()
