import type { RiskLevel } from "../types/domain"

/**
 * 종합상황 좌·우 사이드패널(Figma "1단계 · 종합상황 좌·우 사이드패널")에 쓰는 **임의 데이터(샘플)** 모음.
 *
 * 연동된 실제 데이터가 없는 자리를 디자인대로 채워 보여주기 위한 값이다 — 실제 상황이 아니다. 화면에는 항상
 * "샘플" 표식(SpSample)이 함께 붙는다. 여기 있는 값은 나중에 입력 패널이나 실연동으로 교체할 자리이므로,
 * **샘플은 이 파일에만 둔다**(화면 컴포넌트에 숫자를 직접 쓰지 않는다).
 *
 * 임의 데이터 영역(패널 → 이 파일의 export):
 *   L1 타임라인        → SAMPLE_EVENTS            (기상청 특보·태풍을 **받지 못했을 때만** 사용 — 받았는데 0건이면 0건 그대로)
 *   L2 발효중 특보      → SAMPLE_EVENTS            (위와 같은 조건 — 간트도 이 사건의 발효 구간으로 그린다)
 *   L3 동네예보        → buildSampleForecast / SAMPLE_WEEKLY (스테이징·예보를 못 받았을 때 전체, 프로토타입은 내일 이후 주간 날씨만 — 중기예보 미연동)
 *   L4 실시간 특보      → SAMPLE_EVENTS 중 기상특보 (실데이터가 없을 때만)
 *   R1 상황전파        → SAMPLE_CHANNELS (항상) · SAMPLE_REACH / SAMPLE_RECENT_ACTIONS (스테이징)
 *   R2 센서정보        → SAMPLE_SENSOR_SUMMARY / SAMPLE_SERVICE_SENSORS / SAMPLE_SENSOR_ALERTS
 *   R3 센서 추이       → SAMPLE_TREND_RANK / SAMPLE_TREND_CARDS
 *   R4 대응현황        → SAMPLE_SERVICE_STAGES / SAMPLE_ACTIONS / SAMPLE_AGENCIES / SAMPLE_TEAMS
 *   R7 자산현황        → SAMPLE_ASSET_SUMMARY / SAMPLE_RIVER_RESOURCES / SAMPLE_RIVER_FACILITIES (항상) · SAMPLE_SHELTER_COUNTS (스테이징)
 *   R8 AI 분석         → SAMPLE_VLM_SUMMARY / SAMPLE_INTAKES / SAMPLE_AI
 * 실데이터(샘플 아님): L3 현재·단기예보(기상청), L1·L2·L4의 기상특보·태풍(있을 때), R5 담당자(mockContacts),
 *   R1의 보고체계(mockPropagation), R8의 신뢰도·교차검증·AI 기능 6종(mockDashboard).
 */

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export type SpCategory = "disaster" | "weather" | "message"

/** 사건의 출처 — 기상청 특보 · 태풍 현황 · 재난문자 · 그 밖(홍수·산사태처럼 연동 API가 없는 것, 스테이징 샘플 전용) */
export type SpSource = "warnings" | "typhoon" | "messages" | "other"

export interface SpEvent {
  id: string
  source: SpSource
  category: SpCategory
  /** 아이콘(이모지) */
  icon: string
  level: RiskLevel
  status: "발령" | "해제"
  title: string
  detail: string
  /** 발표·수신 시각 */
  at: Date
  /** 태풍 등 부가 수치 */
  meta?: { label: string; value: string }[]
  /** 발효 구간(발효중 특보 간트용) — 없으면 `at`부터 지금까지 */
  until?: Date
  /** 샘플 여부 */
  sample: boolean
}

export const CATEGORY_LABEL: Record<SpCategory, string> = { disaster: "재난특보", weather: "기상특보", message: "재난문자" }
export const CATEGORY_ICON: Record<SpCategory, string> = { disaster: "🌀", weather: "☔", message: "📩" }

/** 샘플 사건 15건 — 시각은 접속 시각 기준으로 계산한다(항상 "최근"처럼 보이게). 재난특보 4·기상특보 9·재난문자 2. */
export function buildSampleEvents(now = new Date()): SpEvent[] {
  const base = Math.floor(now.getTime() / MIN) * MIN // 초는 00으로 맞춘다
  const t = (minutesAgo: number) => new Date(base - minutesAgo * MIN)
  const sourceOf = (id: string, category: SpCategory): SpSource => (id.startsWith("s-ty") ? "typhoon" : category === "message" ? "messages" : id === "s-landslide" || id === "s-flood" ? "other" : "warnings")
  const ev = (e: Omit<SpEvent, "sample" | "source">): SpEvent => ({ ...e, source: sourceOf(e.id, e.category), sample: true })
  return [
    ev({ id: "s-ty27", category: "disaster", icon: "🌀", level: "caution", status: "발령", title: "제27호 초이완", detail: "일본 도쿄 동북동쪽 약 1220 km 부근 해상", at: t(40), meta: [{ label: "이동", value: "65km/h" }, { label: "중심기압", value: "965hPa" }, { label: "최대풍속", value: "37m/s" }] }),
    ev({ id: "s-ty28", category: "disaster", icon: "🌀", level: "caution", status: "발령", title: "제28호 놀루", detail: "괌 북동쪽 약 2450 km 부근 해상", at: t(40), meta: [{ label: "이동", value: "41km/h" }, { label: "중심기압", value: "965hPa" }, { label: "최대풍속", value: "37m/s" }] }),
    ev({ id: "s-ty29", category: "disaster", icon: "🌀", level: "caution", status: "발령", title: "제29호 고구마", detail: "괌 동쪽 약 2330 km 부근 해상", at: t(40), meta: [{ label: "이동", value: "15km/h" }, { label: "중심기압", value: "992hPa" }, { label: "최대풍속", value: "23m/s" }] }),
    // 최근 24시간 기상특보 4건 — 발효중 특보(간트)·실시간 특보가 같이 쓴다. 건조주의보는 해제(발효 구간 끝이 있음).
    ev({ id: "s-wind-w", category: "weather", icon: "💨", level: "alert", status: "발령", title: "강풍경보 (기상특보)", detail: "제주시 북부 · 기상청 발표", at: t(40) }),
    ev({ id: "s-rain-w", category: "weather", icon: "☔", level: "warning", status: "발령", title: "호우주의보 (기상특보)", detail: "서귀포시 남부·중산간 · 기상청 발표", at: t(200) }),
    ev({ id: "s-wave-w", category: "weather", icon: "🌊", level: "warning", status: "발령", title: "풍랑주의보 (기상특보)", detail: "제주시 동부·서귀포 남부 · 기상청 발표", at: t(120) }),
    ev({ id: "s-dry-w", category: "weather", icon: "🔥", level: "warning", status: "해제", title: "건조주의보 (기상특보)", detail: "제주시 중산간 · 해제", at: t(270), until: t(60) }),
    ev({ id: "s-msg-wind", category: "message", icon: "📩", level: "alert", status: "발령", title: "재난문자", detail: "제주시 · 강풍경보 발령 안내 문자", at: t(21 * 60 + 55) }),
    ev({ id: "s-msg-rain", category: "message", icon: "📩", level: "warning", status: "발령", title: "재난문자 · 긴급재난", detail: "서귀포시 · 호우주의보 발효 — 하천·계곡 접근 금지", at: t(6 * 60 + 30) }),
    ev({ id: "s-wind-end", category: "weather", icon: "💨", level: "safe", status: "해제", title: "강풍주의보 (기상특보)", detail: "서귀포시 산지 · 해제", at: t(24 * 60 + 20) }),
    ev({ id: "s-landslide", category: "disaster", icon: "⛰️", level: "warning", status: "발령", title: "산사태 위기경보 '주의'", detail: "서귀포시 · 산림청 발표", at: t(2 * DAY / MIN + 5 * 60) }),
    ev({ id: "s-dry", category: "weather", icon: "🔥", level: "warning", status: "해제", title: "건조주의보 (기상특보)", detail: "제주시 중산간 · 해제", at: t(2 * DAY / MIN + 9 * 60) }),
    ev({ id: "s-wave", category: "weather", icon: "🌊", level: "warning", status: "발령", title: "풍랑주의보 (기상특보)", detail: "제주도 앞바다 · 기상청 발표", at: t(3 * DAY / MIN + 2 * 60) }),
    ev({ id: "s-rain-a", category: "weather", icon: "☔", level: "warning", status: "해제", title: "호우주의보 (기상특보)", detail: "제주시 · 해제", at: t(3 * DAY / MIN + 8 * 60) }),
    ev({ id: "s-wind-a", category: "weather", icon: "💨", level: "caution", status: "발령", title: "강풍주의보 (기상특보)", detail: "제주시 북부 · 기상청 발표", at: t(4 * DAY / MIN + 3 * 60) }),
    ev({ id: "s-flood", category: "disaster", icon: "🌊", level: "warning", status: "해제", title: "홍수주의보", detail: "효돈천 · 해제", at: t(4 * DAY / MIN + 10 * 60) }),
    ev({ id: "s-wave-b", category: "weather", icon: "🌊", level: "caution", status: "해제", title: "풍랑주의보 (기상특보)", detail: "제주도 남쪽 먼바다 · 해제", at: t(5 * DAY / MIN + 4 * 60) }),
    ev({ id: "s-fog", category: "weather", icon: "🌫️", level: "caution", status: "발령", title: "안개 (기상특보)", detail: "제주시 · 기상청 발표", at: t(5 * DAY / MIN + 12 * 60) }),
    ev({ id: "s-wind-b", category: "weather", icon: "💨", level: "caution", status: "해제", title: "강풍주의보 (기상특보)", detail: "서귀포시 · 해제", at: t(6 * DAY / MIN + 6 * 60) }),
  ]
}

export { DAY, HOUR, MIN }

// ------------------------------------------------------------------ L3 동네예보
/** 주간 날씨 — 프록시 단기예보는 앞으로 12시간뿐이라 그 뒤(내일 이후)는 중기예보가 필요하다. 연동 전이라 샘플. */
export const SAMPLE_WEEKLY: { min: number; max: number; am: string; pm: string; popAm: number; popPm: number }[] = [
  { min: 20, max: 25, am: "🌤️", pm: "☁️", popAm: 10, popPm: 30 },
  { min: 20, max: 25, am: "⛅", pm: "⛅", popAm: 20, popPm: 20 },
  { min: 20, max: 26, am: "⛅", pm: "⛅", popAm: 20, popPm: 20 },
  { min: 19, max: 25, am: "☀️", pm: "🌤️", popAm: 10, popPm: 20 },
  { min: 18, max: 24, am: "☀️", pm: "☀️", popAm: 0, popPm: 10 },
  { min: 18, max: 25, am: "🌤️", pm: "⛅", popAm: 10, popPm: 20 },
  { min: 19, max: 24, am: "⛅", pm: "☁️", popAm: 20, popPm: 40 },
]

/** 동네예보 샘플(스테이징 · 예보를 못 받았을 때) — 앞으로 12시간 시간별 예보(기온·강수확률·하늘상태)와 현재 관측 */
export function buildSampleForecast(now = new Date()) {
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
  const tmp = [24, 24, 23, 22, 22, 21, 20, 20, 19, 19, 19, 18]
  const pop = [10, 10, 20, 20, 30, 40, 40, 50, 60, 50, 40, 30]
  const sky = ["1", "1", "3", "3", "3", "4", "4", "4", "4", "3", "3", "3"]
  const p2 = (n: number) => String(n).padStart(2, "0")
  const slots = tmp.map((t, i) => {
    const d = new Date(base.getTime() + i * HOUR)
    return { date: `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`, time: `${p2(d.getHours())}00`, values: { TMP: String(t), POP: String(pop[i]), SKY: sky[i], PTY: "0", REH: "62", WSD: "3.1" } }
  })
  return { slots, now: { temperatureC: 24, rainfallMm: 0, humidityPercent: 62, windSpeedMs: 3.1 } }
}

// ------------------------------------------------------------------ R1 상황전파
export interface SpChannel {
  name: string
  /** 0~100. null이면 값 없음 */
  percent: number | null
  state: "safe" | "caution" | "offline"
  /** 값 대신 보여줄 문구 */
  note?: string
}
export const SAMPLE_CHANNELS: SpChannel[] = [
  { name: "자동음성통보", percent: 92, state: "safe" },
  { name: "재해문자전광판", percent: 100, state: "safe" },
  { name: "민방위경보", percent: null, state: "offline", note: "미연계" },
  { name: "UHD 방송", percent: null, state: "offline", note: "정보 없음" },
  { name: "PS-LTE", percent: null, state: "offline", note: "정보 없음" },
  { name: "스마트폴", percent: 67, state: "caution" },
]

/** 순차 전파 단계별 도달 시각 샘플(스테이징) — 도청 → 시 상황실 → 읍면동 */
export const SAMPLE_REACH = ["14:05", "14:11", "14:19"]
/** 최근 조치 이력 샘플(스테이징) */
export const SAMPLE_RECENT_ACTIONS: { id: string; time: string; title: string; owner: string; note: string }[] = [
  { id: "ra1", time: "14:19", title: "읍면동 상황전파 완료", owner: "재난대응1팀", note: "도달 확인 12/12" },
  { id: "ra2", time: "14:11", title: "시 상황실 전파", owner: "도청 상황실", note: "지연 6분" },
  { id: "ra3", time: "14:05", title: "강풍경보 발령 보고", owner: "자연재난과", note: "행정안전부 1차 보고" },
]

// ------------------------------------------------------------------ R7 자산현황 — 대피·수용 시설 샘플(스테이징)
/** 종류별 제주시·서귀포시 개소 수 — 임의의 값. 프로토타입은 받아 둔 실제 파일(shelters-jeju.json)을 쓴다 */
export const SAMPLE_SHELTER_COUNTS: { label: string; jeju: number; seogwipo: number }[] = [
  { label: "민방위 대피소", jeju: 312, seogwipo: 131 },
  { label: "지진해일 긴급대피장소", jeju: 18, seogwipo: 22 },
  { label: "지진 대피장소", jeju: 9, seogwipo: 7 },
  { label: "지진 옥외대피장소", jeju: 85, seogwipo: 74 },
  { label: "수용(구호) 시설", jeju: 96, seogwipo: 88 },
]

// ------------------------------------------------------------------ R8 AI 분석 — 예측 신뢰도·교차검증
export const SAMPLE_AI = { confidence: { level: "고신뢰", percent: 92 }, crossCheck: { normal: 118, fault: 2, missing: 3 } }

// ------------------------------------------------------------------ R2 센서정보
export const SAMPLE_SENSOR_SUMMARY = { total: 131, normal: 118, delayedOrError: 8, delayed: 6, error: 2, unlinked: 5 }
export interface SpServiceSensors {
  id: string
  title: string
  count: number
  level: RiskLevel
}
/** 서비스별 센서 수와 서비스에서 가장 높은 위험등급 — 서비스가 늘면 항목만 추가한다 */
export const SAMPLE_SERVICE_SENSORS: SpServiceSensors[] = [
  { id: "river", title: "하천범람", count: 18, level: "warning" },
  { id: "aqua", title: "저염분 고수온", count: 4, level: "warning" },
  { id: "coast", title: "연안 안전관리", count: 13, level: "caution" },
  { id: "typhoon", title: "태풍", count: 20, level: "caution" },
  { id: "heat", title: "폭염 대응", count: 20, level: "caution" },
  { id: "heavy-rain", title: "호우", count: 26, level: "safe" },
  { id: "snow", title: "대설", count: 12, level: "safe" },
  { id: "wildfire", title: "산불", count: 15, level: "safe" },
  { id: "tsunami", title: "지진해일", count: 3, level: "safe" },
]
export const SAMPLE_SENSOR_ALERTS: { name: string; service: string; reason: string; value: string; level: RiskLevel; badge: string }[] = [
  { name: "쇠소깍 수위", service: "하천범람", reason: "값 이상", value: "Q 61%", level: "warning", badge: "주의" },
  { name: "한경 표층 수온", service: "저염분 고수온", reason: "값 이상", value: "28.3°C", level: "warning", badge: "주의" },
  { name: "협재 스마트폴 C", service: "연안 안전관리", reason: "수집 이상", value: "배터리 31%", level: "caution", badge: "점검" },
  { name: "서귀포 우량계 07", service: "호우", reason: "수집 이상", value: "10분 전 수신", level: "caution", badge: "지연" },
]

// ------------------------------------------------------------------ R3 센서 추이
export interface SpTrendRank {
  service: string
  name: string
  value: string
  trend: "up" | "flat" | "down"
  level: RiskLevel
  /** 0~1 — 5단계 눈금 위 현재 위치 */
  position: number
}
export const SAMPLE_TREND_RANK: SpTrendRank[] = [
  { service: "하천", name: "쇠소깍 수위", value: "Q 61%", trend: "up", level: "warning", position: 0.55 },
  { service: "저염분", name: "한경 표층 수온", value: "28.3°C", trend: "flat", level: "warning", position: 0.5 },
  { service: "연안", name: "함덕 유의파고", value: "1.8m", trend: "up", level: "warning", position: 0.42 },
  { service: "연안", name: "협재 이용객 밀집", value: "142명/시", trend: "down", level: "caution", position: 0.36 },
  { service: "저염분", name: "한경 취수구 염분", value: "28.6psu", trend: "down", level: "caution", position: 0.34 },
  { service: "하천", name: "돈내코 수위", value: "Q 18%", trend: "flat", level: "safe", position: 0.12 },
]
export interface SpTrendCard {
  service: string
  name: string
  value: string
  unit: string
  trend: "up" | "flat" | "down"
  level: RiskLevel
  /** 관측값(왼쪽 실선) */
  observed: number[]
  /** 예측값(오른쪽 점선) */
  forecast: number[]
  /** 기준선 위치(0~1, 위쪽이 큼) — 기준값(threshold)을 모를 때만 쓴다 */
  thresholdAt: number
  /** 기준값 — 있으면 차트 눈금에 포함해 기준선을 그린다(입력 패널 값) */
  threshold?: number
  thresholdLabel: string
}
export const SAMPLE_TREND_CARDS: SpTrendCard[] = [
  { service: "하천", name: "쇠소깍 Q%", value: "61", unit: "%", trend: "up", level: "warning", observed: [18, 20, 26, 31, 37, 42, 46, 50, 53, 56, 59, 61], forecast: [63, 65, 67], thresholdAt: 0.82, thresholdLabel: "경계 기준 70%" },
  { service: "연안", name: "함덕 유의파고", value: "1.8", unit: "m", trend: "up", level: "warning", observed: [0.9, 1.0, 1.0, 1.2, 1.3, 1.4, 1.4, 1.5, 1.6, 1.7, 1.8, 1.8], forecast: [1.9, 1.9, 2.0], thresholdAt: 0.8, thresholdLabel: "경계 기준 2.5m" },
  { service: "저염분", name: "한경 염분", value: "28.6", unit: "psu", trend: "down", level: "caution", observed: [32, 31.6, 31.2, 30.9, 30.5, 30.2, 29.9, 29.6, 29.3, 29.0, 28.8, 28.6], forecast: [28.4, 28.2, 28.0], thresholdAt: 0.18, thresholdLabel: "주의 기준 28psu↓" },
  { service: "연안", name: "협재 이용객", value: "142", unit: "명/시", trend: "down", level: "caution", observed: [40, 70, 110, 140, 150, 160, 155, 148, 152, 146, 142, 142], forecast: [135, 125, 110], thresholdAt: 0.75, thresholdLabel: "밀집 기준 150명/시" },
]

// ------------------------------------------------------------------ R4 대응현황
export interface SpServiceStage {
  id: string
  title: string
  level: RiskLevel
  /** 단계 이름 옆 숫자 — 자릿수 확인용 샘플(1234) */
  count: number | null
  done: number
  total: number
}
export const SAMPLE_SERVICE_STAGES: SpServiceStage[] = [
  { id: "river", title: "하천범람", level: "alert", count: 1234, done: 2, total: 5 },
  { id: "aqua", title: "저염분 고수온", level: "warning", count: 1234, done: 3, total: 5 },
  { id: "coast", title: "연안 안전관리", level: "warning", count: 1234, done: 2, total: 4 },
  { id: "heavy-rain", title: "호우", level: "caution", count: 1234, done: 1, total: 4 },
  { id: "heat", title: "폭염 대응", level: "caution", count: 1234, done: 2, total: 4 },
  { id: "typhoon", title: "태풍", level: "safe", count: null, done: 0, total: 0 },
  { id: "wildfire", title: "산불", level: "safe", count: null, done: 0, total: 0 },
  { id: "snow", title: "대설", level: "safe", count: null, done: 0, total: 0 },
  { id: "tsunami", title: "지진해일", level: "safe", count: null, done: 0, total: 0 },
]
export const SAMPLE_ACTIONS: { service: string; text: string; state: "진행" | "대기" }[] = [
  { service: "하천", text: "취수 중단 여부 검토", state: "진행" },
  { service: "저염분", text: "출하·이송 조기 검토", state: "진행" },
  { service: "연안", text: "이용객 대피 안내 방송", state: "대기" },
]
export const SAMPLE_ACTION_TOTALS = { done: 8, doing: 5, waiting: 12 }
export const SAMPLE_AGENCIES = { connected: 5, total: 6, issue: "장애 1 · 도로교통" }
export const SAMPLE_TEAMS = { count: 2, state: "출동 중" }

// ------------------------------------------------------------------ R7 자산현황
export const SAMPLE_ASSET_SUMMARY = { available: "8/8", activeFacilities: "0/6", registered: 12 }
export const SAMPLE_RIVER_RESOURCES: { label: string; free: number; total: number }[] = [
  { label: "서귀포소방서 출동차 (돈내코)", free: 1, total: 1 },
  { label: "서귀포소방서 출동차 (쇠소깍)", free: 1, total: 1 },
  { label: "현장 통제 인력 (돈내코)", free: 2, total: 2 },
  { label: "현장 통제 인력 (쇠소깍)", free: 2, total: 2 },
  { label: "하상도로 차단기 (돈내코)", free: 1, total: 1 },
  { label: "하상도로 차단기 (쇠소깍)", free: 1, total: 1 },
]
export const SAMPLE_RIVER_FACILITIES: { code: string; label: string }[] = [
  { code: "D-01", label: "하천변 산책구역" },
  { code: "D-02", label: "하상 접근로" },
  { code: "D-03", label: "임시주차구역" },
  { code: "S-01", label: "하구 산책구역" },
  { code: "S-02", label: "하상 접근로" },
  { code: "S-03", label: "저지대 대기구역" },
]

// ------------------------------------------------------------------ R8 AI 분석
export const SAMPLE_VLM_SUMMARY: { time: string; level: RiskLevel; badge: string; text: string }[] = [
  { time: "18:10", level: "safe", badge: "정상", text: "함덕 해수욕장 · 이용객 약 65명 · 안전선 침범 없음" },
  { time: "18:00", level: "safe", badge: "정상", text: "협재 해수욕장 · 이용객 약 29명 · 이안류 징후 없음" },
  { time: "17:50", level: "safe", badge: "정상", text: "함덕 해수욕장 · 이용객 약 52명 · 이안류 징후 없음" },
]
export const SAMPLE_INTAKES: { name: string; hours: number; level: RiskLevel; badge: string }[] = [
  { name: "한경 취수구", hours: 31, level: "caution", badge: "관심" },
  { name: "고산 취수구", hours: 25, level: "caution", badge: "관심" },
  { name: "대정 취수구", hours: 60, level: "safe", badge: "정상" },
]
