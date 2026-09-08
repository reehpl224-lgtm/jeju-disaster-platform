import type {
  AgencyStatus,
  AiInsight,
  RecentAction,
  RiskLevel,
  RiskMarker,
  TimeSeriesReading,
} from "../types/domain"

export const lastSyncedAt = "2026-09-04 09:47"

/** GIS 지도 하단 서비스 카드 그리드 — 참고 솔루션(demo-10.muhanit.kr) GIS 상황 화면의 주의/경계/심각 카운트 카드 구조 */
export const serviceStatusCards: {
  id: string
  title: string
  icon: string
  href: string
  counts: { warning: number; alert: number; danger: number }
}[] = [
  // riverStatuses(돈내코 warning 1 · 쇠소깍 danger 1, 14:32 심각 상향)와 반드시 같은 수치를 쓸 것
  { id: "river", title: "하천범람", icon: "🏞️", href: "/river", counts: { warning: 1, alert: 0, danger: 1 } },
  { id: "aqua", title: "저염분 고수온", icon: "🌡️", href: "/aqua", counts: { warning: 7, alert: 7, danger: 5 } },
  { id: "coast", title: "연안 안전관리", icon: "🌊", href: "/coast", counts: { warning: 2, alert: 0, danger: 3 } },
  // weatherStations(mockHeavyRain.ts) 기준: ws-2·ws-3 warning(2) · ws-1 alert(1) · danger 없음
  { id: "heavy-rain", title: "호우", icon: "☔", href: "/heavy-rain", counts: { warning: 2, alert: 1, danger: 0 } },
  // typhoonReports(mockTyphoon.ts) 기준: 최신 발표(ty-1) 태풍경보 1건 → alert
  { id: "typhoon", title: "태풍", icon: "🌀", href: "/typhoon", counts: { warning: 0, alert: 1, danger: 0 } },
  // heatLevelInfo(mockHeat.ts) 기준: 제주 전역 폭염주의보(warning) 1건
  { id: "heat", title: "폭염 대응", icon: "🔆", href: "/heat", counts: { warning: 1, alert: 0, danger: 0 } },
]

export const riskMarkers: RiskMarker[] = [
  { id: "donnaeko", name: "효돈천(돈내코)", x: 178, y: 198, level: "warning", domain: "river" },
  // riverStatuses 기준 14:32에 심각 3단계로 상향(riverControlTimeline ct7)
  { id: "soesokkak", name: "효돈천(쇠소깍)", x: 196, y: 222, level: "danger", domain: "river" },
  { id: "hamdeok", name: "함덕 해수욕장", x: 222, y: 92, level: "danger", domain: "coast" },
  // coastEvents 기준 실제 최고위험(둘 다 danger 이벤트가 진행 중) 반영 — serviceStatusCards.coast(danger 3건)와도 일치시킬 것
  { id: "samyang", name: "삼양 해수욕장", x: 195, y: 88, level: "danger", domain: "coast" },
  { id: "hyeopjae", name: "협재 해수욕장", x: 54, y: 140, level: "danger", domain: "coast" },
  { id: "hangyeong-geumdeung", name: "한경 금등", x: 40, y: 125, level: "alert", domain: "aqua", temperature: "24.7°C", salinity: "25.9 psu" },
  { id: "hangyeong-yongsu", name: "한경 용수", x: 44, y: 185, level: "alert", domain: "aqua", temperature: "25.8°C", salinity: "25.3 psu" },
  { id: "daejeong-ilgwa", name: "대정 일과", x: 60, y: 240, level: "alert", domain: "aqua", temperature: "26.8°C", salinity: "24.6 psu" },
]

export const timeSeries: TimeSeriesReading[] = [
  { label: "효돈천(돈내코) 수위", value: 2.34, threshold: 2.0, unit: "m", worseWhen: "above" },
  { label: "효돈천(쇠소깍) 수위", value: 1.87, threshold: 1.5, unit: "m", worseWhen: "above" },
  { label: "함덕 해수온", value: 28.4, threshold: 28.0, unit: "°C", worseWhen: "above" },
  { label: "한경 염분", value: 24.6, threshold: 26.0, unit: "psu", worseWhen: "below" },
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
  { time: "10:00", level: "alert" },
  { time: "11:00", level: "danger" },
  { time: "12:00", level: "alert" },
  { time: "13:00", level: "warning" },
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
  { id: "sn6", name: "한경 염분센서", type: "양식장", location: "한경면 해역", value: "24.6 psu", status: "alert" as RiskLevel, updatedAt: "09:30" },
]
