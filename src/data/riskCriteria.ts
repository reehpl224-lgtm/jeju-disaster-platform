import type { RiskLevel } from "../types/domain"
import { classifyWave, classifyWind } from "./coastAlertThresholds"
import { classifySalinity, classifyTemperature, type MarineStage } from "./marineAlertThresholds"
import { classifyRiverRisk } from "./riverAlertThresholds"
import { warnLvlRisk } from "./warningLevel"
import type { ServiceId } from "./rolesLogic"

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

/** 기상청 특보 등급을 그대로 쓰는 서비스의 단계 조건(문구) */
export const KMA_STAGE_TEXT: Record<CriteriaStage, string> = {
  warning: "기상청 예비특보 또는 주의보 발효",
  alert: "기상청 경보 발효",
  danger: "경보 발효 중 인명·시설 피해 발생 등 관계기관 판단(수동 판정 — 자동 기준 없음)",
}
export const KMA_SERVICES: ServiceId[] = ["heavy-rain", "typhoon", "heat", "wildfire", "tsunami", "snow"]
export const kmaStageOf = (lvl: "1" | "2" | "3"): RiskLevel => warnLvlRisk(lvl)

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
