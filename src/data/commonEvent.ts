import type { PilotBatch, SampleLevel } from "./pilotBatch/generate"
import type { SpEvent } from "./sidePanelSamples"
import type { ServiceId } from "./rolesLogic"

/**
 * 공통 이벤트 구조 — 요구사항 '공통 이벤트 구조'·'이벤트 수신·실시간 반영'.
 * 서비스마다 다른 모양인 AI 예측값·관측값·위험도·경보 결과를 하나의 구조(CommonEvent)로 묶고,
 * 원천(기상청 특보·태풍·재난문자·실증사 배치)을 이 구조로 바꾸는 변환(from*)과 AX Hub 표준(NGSI-LD) 모양으로 내보내는 변환(toNgsiLd)을 정의한다.
 * 실증사가 확정한 API·파일 규격(2026년 10월 중순 수령 예정)이 오면 from* 변환만 추가·수정하고 구조는 그대로 둔다.
 * 이 파일은 순수 변환만 둔다(화면·저장 없음).
 */
export type EventLevel = "normal" | "caution" | "warning" | "alert" | "danger"
export const EVENT_LEVEL_LABEL: Record<EventLevel, string> = { normal: "평시", caution: "관심", warning: "주의", alert: "경계", danger: "심각" }

export interface Measure {
  name: string
  value: number | string
  unit?: string
  /** 측정·예측 시점(ISO 또는 "10분 후" 같은 상대 표현) */
  at?: string
  /** 비교한 기준 — 있으면 근거로 보여준다 */
  threshold?: string
}

export interface CommonEvent {
  schema: "jeju-ax.common-event/1"
  /** 공통 이벤트 ID */
  id: string
  serviceId: ServiceId | "common"
  title: string
  /** 발생 시각(ISO, 기준 시각) */
  occurredAt: string
  /** 발생 위치 */
  subject: { name: string; kind: "지점" | "구역" | "지역" | "취수구" | "태풍"; lat?: number; lng?: number }
  /** 위험도(위험 단계) */
  risk: { level: EventLevel; basis?: string }
  /** 관측값 — 근거가 되는 값 */
  observation: Measure[]
  /** AI 예측값 */
  prediction?: { horizon: string; values: Measure[]; model?: string }
  /** 경보 결과 */
  alert?: { status: "발령" | "해제"; title: string; issuedAt?: string; channel?: string }
  /** 출처 */
  source: { system: string; origin: "기상청" | "행정안전부" | "실증사" | "샘플"; sample: boolean }
}

const LEVEL_OF_RISK: Record<string, EventLevel> = { caution: "caution", warning: "warning", alert: "alert", danger: "danger" }
const levelOf = (l: string): EventLevel => LEVEL_OF_RISK[l] ?? "normal"
const SAMPLE_LEVEL: Record<SampleLevel, EventLevel> = { safe: "normal", caution: "caution", warning: "warning", alert: "alert", danger: "danger" }

/** 특보·재난문자 제목·내용에서 서비스를 추정한다 — 어디에도 안 맞으면 common */
export function serviceOfText(text: string): ServiceId | "common" {
  const rules: [RegExp, ServiceId][] = [
    [/호우/, "heavy-rain"], [/태풍|강풍/, "typhoon"], [/풍랑|너울|월파/, "coast"], [/건조|산불/, "wildfire"],
    [/폭염/, "heat"], [/대설|한파/, "snow"], [/해일|지진/, "tsunami"], [/홍수|하천/, "river"], [/저염|고수온/, "aqua"],
  ]
  return rules.find(([re]) => re.test(text))?.[1] ?? "common"
}

/** 사이드패널 사건(기상청 특보·태풍 현황·재난문자) → 공통 이벤트. 특보·문자는 경보 결과, 태풍은 관측값(수치)이 있다 */
export function fromSpEvent(e: SpEvent): CommonEvent {
  const typhoon = e.source === "typhoon"
  const origin: CommonEvent["source"]["origin"] = e.sample ? "샘플" : e.source === "messages" ? "행정안전부" : "기상청"
  const system = e.source === "messages" ? "긴급재난문자" : typhoon ? "기상청 태풍정보" : e.source === "warnings" ? "기상청 특보" : "기타 기관 발표"
  return {
    schema: "jeju-ax.common-event/1",
    id: `EVT-${e.id}`,
    serviceId: typhoon ? "typhoon" : serviceOfText(`${e.title} ${e.detail}`),
    title: e.title,
    occurredAt: e.at.toISOString(),
    subject: { name: e.detail.split(" · ")[0] || e.title, kind: typhoon ? "태풍" : "지역" },
    risk: { level: levelOf(e.level), basis: typhoon ? "기상청 태풍 현황" : "발표 등급" },
    observation: (e.meta ?? []).map((m) => ({ name: m.label, value: m.value })),
    alert: typhoon ? undefined : { status: e.status, title: e.title, issuedAt: e.at.toISOString(), channel: e.source === "messages" ? "긴급재난문자" : "기상청 특보" },
    source: { system, origin, sample: e.sample },
  }
}

/** 실증사 배치(하천·연안·저염분) → 공통 이벤트. 하천은 관측점별, 연안은 관측 구역별, 저염분은 취수구별로 만든다 */
export function fromPilotBatch(b: PilotBatch): CommonEvent[] {
  const origin = b.source === "sample" ? "샘플" : "실증사"
  const sample = b.source === "sample"
  const at = `${b.generatedAt}:00+09:00`
  const src = (system: string) => ({ system, origin, sample }) as CommonEvent["source"]
  const out: CommonEvent[] = []

  for (const p of b.river.points) {
    const now = p.history[p.history.length - 1]
    out.push({
      schema: "jeju-ax.common-event/1",
      id: `EVT-RIV-${p.id}`,
      serviceId: "river",
      title: `${p.name} 유량 ${p.flowRatioPercent}%`,
      occurredAt: at,
      subject: { name: p.name, kind: "지점", lat: p.lat, lng: p.lng },
      risk: { level: SAMPLE_LEVEL[p.level], basis: `계획홍수량 대비 유량비 ${p.flowRatioPercent}%` },
      observation: [
        { name: "수위", value: p.levelM, unit: "m", at: now ? `${now.t}` : undefined },
        { name: "유량비", value: p.flowRatioPercent, unit: "%", threshold: "50% 주의 · 70% 경계 · 100% 심각" },
      ],
      prediction: { horizon: "60분", model: "하천범람 예측 AI(실증사)", values: p.forecast.map((f) => ({ name: "예측 수위", value: f.levelM, unit: "m", at: `${f.minutes}분 후` })) },
      source: src("하천범람 실증사 배치"),
    })
  }

  const stage: Record<PilotBatch["coast"]["currentStage"], EventLevel> = { 평시: "normal", 관심: "caution", 주의: "warning", 경계: "alert", 심각: "danger" }
  for (const s of b.coast.sites) {
    const crowd = b.coast.crowd.find((c) => c.siteId === s.id)
    const last = crowd?.series[crowd.series.length - 1]
    const vlm = b.coast.vlmSummaries.find((v) => v.siteId === s.id)
    out.push({
      schema: "jeju-ax.common-event/1",
      id: `EVT-CST-${s.id}`,
      serviceId: "coast",
      title: `${s.name} 연안 상황`,
      occurredAt: at,
      subject: { name: s.name, kind: "구역", lat: s.lat, lng: s.lng },
      risk: { level: vlm ? SAMPLE_LEVEL[vlm.level] : stage[b.coast.currentStage], basis: vlm?.text ?? `연안 단계 ${b.coast.currentStage}` },
      observation: last && crowd ? [{ name: "이용객 수", value: last.count, unit: "명", at: last.t, threshold: `수용 ${crowd.limit}명` }] : [],
      source: src("연안안전 실증사 배치(VLM)"),
    })
  }

  const salinity = b.aqua.series.filter((s) => !s.predicted)
  const nowSal = salinity[salinity.length - 1]
  for (const i of b.aqua.intakes) {
    out.push({
      schema: "jeju-ax.common-event/1",
      id: `EVT-AQU-${i.id}`,
      serviceId: "aqua",
      title: `${i.name} 저염수 도달 ${i.etaHours == null ? "없음(120시간 이내)" : `${i.etaHours}시간 후`}`,
      occurredAt: at,
      subject: { name: i.name, kind: "취수구" },
      risk: { level: SAMPLE_LEVEL[i.level], basis: "저염수(30psu 미만) 도달 예상 시간" },
      observation: nowSal ? [{ name: "표층 염분", value: nowSal.salinity, unit: "psu", at: nowSal.t }, { name: "수온", value: nowSal.tempC, unit: "℃", at: nowSal.t }] : [],
      prediction: { horizon: "120시간", model: "저염분 확산 예측 AI(실증사)", values: [{ name: "저염수 도달", value: i.etaHours ?? "없음", unit: i.etaHours == null ? undefined : "시간 후" }] },
      source: src("저염분 고수온 실증사 배치"),
    })
  }
  return out
}

/** AX Hub 표준(NGSI-LD) 모양 — 요구사항 '표준 데이터 모델 정합'의 매핑 초안. @context 주소는 확정 전 자리표시자다 */
export function toNgsiLd(e: CommonEvent) {
  const prop = <T>(value: T, extra: Record<string, unknown> = {}) => ({ type: "Property", value, ...extra })
  return {
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld", "https://jeju-ax.example/ngsi-ld/common-event-context.jsonld"],
    id: `urn:ngsi-ld:CommonEvent:${e.id}`,
    type: "CommonEvent",
    serviceId: prop(e.serviceId),
    title: prop(e.title),
    dateObserved: { type: "Property", value: { "@type": "DateTime", "@value": e.occurredAt } },
    ...(e.subject.lat != null && e.subject.lng != null ? { location: { type: "GeoProperty", value: { type: "Point", coordinates: [e.subject.lng, e.subject.lat] } } } : {}),
    subjectName: prop(e.subject.name, { subjectKind: prop(e.subject.kind) }),
    riskLevel: prop(e.risk.level, e.risk.basis ? { basis: prop(e.risk.basis) } : {}),
    observation: prop(e.observation),
    ...(e.prediction ? { prediction: prop(e.prediction.values, { horizon: prop(e.prediction.horizon), ...(e.prediction.model ? { model: prop(e.prediction.model) } : {}) }) } : {}),
    ...(e.alert ? { alert: prop(e.alert.title, { status: prop(e.alert.status), ...(e.alert.channel ? { channel: prop(e.alert.channel) } : {}) }) } : {}),
    source: prop(e.source.system, { origin: prop(e.source.origin), sample: prop(e.source.sample) }),
  }
}

const LEVELS = ["normal", "caution", "warning", "alert", "danger"]
const SUBJECT_KINDS = ["지점", "구역", "지역", "취수구", "태풍"]
const ORIGINS = ["기상청", "행정안전부", "실증사", "샘플"]
const SERVICES = ["heavy-rain", "typhoon", "heat", "wildfire", "tsunami", "snow", "river", "aqua", "coast", "common"]
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== ""
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

function checkMeasures(v: unknown, path: string, out: string[]) {
  if (!Array.isArray(v)) return out.push(`${path}: 배열이어야 합니다`)
  v.forEach((m, i) => {
    if (!isObj(m)) return out.push(`${path}[${i}]: 객체여야 합니다`)
    if (!isStr(m.name)) out.push(`${path}[${i}].name: 문자열이 필요합니다`)
    if (typeof m.value !== "number" && typeof m.value !== "string") out.push(`${path}[${i}].value: 숫자 또는 문자열이어야 합니다`)
  })
}

/**
 * 공통 이벤트 한 건이 구조에 맞는지 검사해 어긋난 곳을 알려 준다(비어 있으면 통과) — public/mock-api/v1/schema/common-event.schema.json 과 같은 규칙.
 * 실증사가 보내 줄 샘플 payload를 받았을 때 구조 정합을 확인하는 데 쓴다.
 */
export function validateCommonEvent(e: unknown): string[] {
  const out: string[] = []
  if (!isObj(e)) return ["이벤트는 객체여야 합니다"]
  if (e.schema !== "jeju-ax.common-event/1") out.push('schema: "jeju-ax.common-event/1" 이어야 합니다')
  if (!isStr(e.id)) out.push("id: 문자열이 필요합니다")
  if (!SERVICES.includes(e.serviceId as string)) out.push(`serviceId: ${SERVICES.join("·")} 중 하나여야 합니다`)
  if (!isStr(e.title)) out.push("title: 문자열이 필요합니다")
  if (!isStr(e.occurredAt) || Number.isNaN(Date.parse(e.occurredAt))) out.push("occurredAt: 날짜·시각 문자열(ISO 8601)이어야 합니다")
  const subject = e.subject
  if (!isObj(subject)) out.push("subject: 객체여야 합니다")
  else {
    if (!isStr(subject.name)) out.push("subject.name: 문자열이 필요합니다")
    if (!SUBJECT_KINDS.includes(subject.kind as string)) out.push(`subject.kind: ${SUBJECT_KINDS.join("·")} 중 하나여야 합니다`)
    for (const k of ["lat", "lng"] as const) if (subject[k] !== undefined && typeof subject[k] !== "number") out.push(`subject.${k}: 숫자여야 합니다`)
  }
  const risk = e.risk
  if (!isObj(risk)) out.push("risk: 객체여야 합니다")
  else if (!LEVELS.includes(risk.level as string)) out.push(`risk.level: ${LEVELS.join("·")} 중 하나여야 합니다`)
  checkMeasures(e.observation, "observation", out)
  if (e.prediction !== undefined) {
    const p = e.prediction
    if (!isObj(p)) out.push("prediction: 객체여야 합니다")
    else {
      if (!isStr(p.horizon)) out.push("prediction.horizon: 문자열이 필요합니다")
      checkMeasures(p.values, "prediction.values", out)
    }
  }
  if (e.alert !== undefined) {
    const a = e.alert
    if (!isObj(a)) out.push("alert: 객체여야 합니다")
    else {
      if (a.status !== "발령" && a.status !== "해제") out.push("alert.status: 발령 또는 해제여야 합니다")
      if (!isStr(a.title)) out.push("alert.title: 문자열이 필요합니다")
    }
  }
  const src = e.source
  if (!isObj(src)) out.push("source: 객체여야 합니다")
  else {
    if (!isStr(src.system)) out.push("source.system: 문자열이 필요합니다")
    if (!ORIGINS.includes(src.origin as string)) out.push(`source.origin: ${ORIGINS.join("·")} 중 하나여야 합니다`)
    if (typeof src.sample !== "boolean") out.push("source.sample: true/false여야 합니다")
  }
  return out
}

/** 구조 정의표 — 공통 필드와 원천별 대응(화면의 '구조 정의' 카드). 원천 칸은 실제 변환 코드가 읽는 항목이다 */
export const EVENT_FIELD_MAP: { field: string; meaning: string; river: string; coast: string; aqua: string; kma: string }[] = [
  { field: "id · serviceId · title", meaning: "공통 이벤트 ID, 서비스, 제목", river: "관측점 id · 유량 %", coast: "구역 id · 연안 상황", aqua: "취수구 id · 도달 시간", kma: "발표 id · 특보명" },
  { field: "occurredAt", meaning: "발생·기준 시각", river: "배치 기준 시각", coast: "배치 기준 시각", aqua: "배치 기준 시각", kma: "발표·수신 시각" },
  { field: "subject", meaning: "발생 위치(이름·종류·좌표)", river: "관측점 이름·좌표", coast: "구역 이름·좌표", aqua: "취수구 이름", kma: "발효 지역·태풍 위치" },
  { field: "risk", meaning: "위험도(평시·관심·주의·경계·심각)와 근거", river: "유량비 단계", coast: "VLM 요약 등급", aqua: "저염수 도달 단계", kma: "특보 등급(예비·주의보·경보)" },
  { field: "observation[]", meaning: "관측값(근거 수치)", river: "수위 · 유량비", coast: "이용객 수", aqua: "표층 염분 · 수온", kma: "태풍 속도·기압·풍속" },
  { field: "prediction", meaning: "AI 예측값(시점별)", river: "10·30·60분 후 수위", coast: "—", aqua: "저염수 도달 예상 시간", kma: "—" },
  { field: "alert", meaning: "경보 결과(발령·해제)", river: "—(연계 전)", coast: "—(연계 전)", aqua: "—(연계 전)", kma: "특보·재난문자 발령·해제" },
  { field: "source", meaning: "출처 시스템·구분(기상청·행안부·실증사·샘플)", river: "하천범람 실증사", coast: "연안안전 실증사", aqua: "저염분 실증사", kma: "기상청·행정안전부" },
]
