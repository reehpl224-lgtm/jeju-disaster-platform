/**
 * 사이드패널 입력 — 타입과 순수 계산(저장소·샘플에 의존하지 않아 tests/에서 바로 검증한다). 저장소는 panelInput.ts.
 */
export type InputLevel = "safe" | "caution" | "warning" | "alert" | "danger"
export const INPUT_LEVELS: { value: InputLevel; label: string }[] = [
  { value: "safe", label: "평시(정상)" },
  { value: "caution", label: "관심" },
  { value: "warning", label: "주의" },
  { value: "alert", label: "경계" },
  { value: "danger", label: "심각" },
]
export const LEVEL_RANK: Record<InputLevel, number> = { safe: 0, caution: 1, warning: 2, alert: 3, danger: 4 }

/** 서비스 목록 — 서비스가 늘면 여기에 한 줄만 더하면 입력 화면·패널 타일이 같이 늘어난다 */
export const SERVICES: { id: string; title: string; short: string }[] = [
  { id: "river", title: "하천범람", short: "하천" },
  { id: "aqua", title: "저염분 고수온", short: "저염분" },
  { id: "coast", title: "연안 안전관리", short: "연안" },
  { id: "heavy-rain", title: "호우", short: "호우" },
  { id: "heat", title: "폭염 대응", short: "폭염" },
  { id: "typhoon", title: "태풍", short: "태풍" },
  { id: "wildfire", title: "산불", short: "산불" },
  { id: "snow", title: "대설", short: "대설" },
  { id: "tsunami", title: "지진해일", short: "지진해일" },
]
export const serviceTitle = (id: string) => SERVICES.find((s) => s.id === id)?.title ?? id
export const serviceShort = (id: string) => SERVICES.find((s) => s.id === id)?.short ?? id

export interface SensorSummaryInput { normal: number; delayed: number; error: number; unlinked: number }
export interface ServiceSensorInput { id: string; count: number | null; level: InputLevel | null }
export interface SensorAlertInput { id: string; name: string; service: string; reason: "값 이상" | "수집 이상"; value: string; level: InputLevel; badge: string }
export interface TrendInput {
  id: string
  service: string
  name: string
  unit: string
  /** 관측값(오래된 것 → 최신) — 마지막 값이 현재값 */
  observed: number[]
  /** 예측값(선택) */
  forecast: number[]
  threshold: number | null
  thresholdLabel: string
  /** 기준값을 넘으면(above) / 밑으로 내려가면(below) 위험 */
  worse: "above" | "below"
  level: InputLevel
}
export interface StageInput { id: string; level: InputLevel | null; count: number | null; done: number; doing: number; waiting: number }
export interface ActionInput { id: string; service: string; text: string; state: "진행" | "대기" }
export interface ResponseExtraInput { agenciesConnected: number; agenciesTotal: number; agencyIssue: string; teams: number; teamState: string }

export interface PanelInput {
  /** R2 · 센서 수집 상태(정상·지연·오류·미연계) */
  sensorSummary?: SensorSummaryInput
  /** R2 · 서비스별 센서 수와 최고 위험등급 */
  serviceSensors?: ServiceSensorInput[]
  /** R2 · 확인 필요 센서 */
  sensorAlerts?: SensorAlertInput[]
  /** R3 · 센서 추이 지표(순위·대표 추이가 여기서 계산됨) */
  trends?: TrendInput[]
  /** R4 · 서비스별 대응 단계와 조치 건수 */
  stages?: StageInput[]
  /** R4 · 지금 해야 할 조치 */
  actions?: ActionInput[]
  /** R4 · 기관 연결·현장 대응팀 */
  responseExtra?: ResponseExtraInput
}
export type PartKey = keyof PanelInput

/** 탭 전체가 샘플인지(영역이 하나도 입력되지 않았는지) — 머리 제목 옆 "샘플" 표식 판단용 */
export const fullySample = {
  sensor: (i: PanelInput) => i.sensorSummary === undefined && i.serviceSensors === undefined && i.sensorAlerts === undefined,
  trend: (i: PanelInput) => i.trends === undefined,
  response: (i: PanelInput) => i.stages === undefined && i.actions === undefined && i.responseExtra === undefined,
}

// ---- 추이 지표에서 화면 값 계산
export function trendDirection(t: TrendInput): "up" | "flat" | "down" {
  const o = t.observed
  if (o.length < 2) return "flat"
  const d = o[o.length - 1] - o[o.length - 2]
  const eps = Math.max(1e-9, Math.abs(o[o.length - 1]) * 0.005)
  return d > eps ? "up" : d < -eps ? "down" : "flat"
}
/** 기준값까지 얼마나 왔는지(0~1) — 5단계 눈금 위 위치로 쓴다 */
export function trendPosition(t: TrendInput): number {
  const v = t.observed[t.observed.length - 1]
  if (v === undefined || !t.threshold) return LEVEL_RANK[t.level] / 5 + 0.1
  const ratio = t.worse === "above" ? v / t.threshold : t.threshold / v
  return Math.min(0.98, Math.max(0.02, ratio * 0.85))
}
