import type { RiskLevel } from "../types/domain"
import { classifyWave, classifyWind } from "./coastAlertThresholds"
import { classifySalinity, classifyTemperature, type MarineStage } from "./marineAlertThresholds"
import { classifyRiverRisk } from "./riverAlertThresholds"
import { warnRisk } from "./warningLevel"
import type { ServiceId } from "./rolesLogic"
import { severeCriteriaText } from "./severeRule"

/**
 * 위험 단계 조건 정의표 — 요구사항 '위험 단계 조건': 재난 유형별 정상·주의·경계·심각(4단계) 조건을 정의하고 적용한다. 관심 구간은 정상에 합친 '징후 감시'다(2026-10-15).
 * 하천·연안·저염분은 이미 화면이 쓰는 판정 함수(riverAlertThresholds·coastAlertThresholds·marineAlertThresholds)의 경계값을 같은 숫자로 옮긴 표이고,
 * 테스트(tests/riskCriteria.test.mjs)가 표와 실제 판정 함수가 어긋나지 않는지 확인한다. 나머지 6종은 기상청 특보 등급을 그대로 쓰는 서비스다.
 * 기준값을 바꿀 때는 판정 함수와 이 표를 함께 고친다(표만 고쳐서는 화면 판정이 바뀌지 않는다).
 */
export type CriteriaStage = "warning" | "alert" | "danger"
export const CRITERIA_STAGES: { level: CriteriaStage; label: string }[] = [
  { level: "warning", label: "주의" },
  { level: "alert", label: "경계" },
  { level: "danger", label: "심각" },
]
const ORDER: RiskLevel[] = ["safe", "warning", "alert", "danger"]

export interface MetricSpec {
  id: string
  label: string
  unit: string
  /** high: 값이 클수록 위험, low: 값이 작을수록 위험 */
  direction: "high" | "low"
  /** 단계별 경계값 — strict면 경계값 "초과/미만"에서 그 단계, 아니면 "이상/이하" */
  steps: { level: CriteriaStage; value: number; strict?: boolean }[]
  note?: string
}

export const METRICS: Partial<Record<ServiceId, MetricSpec[]>> = {
  river: [
    {
      id: "flow", label: "유량비(계획홍수량 대비)", unit: "%", direction: "high",
      steps: [{ level: "warning", value: 50 }, { level: "alert", value: 70 }, { level: "danger", value: 100 }],
      note: "50% 미만은 정상 — 20~50%는 징후 감시(단계 아님). 수위(cm) 참고: 서귀포시 효돈천 기존 경보 안전 0~80 · 경계 80~150 · 대피 150~300 · 중대피 300 이상(정상·주의·경계·심각에 대응). Q%와 cm 환산은 자료 수령 후 확정",
    },
  ],
  coast: [
    {
      id: "wave", label: "유의파고", unit: "m", direction: "high",
      steps: [{ level: "warning", value: 1.5 }, { level: "alert", value: 2.5 }, { level: "danger", value: 4.0, strict: true }],
      note: "파고·풍속 중 높은 단계(조위는 가중치) — 파고 1.0~1.5m·풍속 6~10m/s는 징후 감시(단계 아님)",
    },
    {
      id: "wind", label: "풍속", unit: "m/s", direction: "high",
      steps: [{ level: "warning", value: 10 }, { level: "alert", value: 14 }, { level: "danger", value: 20, strict: true }],
    },
  ],
  aqua: [
    {
      id: "salinity", label: "표층 염분", unit: "psu", direction: "low",
      steps: [{ level: "warning", value: 28 }, { level: "alert", value: 26 }, { level: "danger", value: 24 }],
      note: "수온과 함께 볼 때는 복합 승격 규칙 적용 — 28.0 초과 ~ 31.0psu 미만은 징후 감시(단계 아님)",
    },
  ],
}

/** 값 하나가 어느 단계인가 — 단계가 높은 쪽부터 경계값을 넘었는지 본다. 어디에도 못 미치면 정상 */
export function classifyMetric(spec: MetricSpec, value: number): RiskLevel {
  for (const s of [...spec.steps].reverse()) {
    const hit = spec.direction === "high" ? (s.strict ? value > s.value : value >= s.value) : s.strict ? value < s.value : value <= s.value
    if (hit) return s.level
  }
  return "safe"
}

/** 경계값을 사람이 읽는 문구로 */
export function stepText(spec: MetricSpec, level: CriteriaStage): string {
  const s = spec.steps.find((x) => x.level === level)
  if (!s) return "-"
  const op = spec.direction === "high" ? (s.strict ? "초과" : "이상") : s.strict ? "미만" : "이하"
  return `${spec.label} ${s.value}${spec.unit} ${op}`
}

/**
 * 기상청 특보로 단계를 정하는 4종의 단계 조건(문구) — 제주도 재난대응 매뉴얼의 위기관리 단계별 판단기준 기준.
 * 심각은 수치가 아니라 "대규모 재난이 발생했거나 발생 가능성이 확실"한 상태로, 상황판단회의가 수동으로 발령한다(비상3단계).
 * 호우·대설·해일은 도 전역 예비특보·주의보와 6개 지역 이상 경보(산간 제외, 2026-10-15 우선 가정)가 주의, 도 전역 경보가 경계다 — 산지·추자도
 * 구역 코드를 받기 전이라 화면 판정은 경보를 경계로 본다.
 */
const KMA_DEFAULT_TEXT: Record<CriteriaStage, string> = {
  warning: "예비특보 또는 주의보 발효(도 전역) · 경보는 6개 지역 이상(산간 제외)",
  alert: "경보 발효(도 전역)",
  danger: "대규모 재난 발생 또는 발생 가능성 확실 — 상황판단회의 수동 발령(비상3단계, 수치 기준 없음)",
}
const manualSevere = "상황판단회의 수동 발령(비상3단계)"
const KMA_STAGE_TEXT: Partial<Record<ServiceId, Record<CriteriaStage, string>>> = {
  "heavy-rain": { ...KMA_DEFAULT_TEXT, danger: `${severeCriteriaText("heavy-rain")} · ${manualSevere}` },
  typhoon: {
    warning: "태풍 예비특보 발표(제주먼바다 제외)",
    alert: "태풍주의보 또는 태풍경보 발효",
    danger: `${severeCriteriaText("typhoon")} · ${manualSevere}`,
  },
  tsunami: {
    warning: "해일 예비특보·주의보(도 전역) 또는 경보(6개 지역 이상) · 폭풍해일주의보 기준값(cm): 제주 329 · 성산포 296 · 모슬포 324 · 서귀포 347 · 추자도 363 · 지진: 규모 4.0 미만(최대진도 Ⅴ 미만) 지진이 특정 지역에서 짧은 기간 3회 이상",
    alert: "해일 경보(도 전역) · 폭풍해일경보 기준값(cm): 제주 359 · 성산포 320 · 모슬포 334 · 서귀포 375 · 추자도 377 · 지진: 내륙 규모 4.0~4.9(해역 4.5~5.4) 또는 최대진도 Ⅴ",
    danger: "대규모 재난 발생 또는 발생 가능성 확실 · 지진: 내륙 규모 5.0 이상(해역 5.5 이상) 또는 최대진도 Ⅵ 이상",
  },
}
export const kmaStageText = (id: ServiceId, level: CriteriaStage): string => (KMA_STAGE_TEXT[id] ?? KMA_DEFAULT_TEXT)[level]
export const KMA_SERVICES: ServiceId[] = ["heavy-rain", "typhoon", "heat", "wildfire", "tsunami", "snow"]
/** 단계가 특보 종류에 따라 달라지는 서비스의 특보 코드(wrn_met_data) — 태풍만 주의보도 경계 */
export const KMA_WRN: Partial<Record<ServiceId, string>> = { typhoon: "T" }
export const kmaStageOf = (lvl: "1" | "2" | "3", wrn?: string): RiskLevel => warnRisk(lvl, wrn)

/** 화면이 실제로 쓰는 판정 함수 — 표와 비교(적용 확인)하는 용도. 하천·연안은 값 하나, 저염분은 염분 하나 */
const MARINE_LEVEL: Record<MarineStage, RiskLevel> = { NORMAL: "safe", WATCH: "warning", ALERT: "alert", CRITICAL: "danger" }
export const ACTUAL_CLASSIFIER: Record<string, (v: number) => RiskLevel> = {
  flow: classifyRiverRisk,
  wave: classifyWave,
  wind: classifyWind,
  salinity: (v) => MARINE_LEVEL[classifySalinity(v)],
}

/** 저염분의 수온 조건(지속 일수 포함) — 표에 문구로 보이고, 시험 위젯은 수온·지속 일수를 따로 받는다 */
export const AQUA_TEMP_TEXT: Record<CriteriaStage, string> = {
  warning: "수온 28.0℃ 이상 도달(당일)",
  alert: "수온 28.0℃ 이상 1일 이상 지속(3일 미만)",
  danger: "수온 28.0℃ 이상 3일 이상 지속",
}
export const aquaTempLevel = (tempC: number, sustainedDays: number): RiskLevel => MARINE_LEVEL[classifyTemperature(tempC, sustainedDays)]
export const levelRank = (l: RiskLevel) => ORDER.indexOf(l)
