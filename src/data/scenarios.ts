/**
 * 시나리오 선택·초기화 (1차년도 실증용 프로토타입).
 *
 * 화면의 "지금 상황"은 각 mock*.ts의 값이다. 이 파일은 그 값을 **앱이 뜰 때 한 번** 시나리오 값으로 덮어써서
 * 하천·연안의 대표 사건을 보여준다(기본 = 덮어쓰지 않음). 시나리오는 localStorage에 저장하고, 바꾸면 새로고침해서
 * 처음부터 다시 적용한다 — 화면 코드는 시나리오를 몰라도 되고, 모든 화면이 같은 값을 본다.
 *
 * 규칙
 *  - main.tsx에서 scenarioClock보다 **먼저** import한다. 여기서 넣은 시각도 clock이 실제 현재 시각으로 옮긴다
 *    (mockRiver·mockCoast·mockDashboard의 anchor는 09:15 — 아래 시각은 전부 "지금 = 09:15" 기준으로 쓴다).
 *  - 등급(level)은 손으로 지어내지 않고 확정 기준(coastAlertThresholds의 classifyCoastRisk, 하천 riverStageCriteria의
 *    계획홍수량 구간)에 맞춘다. 수치·이름은 시나리오 더미이며 실측이 아니다(화면에서 "*" 표기).
 *  - 대상지는 확정값만: 하천=효돈천(돈내코·쇠소깍) 한 곳, 연안=함덕·협재.
 *  - 한 시나리오가 건드리는 화면 값(서비스 카드 집계, 지도 마커, 센서·시계열, 최근 조치)까지 함께 맞춘다 —
 *    그래야 대시보드·팀장 브리핑·통합 결재함·상세 화면이 같은 숫자를 보여준다. 어긋나는지는 consistency.ts가 검사한다.
 */
import * as Coast from "./mockCoast"
import * as Dashboard from "./mockDashboard"
import * as HeavyRain from "./mockHeavyRain"
import * as River from "./mockRiver"
import { classifyCoastRisk } from "./coastAlertThresholds"

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
    label: "기본 (저염분 관심 · 호우/태풍/폭염)",
    summary: "저염분 고수온은 한경 용수 관심 단계, 하천·연안은 평시. 호우·태풍·폭염은 발령 중인 기존 시연 상태.",
    flow: "저염분 관심: 감지→확인→판단(관심 유지)→경보 보류→대응 진행",
  },
  {
    id: "river",
    label: "하천 대표 — 효돈천 돌발 강우 주의(1단계)",
    summary: "돈내코 수위가 급상승해 주의 단계. 팀장이 상향을 승인하고 경보를 발송했으며 출동 요청이 승인 대기 중.",
    flow: "감지→확인→판단(주의 승인)→경보 발송→대응 진행(출동 요청 승인 대기)",
  },
  {
    id: "coast",
    label: "연안 대표 — 협재 이안류 감지 주의",
    summary: "협재 스마트폴 AI CCTV가 이안류를 감지해 주의 단계. 대외 경보와 해경 출동 요청이 팀장 승인 대기 중.",
    flow: "감지→확인→판단(팀장 승인 대기)→경보·출동 요청은 승인 후",
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

// ------------------------------------------------------------------ 덮어쓰기 도구
function replaceAll<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next)
}
function patch<T extends object>(target: T, next: Record<string, unknown>) {
  Object.assign(target, next)
}
/** 배열에서 id가 같은 항목만 골라 필드를 덮어쓴다 */
function patchById<T extends { id: string }>(list: T[], id: string, next: Record<string, unknown>) {
  const item = list.find((x) => x.id === id)
  if (item) Object.assign(item, next)
}

// ------------------------------------------------------------------ 하천 — 효돈천 돌발 강우 주의(1단계)
function applyRiver() {
  const R = River
  // 등급: 돈내코 = 주의(1단계, 계획홍수량 50~70% 구간 → 약 55%), 쇠소깍 = 관심(하류라 조위 영향으로 상승 중)
  replaceAll(R.riverStatuses, [
    { id: "soesokkak", name: "효돈천(쇠소깍)", level: "caution", stage: "관심 · 감시 강화", eta: "예상 없음(감시 중)", updatedAt: "09:10" },
    { id: "donnaeko", name: "효돈천(돈내코)", level: "warning", stage: "1단계 · 주의", eta: "예상 없음(감시 중)", updatedAt: "09:12" },
  ])
  replaceAll(R.riverApprovalHistory, [
    { id: "h1", time: "08:38", title: "돌발 강우 감지 — 예보 5mm/h 대비 실측 21.4mm/h (AI 조기경고)" },
    { id: "h2", time: "08:42", title: "돈내코 수위 유의 수위 도달 — 시스템 관심 단계 자동 판정" },
    { id: "h3", time: "08:50", title: "센서·레이더 교차검증 확인 — 홍길동 팀장" },
    { id: "h4", time: "08:58", title: "주의(1단계) 상향 승인 — 홍길동 팀장" },
    { id: "h5", time: "09:00", title: "하천변 출입 통제 안내 발송 승인 — 홍길동 팀장" },
  ])
  patch(R.riverSopStage, {
    current: "주의 단계 (1단계)",
    level: "warning",
    next: "경계(2단계) 상향은 경보 수위 도달 또는 강우 지속 시 팀장 승인 필요 — 현재 수위 상승세 지속 관찰 중",
  })
  patch(R.riverRiskBasis, {
    rainfall: { value: "34.5 mm", detail: "주의 수준 — 예보 대비 초과", trend: "상승 중" },
    waterLevel: { value: "1.92 m", detail: "주의보 수위 도달 (계획홍수량 약 55%)", trend: "6시간간 +0.90m 상승" },
    radar: { value: "강한 강우 접근", detail: "30분 내 추가 15mm 예상", confidence: "신뢰도 82%" },
    saturation: { value: "71%", detail: "추가 흡수 여력 낮음", grade: "높음" },
  })
  patch(R.riverSuddenRainAlert, {
    forecastMm: 5,
    observedMm: 21.4,
    detectedAt: "08:38",
    level: "warning",
    label: "AI 조기경고",
    trendNote: "예보 대비 +16.4mm — 최근 30분간 상승 지속",
    aiNote: "예보(5mm/h)를 크게 넘는 돌발 강우가 감지됐고 상류 강우가 이어지고 있습니다. 현재 추이가 유지되면 경보 수위 접근 여부를 1시간 안에 판단해야 합니다.",
  })
  patch(R.riverWaterLevelAiForecast, {
    sixHourAgoM: 1.02,
    currentM: 1.92,
    trendNote: "6시간간 상승폭 0.90m — 최근 1시간 급상승",
    status: "조기경보 발령",
    aiNote: "누적 수위 이력의 상승 기울기가 주의 구간에 진입했습니다. 경계 수위 도달 여부는 담당자가 판단합니다.",
    confirmNote: "수위 상승 지속 — 팀장 확인으로 주의 단계를 유지 중이며 경계 상향은 추가 승인이 필요합니다.",
  })
  // 쇠소깍(감조구간) 수위·조위 — 조위 만조(15:10 예상)까지 상승 여지
  const tide = [0.9, 0.95, 1.0, 1.05, 1.15, 1.31, 1.38, 1.42, 1.36, 1.28, 1.2]
  R.riverTideCorrelation.series.forEach((p, i) => {
    p.waterLevelM = tide[i]
  })
  patch(R.riverImpact, {
    area: "효돈천 돈내코 하류~쇠소깍 하천변 산책로 및 하효동 저지대 일부",
    population: "하천변 이용객·인근 주민 약 400명 추정",
    facilities: "돈내코 산책로 · 쇠소깍 관광시설 · 하효동 저지대 주택",
    evacuationRoutes: "2개 경로 가용 (하효동 방면 우선)",
  })
  replaceAll(R.riverCctv, [
    { id: "c1", label: "효돈천 돈내코", time: "09:12:00", detected: "수위 상승·탁류 확인", quality: "양호" },
    { id: "c2", label: "효돈천 쇠소깍", time: "09:12:20", detected: "이상 없음", quality: "양호" },
  ])
  patchById(R.riverSensorCheck, "s1", { value: "1.92 m", detail: "레이더 수위 비교 ±0.03 m" })
  patchById(R.riverSensorCheck, "s2", { value: "1.31 m", detail: "최종 수신 09:10 (실시간)" })
  patch(R.riverDataConfidence, { overall: "높음 (91%)", note: "전 센서 수신 중 — 강우레이더 신뢰도 82%" })
  patch(R.riverAlertDispatch, {
    stage: "1단계 · 주의",
    level: "warning",
    title: "효돈천 하천변 출입 통제 안내",
    target: "하효동·상효동 주민 및 돈내코·쇠소깍 방문객",
    targetDetail: "하천변 산책로 이용객 포함",
    sentAt: "09:00:12",
    approver: "홍길동 팀장",
    message: "주의 — 효돈천 수위 상승. 하천변 출입 통제 및 접근 자제",
    channels: [
      { id: "ch1", name: "문자 (CBS/SMS)", sent: 1240, success: 1226, fail: 14, rate: "98.9%", lastSent: "09:00:15" },
      { id: "ch2", name: "모바일 앱 푸시", sent: 860, success: 855, fail: 5, rate: "99.4%", lastSent: "09:00:18" },
      { id: "ch3", name: "현장 단말 (무선)", sent: 4, success: 3, fail: 1, rate: "75.0%", lastSent: "09:00:20", unit: "대" },
      { id: "ch4", name: "상황판 방송", sent: 3, success: 3, fail: 0, rate: "100%", lastSent: "09:00:22", unit: "개소" },
    ],
    totalFail: 20,
  })
  replaceAll(R.riverControlRows, [
    { id: "r1", river: "효돈천(쇠소깍)", stage: "관심 · 감시 강화", location: "서귀포시 하효동 쇠소깍 일원", gate: "오류 발생", dispatch: "해당 없음", ack: "미확인" },
    { id: "r2", river: "효돈천(돈내코)", stage: "주의 · 출입 통제 중", location: "서귀포시 상효동 돈내코 계곡", gate: "정상 작동", dispatch: "승인 대기", ack: "확인" },
  ])
  replaceAll(R.riverControlFailures, [
    { id: "f1", title: "쇠소깍 차단기 통신 두절", time: "09:06", cause: "LTE 음영 구역 — 지난 사례(RIV-2026-0904)와 같은 원인", action: "현장 수동 통제 요청 — 담당 최지우 주무관" },
  ])
  replaceAll(R.riverPropagation, [
    { id: "p1", channel: "문자(CBS)", status: "발송 완료 09:00" },
    { id: "p2", channel: "제주 AX 앱 푸시", status: "발송 완료 09:00" },
    { id: "p3", channel: "현장 단말", status: "4대 중 3대 도달 (1대 미전달)" },
    { id: "p4", channel: "상황판", status: "3개소 표출 중" },
  ])
  replaceAll(R.riverControlTimeline, [
    { id: "ct1", time: "08:38", title: "돌발 강우 감지 — AI 조기경고" },
    { id: "ct2", time: "08:58", title: "주의(1단계) 상향 승인 — 홍길동 팀장" },
    { id: "ct3", time: "09:00", title: "하천변 출입 통제 안내 발송 (문자·앱·현장 단말·상황판)" },
    { id: "ct4", time: "09:03", title: "돈내코 산책로 출입 통제 개시" },
    { id: "ct5", time: "09:06", title: "쇠소깍 차단기 통신 두절 — 수동 통제 요청" },
    { id: "ct6", time: "09:10", title: "서귀포소방서 출동 요청 작성 — 팀장 승인 대기" },
  ])
  replaceAll(R.riverJointAgencies, [
    { id: "j1", agency: "제주도청 재난안전과", status: "상황 공유 완료" },
    { id: "j2", agency: "서귀포시 상황실", status: "출동 준비 중" },
    { id: "j3", agency: "소방서 (서귀포)", status: "출동 요청 대기 (승인 필요)" },
    { id: "j4", agency: "경찰서 (서귀포시)", status: "대기 중" },
  ])
  patch(R.riverDispatchRequest, {
    target: "서귀포소방서 — 돈내코 현장 점검 및 하천변 이용객 안내",
    stage: "1단계 · 주의 — 출동 요청 승인 대기",
    level: "warning",
    eta: "예상 없음(감시 중)",
    impact: "돈내코 계곡 이용객·상류 야영객 대피 안내",
    requestedAt: "09:10",
    requester: "최지우 주무관",
    analysis: ["수위 1.92m — 주의보 수위 도달(계획홍수량 약 55%)", "강우레이더: 30분 내 추가 15mm 예상", "쇠소깍 차단기 통신 두절로 현장 수동 통제 필요"],
    process: [
      { id: "pr1", time: "09:03", title: "돈내코 산책로 출입 통제 개시" },
      { id: "pr2", time: "09:10", title: "서귀포소방서 출동 요청 작성 — 최지우 주무관" },
      { id: "pr3", time: "09:12", title: "팀장 승인 대기 (미승인 시 요청은 발송되지 않음)" },
    ],
  })
  patch(R.riverFlowProgress, { 감지: "08:38", 확인: "08:50", 판단: "08:58", 경보: "09:00", 대응: "진행 중" })

  // --- 대시보드 공통(서비스 카드·지도·센서·시계열·최근 조치) — 하천 값과 같아야 한다
  const river = Dashboard.serviceStatusCards.find((c) => c.id === "river")
  if (river) patch(river.counts, { warning: 1, alert: 0, danger: 0, caution: 1 })
  patchById(Dashboard.riskMarkers, "donnaeko", { level: "warning" })
  patchById(Dashboard.riskMarkers, "soesokkak", { level: "caution" })
  patchById(Dashboard.dashboardSensors, "sn1", { value: "1.92 m", status: "warning", updatedAt: "09:12" })
  patchById(Dashboard.dashboardSensors, "sn2", { value: "1.31 m", status: "caution", updatedAt: "09:10" })
  patchById(Dashboard.dashboardSensors, "sn3", { value: "강우 21.4 mm/h", status: "warning", updatedAt: "09:12" })
  const ts = Dashboard.timeSeries
  ts[0] = { ...ts[0], value: 1.92 }
  ts[1] = { ...ts[1], value: 1.31 }
  const six = Dashboard.sixHourSeries
  const donnaeko = [1.02, 1.03, 1.05, 1.2, 1.55, 1.92]
  const soesokkak = [0.95, 0.96, 0.97, 1.02, 1.15, 1.31]
  six.forEach((row, i) => Object.assign(row, { 돈내코수위: donnaeko[i], 쇠소깍수위: soesokkak[i] }))
  replaceAll(Dashboard.recentActions, [
    { id: "a1", time: "09:12", title: "서귀포소방서 출동 요청 작성 — 팀장 승인 대기", owner: "하천관제팀", note: "쇠소깍 차단기 통신 두절로 수동 통제 병행" },
    { id: "a2", time: "09:00", title: "효돈천 하천변 출입 통제 안내 발송 (4개 채널)", owner: "홍길동 팀장 승인", note: "실패 20건 재발송 검토" },
    { id: "a3", time: "08:58", title: "효돈천(돈내코) 주의(1단계) 상향 승인", owner: "홍길동 팀장", note: "센서·레이더 교차검증 후 승인" },
    { id: "a5", time: "08:52", title: "한경 용수 인근 염분 관심 구간 진입 감지", owner: "시스템 자동 판정", note: "AI 자동 관심 단계 판정 · 담당자 확인 대기" },
    { id: "a4", time: "08:38", title: "효돈천 돌발 강우 감지 — 예보 5mm/h 대비 실측 21.4mm/h", owner: "시스템 자동 판정", note: "AI 조기경고" },
  ])
  // 호우 서비스 전광판 송출 문구도 같은 사건을 말해야 한다
  patchById(HeavyRain.broadcastLog, "bl-1", { message: "효돈천 하천범람 주의 단계 — 하천변 출입 통제" })
}

// ------------------------------------------------------------------ 연안 — 협재 이안류 감지 주의
function applyCoast() {
  const C = Coast
  // 등급은 확정 결합 규칙으로 계산 — 파고 1.9m(주의 구간) · 풍속 11.2m/s(주의 구간)
  const WAVE_M = 1.9
  const WIND_MS = 11.2
  const risk = classifyCoastRisk({ waveM: WAVE_M, windMs: WIND_MS, tide: "평시" })
  const level = risk.level // warning
  patch(C.coastSummary, {
    activeEvents: { count: 1, detail: "이안류 감지 1건 (협재해수욕장)" },
    unconfirmedEvents: { count: 1, detail: "팀장 승인 대기 1건" },
    coordination: { count: 1, detail: "해경 출동 대기 1건" },
  })
  replaceAll(C.coastAiInsights, [
    {
      id: "ai1",
      level,
      title: "협재 이안류 위험 지수 상승",
      basis: `AI CCTV 협재 스마트폴 #1 영상 패턴 + 파고 ${WAVE_M}m·풍속 ${WIND_MS}m/s`,
      match: "위험 지수 0.71 / 1.0 · 신뢰도 87%",
    },
  ])
  replaceAll(C.coastEvents, [
    { id: "evt-1", level, type: "이안류 감지", source: "AI CCTV · 협재 AIoT 스마트폴 #1", location: "협재해수욕장 중앙 해변", time: "08:47", status: "미확인" },
  ])
  replaceAll(C.coastFieldAlerts, [
    { id: "fa1", location: "협재해수욕장 스마트폴 #1·#2", level, time: "09:05", detail: "경보스피커 자동 방송 — 이안류 주의 안내" },
  ])
  replaceAll(C.coastAgencyStatuses, [
    { id: "a1", agency: "해경", status: "출동 대기", detail: "협재 인근 순찰정 대기 — 팀장 승인 시 출동 요청", level: "caution" },
    { id: "a2", agency: "소방", status: "평시 대기", detail: "출동 요청 없음", level: "safe" },
  ])
  patch(C.coastEventDetail, {
    id: "COA-2026-0922",
    level,
    status: "판단 대기 — 팀장 승인 필요",
    type: "이안류 감지",
    detectedAt: "08:47",
    grade: "주의",
    source: "AI CCTV · 협재 AIoT 스마트폴 #1",
    zone: "협재해수욕장",
    reviewer: "정민준 주무관",
    reviewStatus: "검토 완료 — 승인 요청",
    location: "협재해수욕장 중앙 해변 (스마트폴 #1 시야)",
    radius: "약 40 m",
    nearbyCoast: "협재·금능 해변 연접 해안",
    ripCurrentZone: "중앙 해변 이안류 위험구간 1곳",
    waveZone: "월파 구간 해당 없음",
    rainSummary: { value: "10분 누적 강우 0 mm", detail: "영향 없음", updatedAt: "09:10" },
    waveSummary: { value: `유의 파고 ${WAVE_M} m`, detail: "주의 구간 (1.5~2.5m)", updatedAt: "09:10" },
    ripCurrentRisk: { value: "AI 모델 위험 지수 0.71 / 1.0", detail: "이안류 패턴 감지", confidence: "신뢰도 87%" },
    detection: { class: "탐지 클래스: Rip_Current", confidence: "신뢰도 87% · 최근 3프레임 연속" },
    sensorCrossCheck: [
      { id: "sc1", name: "조류 센서 CS-04", status: "이안류 유속 확인" },
      { id: "sc2", name: "수온 부이 BU-11", status: "정상" },
    ],
    timeline: [
      { id: "t1", time: "08:47", title: "● AI CCTV 이안류 패턴 감지 — 위험 지수 0.71" },
      { id: "t2", time: "08:49", title: "● 시스템 자동 판정 — 파고 1.9m·풍속 11.2m/s와 결합해 주의" },
      { id: "t3", time: "08:52", title: "● 담당자 검토 시작 — 정민준 주무관" },
      { id: "t4", time: "09:05", title: "● 현장 경보스피커 자동 방송 (입수 자제)" },
      { id: "t5", time: "09:10", title: "● 대외 경보·해경 출동 요청 승인 요청 — 팀장 승인 대기" },
    ] as { id: string; time: string; title: string }[],
    agencyStatus: [
      { id: "ag1", agency: "제주해양경찰서", status: "출동 대기" },
      { id: "ag2", agency: "제주시 재난안전과", status: "상황 공유 완료" },
      { id: "ag3", agency: "서귀포시 상황실", status: "평시 대기" },
      { id: "ag4", agency: "119 해상구조대", status: "평시 대기" },
    ],
    fieldActions: {
      dispatch: "출동 요청 초안 작성 — 팀장 승인 대기",
      control: "해변 입수 통제 방송 중 (자동)",
      alert: "현장 스피커 방송 완료 · 대외 경보(문자·앱) 승인 대기",
    },
  })
  patch(C.coastDispatch, {
    summary: { title: "협재 이안류 — 해경 출동 요청 초안", level, location: "협재해수욕장 중앙 해변", detectedAt: "08:47" },
    confidence: 87,
    ripCurrent: "위험 지수 0.71 (주의)",
    aiReason: `협재 스마트폴 #1 영상에서 이안류 패턴이 연속 감지되고, 파고 ${WAVE_M}m·풍속 ${WIND_MS}m/s가 모두 주의 구간에 걸쳐 있습니다.`,
    radius: "약 40 m",
    nearbyVisitors: "약 60명 추정",
    weather: "남서풍 11m/s · 시정 양호",
    request: {
      status: "초안 작성됨 — 팀장 승인 대기",
      agency: "제주해양경찰서",
      sentAt: "미발송",
      priority: "보통 (주의 단계)",
      vessel: "협재 인근 순찰정 1척 대기",
      eta: "승인 후 약 15분",
      fireLinked: "연계 대기",
      boardShared: "공유 완료",
    },
    fallback: "승인 전에는 출동 요청이 발송되지 않습니다. 팀장 부재 시 담당자가 유선으로 해경에 직접 요청합니다.",
  })
  replaceAll(C.coastMonitoringDomains, [{ id: "coast", label: "연안", status: "주의", detail: "이안류 감지 1건 · 경보 장비 정상", level }])
  patch(C.coastFlowProgress, { 감지: "08:47", 확인: "08:52", 판단: "승인 대기" })

  const coast = Dashboard.serviceStatusCards.find((c) => c.id === "coast")
  if (coast) patch(coast.counts, { warning: 1, alert: 0, danger: 0, caution: 0 })
  patchById(Dashboard.riskMarkers, "hyeopjae", { level })
  patchById(Dashboard.dashboardSensors, "sn5", { value: `파고 ${WAVE_M} m`, status: level, updatedAt: "09:10" })
  const recent = Dashboard.recentActions
  recent.unshift({ id: "a0", time: "09:10", title: "협재 이안류 — 대외 경보·해경 출동 요청 승인 요청", owner: "연안관제팀", note: "팀장 승인 대기" })
  recent.splice(5)
  recent.splice(1, 0, { id: "a00", time: "09:05", title: "협재 스마트폴 경보스피커 자동 방송", owner: "시스템", note: "입수 자제 안내" })
  recent.splice(5)
}

// ------------------------------------------------------------------ 적용
export const ACTIVE_SCENARIO_ID = getScenarioId()
if (ACTIVE_SCENARIO_ID === "river") applyRiver()
if (ACTIVE_SCENARIO_ID === "coast") applyCoast()
