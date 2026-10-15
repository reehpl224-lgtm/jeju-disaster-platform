import { ESOP_STAGES, stepsOf, type EsopDefs, type EsopLevel } from "./esopLogic"
import { METRICS, classifyMetric, kmaStageOf, KMA_SERVICES, type MetricSpec } from "./riskCriteria"
import type { ServiceId } from "./rolesLogic"

/**
 * 상황판단 시나리오 — 요구사항 '상황판단 시나리오'·'시나리오 시험·개선'.
 * 시나리오 = 서비스 하나의 상황이 단계적으로 악화되는 과정(관측값 → 위험 단계). 실행하면 각 단계마다
 *  ① 위험 단계 판정(위험 단계 조건 정의표 기준)  ② 대시보드 경보  ③ 상황 전파 대상 구성(e-SOP 정의)  ④ 대응 지시 생성(e-SOP 정의)
 * 이 이어지는지 시뮬레이션하고, 기대한 단계와 같은지·연결이 빠짐없는지 자동으로 시험한다. 시험 기록은 실제 사건 기록과 섞이지 않게 따로 저장한다.
 * 이 파일은 저장소와 무관한 순수 계산만 둔다.
 */
export interface Phase {
  id: string
  /** 이 단계의 관측값(지표 단위) — 기상청 특보 서비스는 1 예비특보 · 2 주의보 · 3 경보 · 4 심각(관계기관 판단) */
  value: number
  /** 앞 단계로부터 지난 분 */
  minutes: number
  /** 시나리오 작성자가 기대한 위험 단계 */
  expect: EsopLevel
}
export interface Scenario {
  id: string
  name: string
  serviceId: ServiceId
  /** 발생 지점·구역 이름 */
  subject: string
  /** METRICS의 지표 id — 기상청 특보 서비스는 "kma" */
  metricId: string
  phases: Phase[]
}

export const SERVICE_TITLE: Record<ServiceId, string> = {
  "heavy-rain": "호우", typhoon: "태풍", heat: "폭염 대응", wildfire: "산불", tsunami: "지진해일", snow: "대설", river: "하천범람", aqua: "저염분 고수온", coast: "연안 안전관리",
}
export const LEVEL_LABEL: Record<EsopLevel | "normal", string> = { normal: "정상", warning: "주의", alert: "경계", danger: "심각" }

export const isKmaService = (id: ServiceId) => (KMA_SERVICES as string[]).includes(id)
export function metricOf(s: Pick<Scenario, "serviceId" | "metricId">): MetricSpec | undefined {
  return METRICS[s.serviceId]?.find((m) => m.id === s.metricId)
}
export const defaultMetricId = (id: ServiceId) => (isKmaService(id) ? "kma" : (METRICS[id]?.[0]?.id ?? "kma"))

/** 값 → 위험 단계 — 지표가 있으면 정의표 기준, 기상청 특보 서비스는 특보 등급 */
export function phaseLevel(s: Pick<Scenario, "serviceId" | "metricId">, value: number): EsopLevel | "normal" {
  if (s.metricId === "kma") {
    if (value >= 4) return "danger"
    if (value >= 1 && value <= 3) return kmaStageOf(String(Math.floor(value)) as "1" | "2" | "3") as EsopLevel
    return "normal"
  }
  const spec = metricOf(s)
  const level = spec ? classifyMetric(spec, value) : "safe"
  return level === "safe" || level === "info" || level === "offline" ? "normal" : (level as EsopLevel)
}

let n = 0
const pid = () => `p${++n}-${Math.random().toString(36).slice(2, 5)}`
const ph = (value: number, minutes: number, expect: EsopLevel): Phase => ({ id: pid(), value, minutes, expect })
export const newPhase = ph

/** 처음 제공하는 시나리오(샘플) — 값은 임의이고 기대 단계는 정의표 기준으로 맞춰 둔다 */
export function presetScenarios(): Scenario[] {
  return [
    { id: "sc-river", name: "효돈천 집중호우 — 유량 상승", serviceId: "river", subject: "효돈천(돈내코)", metricId: "flow", phases: [ph(55, 0, "warning"), ph(75, 20, "alert"), ph(105, 15, "danger")] },
    { id: "sc-coast", name: "함덕 너울성 파도 — 파고 상승", serviceId: "coast", subject: "함덕 해수욕장", metricId: "wave", phases: [ph(2.0, 0, "warning"), ph(3.0, 30, "alert"), ph(4.5, 20, "danger")] },
    { id: "sc-aqua", name: "한경 해역 저염수 유입 — 염분 하락", serviceId: "aqua", subject: "한경 해역", metricId: "salinity", phases: [ph(27, 0, "warning"), ph(25, 120, "alert"), ph(23, 120, "danger")] },
    { id: "sc-rain", name: "제주 호우 특보 단계 진행", serviceId: "heavy-rain", subject: "서귀포시 남부", metricId: "kma", phases: [ph(1, 0, "warning"), ph(2, 60, "warning"), ph(3, 90, "alert")] },
  ]
}

export interface PhaseResult {
  phaseId: string
  at: string
  value: number
  /** 정의표 기준으로 판정한 단계 */
  level: EsopLevel | "normal"
  /** ② 대시보드 경보 */
  alert: { title: string; level: EsopLevel | "normal" } | null
  /** ③ 상황 전파 대상(처리 순서대로) */
  propagation: string[]
  /** ④ 대응 지시 */
  orders: { title: string; assignee: string; dept: string }[]
}
export interface ScenarioRun {
  id: string
  scenarioId: string
  scenarioName: string
  serviceId: ServiceId
  startedAt: string
  phases: PhaseResult[]
  /** 실행 당시의 시나리오(수정해도 시험 기록은 그대로 보이게) */
  snapshot: Scenario
}

export function runScenario(s: Scenario, defs: EsopDefs, start: Date): ScenarioRun {
  let t = start.getTime()
  const phases = s.phases.map((p): PhaseResult => {
    t += p.minutes * 60_000
    const level = phaseLevel(s, p.value)
    const steps = level === "normal" ? [] : stepsOf(defs, s.serviceId, level)
    return {
      phaseId: p.id,
      at: new Date(t).toISOString(),
      value: p.value,
      level,
      alert: level === "normal" ? null : { title: `[시험] ${SERVICE_TITLE[s.serviceId]} ${LEVEL_LABEL[level]} — ${s.subject}`, level },
      propagation: steps.map((x) => x.target),
      orders: steps.map((x) => ({ title: x.action, assignee: x.target, dept: x.dept })),
    }
  })
  return { id: `R${start.getTime().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, scenarioId: s.id, scenarioName: s.name, serviceId: s.serviceId, startedAt: start.toISOString(), phases, snapshot: structuredClone(s) }
}

export interface TestCheck {
  phaseId: string
  kind: "단계 판정" | "대시보드 경보" | "상황 전파" | "대응 지시" | "승인자 지정"
  ok: boolean
  text: string
}

/** 실행 결과 시험 — 단계마다: 판정이 기대와 같은가, 경보가 떴나, 전파 대상이 비지 않았나, 지시가 전파 단계 수와 같은가(+심각이면 승인자가 있나) */
export function evaluateRun(run: ScenarioRun): TestCheck[] {
  const out: TestCheck[] = []
  run.phases.forEach((r, i) => {
    const want = run.snapshot.phases[i]?.expect
    const phaseId = r.phaseId
    out.push({ phaseId, kind: "단계 판정", ok: r.level === want, text: `기대 ${want ? LEVEL_LABEL[want] : "-"} / 판정 ${LEVEL_LABEL[r.level]}` })
    out.push({ phaseId, kind: "대시보드 경보", ok: r.level === "normal" ? r.alert === null : !!r.alert, text: r.alert ? r.alert.title : "정상 단계 — 경보 없음" })
    const targetsOk = r.level === "normal" || (r.propagation.length > 0 && r.propagation.every((x) => x.trim() !== ""))
    out.push({ phaseId, kind: "상황 전파", ok: targetsOk, text: r.propagation.length ? `${r.propagation.length}곳 — ${r.propagation.join(" → ")}` : r.level === "normal" ? "정상 단계 — 전파 없음" : "전파 대상이 정의되지 않음" })
    const ordersOk = r.level === "normal" || (r.orders.length === r.propagation.length && r.orders.length > 0 && r.orders.every((o) => o.title.trim() !== ""))
    out.push({ phaseId, kind: "대응 지시", ok: ordersOk, text: r.orders.length ? `${r.orders.length}건 생성` : r.level === "normal" ? "정상 단계 — 지시 없음" : "지시가 만들어지지 않음" })
    if (r.level === "danger") {
      const approver = r.propagation.some((x) => /의사결정|관리자|승인/.test(x))
      out.push({ phaseId, kind: "승인자 지정", ok: approver, text: approver ? "승인 권한자(관리자·의사결정자)에게 전파됨" : "심각 단계에 승인 권한자가 전파 대상에 없음" })
    }
  })
  return out
}

export const passRate = (checks: TestCheck[]) => (checks.length ? Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) : 0)

/** 단계 라벨 — 기대 단계 선택용 */
export const EXPECT_OPTIONS = ESOP_STAGES

/** 시나리오 한 건 새로 만들 때의 시작값 */
export function blankScenario(serviceId: ServiceId): Scenario {
  const metricId = defaultMetricId(serviceId)
  return { id: `sc-${Date.now().toString(36)}`, name: `${SERVICE_TITLE[serviceId]} 새 시나리오`, serviceId, subject: "", metricId, phases: [ph(isKmaService(serviceId) ? 1 : 0, 0, "warning")] }
}
