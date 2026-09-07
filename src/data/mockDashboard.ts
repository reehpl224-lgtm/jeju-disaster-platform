import type {
  AgencyStatus,
  AiInsight,
  KpiCard,
  RecentAction,
  RiskLevel,
  RiskMarker,
  TimeSeriesReading,
} from "../types/domain"

export const lastSyncedAt = "2026-09-04 09:47"

export const kpiCards: KpiCard[] = [
  {
    id: "river",
    title: "하천 범람 상태",
    level: "warning",
    headline: "경계 2 / 주의 1",
    detail: "감시 하천 14개소",
    href: "/river",
    ctaLabel: "하천 범람 예측",
  },
  {
    id: "coast",
    title: "연안 안전 상태",
    level: "danger",
    headline: "위험 3 / 감시 5",
    detail: "탐지 이벤트 7건",
    href: "/coast",
    ctaLabel: "연안 위험 관제",
  },
  {
    id: "aqua",
    title: "염분·수온 상태",
    level: "caution",
    headline: "고수온 주의 2",
    detail: "영향 양식장 18개소",
    href: "/aqua",
    ctaLabel: "해양 위험 예측",
  },
  {
    id: "agency",
    title: "기관 공조 상태",
    level: "info",
    headline: "출동 2 / 대기 4",
    detail: "도·서귀포시 공동 대응",
    href: "/reports",
    ctaLabel: "공조 현황 보기",
  },
]

export const riskMarkers: RiskMarker[] = [
  { id: "donnaeko", name: "효돈천(돈내코)", x: 178, y: 198, level: "warning", domain: "river" },
  { id: "soesokkak", name: "효돈천(쇠소깍)", x: 196, y: 222, level: "danger", domain: "river" },
  { id: "hamdeok", name: "함덕 해수욕장", x: 222, y: 92, level: "danger", domain: "coast" },
  { id: "samyang", name: "삼양 해수욕장", x: 195, y: 88, level: "warning", domain: "coast" },
  { id: "hyeopjae", name: "협재 해수욕장", x: 54, y: 140, level: "caution", domain: "coast" },
  { id: "hangyeong-geumdeung", name: "한경 금등", x: 50, y: 168, level: "safe", domain: "aqua", value: "24.7°C" },
  { id: "hangyeong-yongsu", name: "한경 용수", x: 44, y: 192, level: "safe", domain: "aqua", value: "25.8°C" },
  { id: "daejeong-ilgwa", name: "대정 일과", x: 70, y: 232, level: "caution", domain: "aqua", value: "26.8°C" },
]

export const timeSeries: TimeSeriesReading[] = [
  { label: "효돈천(돈내코) 수위", value: 2.34, threshold: 2.0, unit: "m", worseWhen: "above" },
  { label: "효돈천(쇠소깍) 수위", value: 1.87, threshold: 1.5, unit: "m", worseWhen: "above" },
  { label: "함덕 해수온", value: 28.4, threshold: 28.0, unit: "°C", worseWhen: "above" },
  { label: "한경 염분", value: 24.6, threshold: 25.0, unit: "psu", worseWhen: "below" },
]

export const aiInsights: AiInsight[] = [
  { id: "river", title: "하천 범람 예측", basis: "강우레이더 + 수위센서 융합" },
  { id: "coast", title: "연안 위험 탐지", basis: "AI CCTV + AIoT 스마트폴" },
  { id: "aqua", title: "해양 위험 예측", basis: "다중모델 + 위성 + 현장관측" },
]

export const agencyStatuses: AgencyStatus[] = [
  { id: "jeju-do", agency: "제주특별자치도 상황실", role: "총괄", status: "connected", lastAction: "09:41 갱신" },
  { id: "seogwipo", agency: "서귀포시 상황실", role: "현장 대응", status: "connected", lastAction: "09:39 갱신" },
  { id: "coast-guard", agency: "제주해양경찰서", role: "연안 출동", status: "connected", lastAction: "09:38 갱신" },
  { id: "fire", agency: "제주소방본부", role: "구조 출동", status: "connected", lastAction: "09:35 갱신" },
  { id: "kma", agency: "기상청 제주지방기상청", role: "기상 연계", status: "down", lastAction: "09:38 발생 · 강우레이더 API 미수신" },
]

export const recentActions: RecentAction[] = [
  { id: "a1", time: "09:31", title: "효돈천(쇠소깍) 경계 단계 승인", owner: "재난대응1팀", note: "하천 범람" },
  { id: "a2", time: "09:18", title: "효돈천(돈내코) 수위 이상 감지", owner: "재난대응2팀", note: "센서 교차검증 완료" },
  { id: "a3", time: "08:55", title: "함덕 방파제 위험구역 진입 탐지", owner: "연안관제팀", note: "현장 경보 실행" },
  { id: "a4", time: "08:40", title: "삼양 해경 출동 공조 요청", owner: "연안관제팀", note: "해경 수신 확인" },
  { id: "a5", time: "08:12", title: "한경·대정 고수온 주의 승인", owner: "재난대응1팀", note: "양식장 18개소 안내 발송" },
]

export const sensorCrossCheck = { normal: 14, fault: 2, missing: 1 }

export const predictionConfidence = { level: "고신뢰", percent: 92 }

export const sixHourSeries = [
  { time: "04:00", 돈내코수위: 1.62, 쇠소깍수위: 1.31, 함덕수온: 27.6 },
  { time: "05:00", 돈내코수위: 1.74, 쇠소깍수위: 1.38, 함덕수온: 27.7 },
  { time: "06:00", 돈내코수위: 1.88, 쇠소깍수위: 1.44, 함덕수온: 27.9 },
  { time: "07:00", 돈내코수위: 2.02, 쇠소깍수위: 1.55, 함덕수온: 28.0 },
  { time: "08:00", 돈내코수위: 2.19, 쇠소깍수위: 1.68, 함덕수온: 28.2 },
  { time: "09:00", 돈내코수위: 2.34, 쇠소깍수위: 1.87, 함덕수온: 28.4 },
]

export const weatherTimeline: { time: string; level: RiskLevel }[] = [
  { time: "05:00", level: "safe" },
  { time: "06:00", level: "safe" },
  { time: "07:00", level: "safe" },
  { time: "08:00", level: "caution" },
  { time: "09:00", level: "warning" },
  { time: "10:00", level: "warning" },
  { time: "11:00", level: "danger" },
  { time: "12:00", level: "warning" },
  { time: "13:00", level: "caution" },
  { time: "14:00", level: "caution" },
  { time: "15:00", level: "safe" },
]

export const weatherTimelineNow = "09:47"

export const dashboardSensors = [
  { id: "sn1", name: "효돈천 수위센서 #HD-01", type: "하천", location: "돈내코 계곡 인근", value: "2.34 m", status: "warning" as RiskLevel, updatedAt: "09:47" },
  { id: "sn2", name: "효돈천 수위센서 #HD-02", type: "하천", location: "쇠소깍 하류", value: "1.87 m", status: "caution" as RiskLevel, updatedAt: "09:46" },
  { id: "sn3", name: "신규 강우레이더", type: "기상", location: "서귀포시 효돈동", value: "강우 없음", status: "safe" as RiskLevel, updatedAt: "09:47" },
  { id: "sn4", name: "함덕 AIoT 스마트폴", type: "연안", location: "함덕해수욕장", value: "수온 28.4°C", status: "warning" as RiskLevel, updatedAt: "09:40" },
  { id: "sn5", name: "협재 AIoT 스마트폴", type: "연안", location: "협재해수욕장", value: "파고 1.2 m", status: "safe" as RiskLevel, updatedAt: "09:45" },
  { id: "sn6", name: "한경 염분센서", type: "양식장", location: "한경면 해역", value: "24.6 psu", status: "caution" as RiskLevel, updatedAt: "09:30" },
]
