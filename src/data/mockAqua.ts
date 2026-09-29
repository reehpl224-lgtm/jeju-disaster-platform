import type {
  AquaActionLogEntry,
  AquaAgencyRow,
  AquaChecklistItem,
  AquaDataIssue,
  AquaDataSource,
  AquaFarm,
  AquaModelConfidence,
  AquaQualityMetric,
  AquaStage,
  AquaTimelineEntry,
} from "../types/aqua"
import type { RiskLevel } from "../types/domain"
import type { FlowProgress } from "../types/flow"

/**
 * 2026-09-22 리셋 — 사용자 요청으로 더미 "진행 중 사건" 데이터를 초기화하고, 파트별 케이스
 * 프로토타입의 첫 사례로 "저염분수 관심(1단계) 단계 — 확인→대응→조치→처리" 흐름을 새로 구성함.
 * 실제 API 연동 데이터(khoaLiveObservations)는 그대로 두고 건드리지 않음.
 * 케이스: 한경 용수 인근 관측지점에서 염분이 관심 구간(28.0~30.0psu)까지 하락 — 아직 경보 발령
 * 전 단계로, TP-P22_002 데이터 리스트의 관심 단계 행동요령("비상 대응 장비 점검 및 어장 예찰
 * 활동 강화")에 맞춰 "내부 점검·예찰" 중심으로 구성했고, 아직 대외 경보는 발송하지 않았다.
 */
export const aquaSummary = {
  lastUpdated: "-",
  targetArea: "제주 서남부 한경·대정 육상양식장",
  spatialResolution: "1km 이하",
  aiLabels: ["Low_Salinity_Plume", "High_Temp_Water"],
  /** 염분 단독 기준 5단계 — marineAlertThresholds.ts classifySalinity()와 반드시 일치시킬 것 */
  salinityLevels: [
    { level: "safe", label: "정상", range: "30.0 psu 이상" },
    { level: "caution", label: "관심", range: "28.0 이상 ~ 30.0 psu 미만" },
    { level: "warning", label: "주의", range: "26.0 이상 ~ 28.0 psu 미만" },
    { level: "alert", label: "경계(경보)", range: "24.0 이상 ~ 26.0 psu 미만" },
    { level: "danger", label: "심각", range: "24.0 psu 미만" },
  ] as { level: RiskLevel; label: string; range: string }[],
  /** 복합(수온+염분) 승격 규칙 — 단순 "한 단계 승격"이 아니라 조건별로 도달 단계가 다르므로 정확히 표기.
   *  marineAlertThresholds.ts의 combinedOverride()와 반드시 일치시킬 것 */
  combinedRuleNote:
    "수온 28.0℃ 이상 동반 시: 염분 26.0 이하→심각 / 염분 28.0 이하→경계 이상. 수온 26.0~28.0℃면 염분 28.0 이하→주의 이상으로 승격",
  /** 수온 단독 기준 5단계 — marineAlertThresholds.ts classifyTemperature()와 반드시 일치시킬 것.
   *  28.0℃ 이상 구간은 값 자체가 아니라 지속일수로 주의/경계/심각이 갈리므로 range에 지속일수를 함께 표기 */
  temperatureLevels: [
    { level: "safe", label: "정상", range: "25.0℃ 이하" },
    { level: "caution", label: "관심", range: "25.1 ~ 27.9℃" },
    { level: "warning", label: "주의", range: "28.0℃ 이상 (당일 도달)" },
    { level: "alert", label: "경계", range: "28.0℃ 이상 1~2일 지속" },
    { level: "danger", label: "심각", range: "28.0℃ 이상 3일 이상 지속" },
  ] as { level: RiskLevel; label: string; range: string }[],
  // 2026-09-29 초기화 — 진행 중 사건 없음. 시나리오가 채울 때 aquaFarmTotals·aquaFarms와 반드시 같은 수치를 쓸 것
  activeRisk: { count: 0, detail: "진행 중 위험 없음" },
  pendingApproval: { count: 0, detail: "승인 대기 없음" },
  affectedFarms: { count: 0, detail: "영향 양식장 없음" },
  dataQuality: { percent: 0, detail: "수집 데이터 없음" },
}

/** 대응 여정 링크(홈의 카드) — 값 없이 화면 이름과 설명만 둔다(2026-09-29 초기화) */
export const aquaJourneys = [
  { id: "data", label: "데이터 수집", desc: "수집 소스 현황", href: "/aqua/data" },
  { id: "prediction", label: "AI 예측", desc: "위험 등급·신뢰도", href: "/aqua/prediction" },
  { id: "farms", label: "영향 양식장", desc: "위험권 양식장 현황", href: "/aqua/farms" },
  { id: "alerts", label: "경보 발송", desc: "경보 초안·승인·발송", href: "/aqua/alerts" },
  { id: "response", label: "e-SOP 대응", desc: "단계별 조치 체크리스트", href: "/aqua/response" },
  { id: "monitoring", label: "실시간 모니터링", desc: "해양환경 관측", href: "/aqua/monitoring" },
]

/**
 * 실측 스냅샷 — 국립해양조사원(KHOA) 해양관측부이·조위관측소(data.go.kr). 2026-09-29 사용자 요청으로 스냅샷도 비웠다(실시간 API만
 * 유지). 값을 다시 넣으려면 API를 조회해 관측 시각(observedAt)과 함께 그대로 옮길 것 — 임의로 지어내지 않는다.
 */
export const khoaLiveObservations: {
  id: string
  stationName: string
  stationCode: string
  kind: "해양관측부이" | "조위관측소"
  lat: number
  lng: number
  seaTempC: number
  salinityPsu: number
  /** 유향(deg)·유속(cm/s) — 저염분수/고수온수 확산 방향 참고. 관측소별로 결측(null)일 수 있음 */
  currentDirDeg?: number
  currentSpeedCms?: number
  observedAt: string
}[] = []

/** 수집 소스별 상태(응답 지연·품질점수 등은 시뮬레이션 값이라 비움) — 소스 이름·분류는 mockDataSourceCategories의 실제 조사 결과를 본다 */
export const aquaDataSources: AquaDataSource[] = []

export const aquaDataIssues: AquaDataIssue[] = []

export const aquaActionLog: AquaActionLogEntry[] = []

/**
 * AI 예측 결과 대시보드(/aqua/prediction) 상단 카드 — riskLevel이 RiskBadge 색상을 결정한다(하드코딩 금지).
 * 2026-09-29 초기화: 예측 없음.
 */
export const aquaRiskState = {
  level: "정상",
  riskLevel: "safe" as RiskLevel,
  headline: "감지된 저염분수·고수온 신호 없음",
  confidence: 0,
  updatedAt: "-",
  lowSalinity: { eta: "해당 없음", riskLevel: "safe" as RiskLevel, time: "-", location: "-" },
  highTemp: { eta: "해당 없음", riskLevel: "safe" as RiskLevel, time: "-", location: "-" },
  affectedFarmCount: 0,
  affectedFarmDelta: "-",
}

export const aquaModelConfidence: AquaModelConfidence[] = []

/**
 * KHOA 실측 기반 AI 보강 가능성 검토(2026-09-28) — 사용자 요청으로 khoaLiveObservations(수온·염분·
 * 유속)을 ROMS/NEMO 예측 모델 보정에 더 쓸 수 있는지 점검. 유속·유향(currentDirDeg/currentSpeedCms)이
 * 있는 지점은 제주남부(KG_0021)·제주해협(KG_0028) 2곳뿐인데, 이번 관심 단계 발생 지점(한경 용수)과는
 * 각각 약 155km·59km 떨어져 있어 확산 방향 추정에 직접 쓰기엔 무리가 있다. 반대로 한경 용수에 가장
 * 가까운 관측점(모슬포 약 13km·중문 약 24km)은 유속 데이터 자체가 없다 — 지점 배치의 구조적 한계.
 * 수온·염분 실측(4개소 모두 보유)은 위치와 무관하게 모델 보정 입력으로 바로 쓸 수 있어 구분함.
 * 상세 근거·실증사 요청안: docs/khoa-ai-prediction-requests.md
 */
export const aquaKhoaEnhancementReview = {
  feasible: "부분 가능",
  summary: "수온·염분 실측(4개소)은 이미 모델 보정 입력으로 활용 가능 — 유속 기반 확산 방향 정교화는 관측점 위치 한계로 이번 사례엔 직접 적용 어려움",
  usable: ["KHOA 실측 수온·염분(4개소, 1시간 주기) → ROMS·NEMO 예측치 실시간 편향보정(자료동화) 입력으로 즉시 활용 가능"],
  limited: [
    "유속·유향 관측(제주남부·제주해협)은 한경 용수와 각각 약 155km·59km 떨어져 확산 방향 추정에 직접 반영하기 어려움",
    "한경 용수에서 가장 가까운 관측점(모슬포 약 13km·중문 약 24km)은 유속 데이터가 없음",
  ],
  vendorAsk: "지오시스템리서치에 (1) KHOA 실측 자료동화(nudging) 기반 ROMS·NEMO 편향보정 적용 여부, (2) 한경·대정 인근 유속 관측 지점 추가 여부를 문의할 필요가 있음",
}

export const aquaQualityMetrics: AquaQualityMetric[] = []

/** 영향 양식장 — 2026-09-29 초기화로 비움. 시나리오가 채울 때 aquaFarmTotals와 반드시 같은 수치를 쓰고, 등급은 classifyMarineRiskLevel()로 계산할 것 */
export const aquaFarms: AquaFarm[] = []

export const aquaFarmTotals = { total: 0, danger: 0, alert: 0, warning: 0, caution: 0 }

/** 경보 초안(/aqua/alerts) — 초안 없음. 승인 단계 owner "-"는 아직 착수 전을 뜻한다 */
export const aquaAlertDraft = {
  region: "-",
  riskType: "-",
  grade: "-",
  riskLevel: "safe" as RiskLevel,
  scope: "-",
  effectiveAt: "-",
  validFor: "-",
  currentGrade: "정상",
  affectedFarms: 0,
  affectedPopulation: "해당 없음",
  eta: "해당 없음",
  affectedArea: "-",
  channels: ["문자(CBS·SMS)", "재난안전앱", "현장 단말", "상황판"],
  smsTarget: 0,
  appTarget: 0,
  fieldDevices: 0,
  boards: "-",
  confidence: 0,
  satelliteMatch: "-",
  fieldDelta: "-",
  approvalSteps: [
    { id: "d1", stage: "작성", owner: "-", time: "-" },
    { id: "d2", stage: "1차 검토", owner: "-", time: "-" },
    { id: "d3", stage: "승인 요청", owner: "-", time: "-" },
    { id: "d4", stage: "최종 승인", owner: "-", time: "-" },
  ],
  audit: [] as AquaTimelineEntry[],
}

/** e-SOP 대응(/aqua/response) 현재 상황 — 진행 중인 사건 없음. riskLevel이 배지 색을 결정한다 */
export const aquaResponseState = {
  title: "진행 중인 사건 없음",
  level: "정상",
  riskLevel: "safe" as RiskLevel,
  grade: "-",
  location: "-",
  detectedAt: "-",
  eta: "해당 없음",
  salinity: "-",
  temperature: "-",
  radius: "-",
}

// aquaResponseState.grade와 항상 같은 현재 단계를 가리켜야 함 — 사건이 없으면 전부 대기
export const aquaStages: AquaStage[] = [
  { step: 1, label: "관심", status: "대기" },
  { step: 2, label: "주의", status: "대기" },
  { step: 3, label: "경계", status: "대기" },
  { step: 4, label: "심각", status: "대기" },
  { step: 5, label: "해제", status: "대기" },
]

export const aquaChecklist: AquaChecklistItem[] = []

/** 유관기관 — 조직 구성만 남기고 대응 상태는 "-"(시나리오가 채운다) */
export const aquaAgencyRows: AquaAgencyRow[] = [
  { id: "ag1", agency: "제주특별자치도 재난안전과", role: "총괄 모니터링", approve: "-", execute: "-", receive: "-" },
  { id: "ag2", agency: "제주시 한경면사무소", role: "한경 용수 현장 예찰", approve: "-", execute: "-", receive: "-" },
  { id: "ag3", agency: "서귀포시 대정읍사무소", role: "대정 현장 상시 관찰", approve: "-", execute: "-", receive: "-" },
  { id: "ag4", agency: "제주특별자치도 해양수산연구원", role: "예측 검증", approve: "-", execute: "-", receive: "-" },
]

export const aquaMonitoringState = {
  ocean: { label: "양식장 해양환경", value: "관측값 없음", level: "safe" as const, tag: "정상" },
}

export const aquaMonitoringEvents: AquaTimelineEntry[] = []

/** 종료 보고서(/aqua/closure) — 종료된 사건 없음(양식만 남김) */
export const aquaClosureSummary = {
  type: "-",
  location: "-",
  startedAt: "-",
  endedAt: "-",
  finalGrade: "-",
  finalLevel: "safe" as RiskLevel,
  duration: "-",
}

export const aquaClosureTimeline: AquaTimelineEntry[] = []

export const aquaClosurePrediction = {
  predictedSalinity: "-",
  actualSalinity: "-",
  error: "-",
  reasoning: [] as string[],
}

export const aquaRetraining = {
  target: "-",
  status: "-",
  updatedAt: "-",
}

/** 업무 흐름 진행(감지→확인→판단→경보→대응→종료) — 진행 중인 사건이 없어 시작된 단계 없음. 시나리오가 채운다 */
export const aquaFlowProgress: FlowProgress = {}
