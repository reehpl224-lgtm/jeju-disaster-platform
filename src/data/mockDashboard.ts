import type {
  AgencyStatus,
  AiInsight,
  RecentAction,
  RiskLevel,
  RiskMarker,
  TimeSeriesReading,
} from "../types/domain"

/**
 * 2026-09-29 초기화 — 사용자 요청("실시간 API를 제외한 스냅샷·더미데이터 초기화, 시나리오는 새로 생성")에 따라 서비스 카드 집계·지도
 * 마커 등급·센서·시계열·최근 조치 더미를 비웠다. 지도에는 확정 대상지(효돈천 돈내코·쇠소깍 / 함덕·협재 / 한경 금등·용수·대정 일과)의
 * 위치 마커만 정상(safe)으로 남긴다. 시나리오를 새로 쓸 때는 같은 사실을 들고 있는 곳을 함께 맞춰야 한다 — 서비스 카드 집계,
 * 지도 마커 등급, dashboardSensors, timeSeries·sixHourSeries(하천 수위 등), recentActions. 어긋나는지는 data/consistency.ts가 검사한다.
 */
export const lastSyncedAt = "-"

/** GIS 지도 하단 서비스 카드 그리드 — 참고 솔루션(demo-10.muhanit.kr) GIS 상황 화면의 주의/경계/심각 카운트 카드 구조 */
export const serviceStatusCards: {
  id: string
  title: string
  icon: string
  href: string
  counts: { warning: number; alert: number; danger: number; caution?: number }
}[] = [
  // 카드 순서: 사용자 지정(2026-09-08) — 호우·태풍·폭염 대응·하천범람·저염분 고수온·연안 안전. 4단계(관심·주의·경계·심각) 통일.
  // counts는 각 서비스 원본(weatherStations·typhoonReports·heatLevelInfo·riverStatuses·aquaFarmTotals·coastEvents)과 반드시 같은 수치를 쓸 것
  { id: "heavy-rain", title: "호우", icon: "☔", href: "/heavy-rain", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  { id: "typhoon", title: "태풍", icon: "🌀", href: "/typhoon", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  { id: "heat", title: "폭염 대응", icon: "🔆", href: "/heat", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  { id: "river", title: "하천범람", icon: "🏞️", href: "/river", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  { id: "aqua", title: "저염분 고수온", icon: "🌡️", href: "/aqua", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  { id: "coast", title: "연안 안전관리", icon: "🌊", href: "/coast", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
]

export const riskMarkers: RiskMarker[] = [
  // 하천 — riverStatuses(mockRiver.ts)와 같은 등급을 쓸 것
  { id: "donnaeko", name: "효돈천(돈내코)", x: 178, y: 198, level: "safe", domain: "river", lat: 33.276, lng: 126.593 },
  { id: "soesokkak", name: "효돈천(쇠소깍)", x: 196, y: 222, level: "safe", domain: "river", lat: 33.247, lng: 126.619 },
  // 연안 — 1차년도 실증지 함덕·협재(coastEvents 최고 등급과 같은 등급을 쓸 것)
  { id: "hamdeok", name: "함덕 해수욕장", x: 222, y: 92, level: "safe", domain: "coast", lat: 33.543, lng: 126.670 },
  { id: "hyeopjae", name: "협재 해수욕장", x: 54, y: 140, level: "safe", domain: "coast", lat: 33.394, lng: 126.239 },
  // 저염분 고수온 — 확정 관측지점 3곳(AGENTS.md §2-①). 수온·염분 표기가 있는 시나리오는 classifyMarineRiskLevel()로 등급을 계산할 것
  { id: "hangyeong-geumdeung", name: "한경 금등", x: 40, y: 125, level: "safe", domain: "aqua", lat: 33.322, lng: 126.175 },
  { id: "hangyeong-yongsu", name: "한경 용수", x: 44, y: 185, level: "safe", domain: "aqua", lat: 33.310, lng: 126.166 },
  { id: "daejeong-ilgwa", name: "대정 일과", x: 60, y: 240, level: "safe", domain: "aqua", lat: 33.221, lng: 126.252 },
]

/** 센서 시계열 — 시나리오가 채운다(하천 수위는 sixHourSeries·riverRiskBasis·riverSensorCheck와 같은 수치) */
export const timeSeries: TimeSeriesReading[] = []

export const aiInsights: AiInsight[] = [
  { id: "river", title: "하천 범람 예측", basis: "강우레이더 + 수위센서 융합" },
  { id: "coast", title: "연안 위험 탐지", basis: "AI CCTV + AIoT 스마트폴" },
  { id: "aqua", title: "해양 위험 예측", basis: "다중모델 + 위성 + 현장관측" },
  { id: "heavy-rain", title: "돌발 강우 조기경보", basis: "우량계 실측 추이 vs 기상청 예보 비교" },
  { id: "typhoon", title: "태풍 경로 안내", basis: "기상청 발표 자료 수신 (자체 관측 없음)" },
  { id: "heat", title: "폭염 특보 및 열섬 안내", basis: "체감온도 관측 + 열섬 구간(시원한 길·더운 길) 분석" },
]

export const agencyStatuses: AgencyStatus[] = []

export const recentActions: RecentAction[] = []

export const sensorCrossCheck = { normal: 0, fault: 0, missing: 0 }

export const predictionConfidence = { level: "-", percent: 0 }

export const sixHourSeries: { time: string; 돈내코수위: number; 쇠소깍수위: number; 함덕수온: number }[] = []

export const weatherTimeline: { time: string; level: RiskLevel }[] = []

export const weatherTimelineNow = "-"

export const dashboardSensors: { id: string; name: string; type: string; location: string; value: string; status: RiskLevel; updatedAt: string }[] = []
