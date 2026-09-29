import type { RiverControlRow, RiverStatus, RiverTidePoint, TimelineEntry } from "../types/river"
import type { RiskLevel } from "../types/domain"
import type { FlowProgress } from "../types/flow"

export const riverTarget = {
  area: "서귀포시 효돈천 (돈내코·쇠소깍)",
  accuracyGoal: "예측 일치율 85% 이상",
  leadTimeGoal: "1시간 선행 범람 예측",
  aiLabels: ["Water_Level_High", "Flood_Imminent", "Debris_Flow"],
}

export const riverInfra = {
  newBuild: ["효돈천 AIoT 5종 복합 계측망 6개소 (1차년도 상류 3개소)", "스마트폴 (2차년도 중·하류 3개소에 포함)"],
  legacy: {
    jeju: 66,
    seogwipo: 69,
    total: 135,
    note: "레거시 침수정보센서 연계 (제주시·서귀포시) — 자사 강점 접점",
  },
}

/**
 * 하천 위험단계 상태 구간 — "TP-P22_002_플랫폼 데이터 리스트.xlsx" 하천 범람예측·경보 시스템 시트 "상태 구간 설정" 그대로(2026-09-22 사용자 확정).
 * 원본 단계명 '경보'는 앱 공통 라벨 '경계'(alert)로 표기한다. 원본은 20~30% 다음이 50%로 30~50% 구간이 비어 있어, 원본의 50%·70%·100%를 각 단계 '도달' 기준으로 보고
 * 관심을 다음 단계(주의 50%) 직전까지 연장해 빈 구간 없이 이어지게 임의 설정함(2026-09-22 사용자 요청) — 공식 기준 확정 시 수정.
 */
export const riverStageCriteria: { level: "safe" | "caution" | "warning" | "alert" | "danger"; label: string; flowRatio: string; waterState: string; meaning: string; action: string }[] = [
  { level: "safe", label: "정상", flowRatio: "20% 미만", waterState: "평시 수위 유지", meaning: "통상적인 하천 흐름 유지(침수 위험 없음)", action: "상시 모니터링, 시설물 정기 점검, 시스템 상태 확인" },
  { level: "caution", label: "관심", flowRatio: "20% 이상 ~ 50% 미만", waterState: "유의 수위 도달", meaning: "강우에 의한 하천 수위 상승 시작", action: "모니터링 강화, 통제 지점·연락망 점검, 산책로 예비 통제" },
  { level: "warning", label: "주의", flowRatio: "50% 이상 ~ 70% 미만", waterState: "주의보 수위 도달", meaning: "수위 급상승으로 홍수주의보 수준 도달", action: "하천변 출입 통제, 하상도로 차단, 주민 안내 방송" },
  { level: "alert", label: "경계(경보)", flowRatio: "70% 이상 ~ 100% 미만", waterState: "경보 수위 도달", meaning: "제방 유실 위험에 근접한 경계 상태", action: "제방 점검, 저지대 대피 준비, 비상근무 체계 전환" },
  { level: "danger", label: "심각", flowRatio: "100% 이상", waterState: "계획홍수위 도달", meaning: "계획홍수위 도달로 범람 임박·발생", action: "즉시 주민 대피 명령, 재난문자(CBS) 발송, 긴급 차단" },
]

/**
 * 2026-09-29 초기화 — 하천 시나리오 더미(수위·강우·발송·통제·출동·타임라인·CCTV·센서)를 비웠다(사용자 요청: 실시간 API 제외 전부
 * 초기화, 시나리오는 새로 만들 예정). 구조(타입)는 그대로라 시나리오를 넣으면 화면이 채워진다. 위 riverTarget·riverInfra·
 * riverStageCriteria는 확정 사실·공식 기준이라 유지. 대상지는 효돈천(돈내코·쇠소깍) 한 곳뿐.
 */
export const riverStatuses: RiverStatus[] = [
  { id: "soesokkak", name: "효돈천(쇠소깍)", level: "safe", stage: "정상", eta: "해당 없음", updatedAt: "-" },
  { id: "donnaeko", name: "효돈천(돈내코)", level: "safe", stage: "정상", eta: "해당 없음", updatedAt: "-" },
]

export const riverApprovalHistory: TimelineEntry[] = []

export const riverSopStage = {
  current: "정상 단계",
  level: "safe" as RiskLevel,
  next: "현재 조치 필요 없음 · 강우·수위 임계값 도달 시 관심 단계로 전환",
}

export const riverRiskBasis = {
  rainfall: { value: "-", detail: "관측값 없음", trend: "-" },
  waterLevel: { value: "-", detail: "관측값 없음", trend: "-" },
  radar: { value: "-", detail: "감지 없음", confidence: "-" },
  saturation: { value: "-", detail: "관측값 없음", grade: "-" },
}

/**
 * 돌발 강우 AI 조기경고 — 면담(2026-09-07) 근거: 기상청 예측을 벗어나는 돌발 폭우가 가장 대응이 어렵다. AI는 실측 추이를 빠르게
 * 캐치해 담당자에게 조기 전달만 하고 최종 판단은 항상 담당자 몫(오경보 리스크) — 자동 발령으로 바꾸지 말 것.
 */
export const riverSuddenRainAlert = {
  forecastMm: 0,
  observedMm: 0,
  detectedAt: "-",
  level: "safe" as RiskLevel,
  label: "정상",
  trendNote: "감지된 신호 없음",
  aiNote: "현재 돌발 강우 패턴이 감지되지 않았습니다. 평시 모니터링을 유지합니다.",
  confirmNote: "최종 단계 상향·경보 발령 여부는 반드시 담당자 확인이 필요합니다 (오경보 리스크 고려).",
}

/**
 * 수위 추이 기반 AI 조기경보 — 자동 침수 경보 시스템·하천 모니터링시스템의 누적 수위 이력(레거시 DB, 2026-09-28 문서 근거)의 상승
 * 기울기를 감시한다. AI는 조기 알람까지, 최종 승인은 담당자. currentM이 null이면 관측값 없음.
 */
export const riverWaterLevelAiForecast = {
  basis: "자동 침수 경보 시스템·하천 모니터링시스템 누적 수위 이력(레거시 DB)",
  sixHourAgoM: null as number | null,
  currentM: null as number | null,
  trendNote: "관측값 없음",
  status: "조기경보 없음",
  aiNote: "누적 수위 이력의 상승 기울기를 감시해 관심 단계(계획홍수량 20% 이상) 접근 시 조기 알림만 전달합니다. 최종 판단은 담당자 몫입니다.",
  confirmNote: "현재 상승 추세 없음 — 담당자 조치 불필요(평시).",
}

/**
 * 하천×조수 연계 — 면담(2026-09-07) Q15: 하천수위를 해양 조수 시간과 연계해서 보여주면 좋겠음. 쇠소깍은 하구(감조구간)라 밀물에 수위가
 * 오르고, 돈내코는 상류 계곡이라 조수 영향이 없어 제외(지리적 구분이므로 임의로 두 지점 모두에 적용하지 말 것).
 */
export const riverTideCorrelation = {
  location: "효돈천(쇠소깍) — 감조구간",
  note: "쇠소깍은 하구에 위치해 밀물 시간대에 조위가 겹치면 수위가 소폭 상승합니다. 상류 돈내코 구간은 조수 영향이 없습니다.",
  boundaryLevelM: 3.0,
  nextHighTide: "-",
  series: [] as RiverTidePoint[],
}

/**
 * 실측 스냅샷 — 국립해양조사원(KHOA) 조위관측소(DT_0023, 모슬포). 2026-09-29 사용자 요청으로 스냅샷도 비웠다(실시간 API만 유지).
 * 모슬포는 쇠소깍과 다른 지점(직선거리 약 25km)이라 참고용이다.
 */
export const khoaMoseulpoTide = {
  stationName: "모슬포",
  stationCode: "DT_0023",
  location: "서귀포시 대정읍",
  distanceNote: "효돈천 쇠소깍(하효동)과는 다른 지점 — 직선거리 약 25km, 조수 흐름 참고용",
  series: [] as { time: string; tideLevelCm: number }[],
  observedAt: "",
}

export const riverImpact = {
  area: "해당 없음",
  population: "해당 없음",
  facilities: "해당 없음",
  evacuationRoutes: "-",
}

export const riverCctv: { id: string; label: string; time: string; detected: string; quality: string }[] = []

export const riverSensorCheck: { id: string; name: string; status: "정상" | "이상"; value: string; detail: string }[] = []

export const riverDataConfidence = {
  rain: "-",
  waterLevel: "-",
  radar: "-",
  video: "-",
  overall: "-",
  note: "수신 데이터 없음",
}

/** 경보 발송(/river/alert) — 발령된 경보 없음(발송 시각 "-"). level이 배지 색을 결정한다 */
export const riverAlertDispatch = {
  stage: "발령 없음",
  level: "safe" as RiskLevel,
  title: "현재 발령된 경보 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  rivers: "효돈천(돈내코·쇠소깍)",
  district: "서귀포시 하효동·상효동",
  approver: "-",
  message: "현재 발령된 경보가 없습니다.",
  channels: [
    { id: "ch1", name: "문자 (CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch3", name: "현장 단말 (무선)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch4", name: "상황판 방송", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-", unit: "개소" },
  ],
  totalFail: 0,
}

export const riverControlRows: RiverControlRow[] = []

export const riverControlFailures: { id: string; title: string; time: string; cause: string; action: string }[] = []

export const riverPropagation = [
  { id: "p1", channel: "문자(CBS)", status: "최근 발송 없음" },
  { id: "p2", channel: "제주 AX 앱 푸시", status: "최근 발송 없음" },
  { id: "p3", channel: "현장 단말", status: "최근 발송 없음" },
  { id: "p4", channel: "상황판", status: "평시 화면 표시 중" },
]

export const riverControlTimeline: TimelineEntry[] = []

export const riverJointAgencies = [
  { id: "j1", agency: "제주도청 재난안전과", status: "평시 대기" },
  { id: "j2", agency: "서귀포시 상황실", status: "평시 대기" },
  { id: "j3", agency: "소방서 (서귀포)", status: "평시 대기" },
  { id: "j4", agency: "경찰서 (서귀포시)", status: "평시 대기" },
]

/** 출동 요청(/river/dispatch) — 요청 없음(평시). level이 배지 색을 결정한다 */
export const riverDispatchRequest = {
  target: "해당 없음 (평시 감시 중)",
  stage: "정상 상태 · 출동 불필요",
  level: "safe" as RiskLevel,
  eta: "해당 없음",
  impact: "해당 없음",
  requestedAt: "-",
  requester: "-",
  analysis: [] as string[],
  process: [] as TimelineEntry[],
}

/** 종료 보고서(/river/closure) — 종료된 사건 없음(양식만 남김) */
export const riverClosure = {
  caseId: "-",
  title: "종료된 사건 없음",
  status: "-",
  confirmedBy: "-",
  type: "-",
  location: "-",
  duration: "-",
  durationDetail: "-",
  agencies: "-",
  agencyDetail: "-",
  aiSummary: [] as { id: string; label: string; value: string }[],
  observed: [] as { id: string; label: string; value: string }[],
  closureConditions: [] as string[],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
}

/** 업무 흐름 진행(감지→확인→판단→경보→대응→종료) — 평시라 시작된 단계 없음. 시나리오가 채운다 */
export const riverFlowProgress: FlowProgress = {}
