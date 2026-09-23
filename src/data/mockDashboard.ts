import type {
  AgencyStatus,
  AiInsight,
  RecentAction,
  RiskLevel,
  RiskMarker,
  TimeSeriesReading,
} from "../types/domain"

export const lastSyncedAt = "2026-09-22 09:15"

/** GIS 지도 하단 서비스 카드 그리드 — 참고 솔루션(demo-10.muhanit.kr) GIS 상황 화면의 주의/경계/심각 카운트 카드 구조 */
export const serviceStatusCards: {
  id: string
  title: string
  icon: string
  href: string
  counts: { warning: number; alert: number; danger: number; caution?: number }
}[] = [
  // 카드 순서: 사용자 지정(2026-09-08) — 호우·태풍·폭염 대응·하천범람·저염분 고수온·연안 안전
  // 2026-09-23: 저염분 고수온 카드처럼 전 카드에 관심(caution) 행을 추가 — 4단계(관심·주의·경계·심각) 통일
  // weatherStations(mockHeavyRain.ts) 기준: ws-4·ws-6 caution(2) · ws-2·ws-3 warning(2) · ws-1 alert(1) · danger 없음
  { id: "heavy-rain", title: "호우", icon: "☔", href: "/heavy-rain", counts: { warning: 2, alert: 1, danger: 0, caution: 2 } },
  // typhoonReports(mockTyphoon.ts) 기준: 최신 발표(ty-1) 태풍경보 1건 → alert. 발표 이력(ty-2·ty-3)은
  // 같은 태풍 1개의 과거 단계 기록이라 별개 관심 건수로 세지 않음(caution 0)
  { id: "typhoon", title: "태풍", icon: "🌀", href: "/typhoon", counts: { warning: 0, alert: 1, danger: 0, caution: 0 } },
  // heatLevelInfo(mockHeat.ts) 기준: 제주 전역 폭염주의보(warning) 1건 — 섬 전체 단일 등급이라 caution 0
  { id: "heat", title: "폭염 대응", icon: "🔆", href: "/heat", counts: { warning: 1, alert: 0, danger: 0, caution: 0 } },
  // riverStatuses(돈내코·쇠소깍 모두 safe)와 반드시 같은 수치를 쓸 것 — 2026-09-22 평시 리셋
  { id: "river", title: "하천범람", icon: "🏞️", href: "/river", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
  // aquaFarmTotals(mockAqua.ts) 기준: caution 3 · 나머지 0 — 한경 용수 인근 저염분수 관심 케이스(2026-09-22)
  { id: "aqua", title: "저염분 고수온", icon: "🌡️", href: "/aqua", counts: { warning: 0, alert: 0, danger: 0, caution: 3 } },
  // coastSummary(mockCoast.ts) 기준: 진행 중 이벤트 0건 — 2026-09-22 평시 리셋
  { id: "coast", title: "연안 안전관리", icon: "🌊", href: "/coast", counts: { warning: 0, alert: 0, danger: 0, caution: 0 } },
]

export const riskMarkers: RiskMarker[] = [
  // riverStatuses(mockRiver.ts) 기준 정상 — 2026-09-22 평시 리셋
  { id: "donnaeko", name: "효돈천(돈내코)", x: 178, y: 198, level: "safe", domain: "river", lat: 33.276, lng: 126.593 },
  { id: "soesokkak", name: "효돈천(쇠소깍)", x: 196, y: 222, level: "safe", domain: "river", lat: 33.247, lng: 126.619 },
  // coastSummary(mockCoast.ts) 기준 정상 — 2026-09-22 평시 리셋
  { id: "hamdeok", name: "함덕 해수욕장", x: 222, y: 92, level: "safe", domain: "coast", lat: 33.543, lng: 126.670 },
  { id: "hyeopjae", name: "협재 해수욕장", x: 54, y: 140, level: "safe", domain: "coast", lat: 33.394, lng: 126.239 },
  // aquaFarms/aquaRiskState(mockAqua.ts) 저염분수 관심 케이스(2026-09-22, 한경 용수 인근)와 일치시킬 것.
  // classifySalinity(marineAlertThresholds.ts) 기준: 30.5→정상, 29.4·29.7→관심(caution)
  { id: "hangyeong-geumdeung", name: "한경 금등", x: 40, y: 125, level: "safe", domain: "aqua", temperature: "24.0°C", salinity: "30.5 psu", lat: 33.322, lng: 126.175 },
  { id: "hangyeong-yongsu", name: "한경 용수", x: 44, y: 185, level: "caution", domain: "aqua", temperature: "24.6°C", salinity: "29.4 psu", lat: 33.310, lng: 126.166 },
  { id: "daejeong-ilgwa", name: "대정 일과", x: 60, y: 240, level: "caution", domain: "aqua", temperature: "24.5°C", salinity: "29.7 psu", lat: 33.221, lng: 126.252 },
  // weatherStations(mockHeavyRain.ts) ws-1 "경보 발령"과 반드시 같은 등급을 쓸 것
  { id: "hancheon", name: "한천 침수경보", x: 145, y: 80, level: "alert", domain: "heavyRain", lat: 33.499, lng: 126.520 },
  // typhoonReports(mockTyphoon.ts) 최신 발표(ty-1) "태풍경보"와 반드시 같은 등급을 쓸 것.
  // 실제 좌표는 "북서 방향 접근"(mockDashboard.ts aiInsights 문구) 기준 제주 북서쪽 해상에 상징적으로 배치 — 정밀 관측값 아님
  { id: "typhoon-kroban", name: "제24호 크로반", x: 300, y: 265, level: "alert", domain: "typhoon", lat: 34.05, lng: 125.95 },
  // heatLevelInfo(mockHeat.ts) "폭염주의보"(warning)와 반드시 같은 등급을 쓸 것 — heatRouteTips의 "더운 길" 지점
  { id: "sinjeju-hotroute", name: "신제주 로터리(더운 길)", x: 115, y: 100, level: "warning", domain: "heat", lat: 33.489, lng: 126.481 },
  // 정상(safe) 지점도 지도에 노출 — dashboardSensors(위 참고)에 이미 있는 "정상" 상태 센서 2건을 그대로 재사용
  // (기존 인근 마커와 겹치지 않도록 좌표만 살짝 offset)
  { id: "hyodong-radar", name: "효돈천 AIoT 계측망 #1 (상류)", x: 182, y: 190, level: "safe", domain: "heavyRain", lat: 33.283, lng: 126.580 },
  { id: "hyeopjae-smartpole", name: "협재 AIoT 스마트폴", x: 58, y: 144, level: "safe", domain: "coast", lat: 33.396, lng: 126.242 },
  // 국립해양조사원(KHOA) 실시간 해양관측 API 실연동 — 수온·염분 실측값(mockAqua.ts khoaLiveObservations와 동일 소스,
  // 2026-09-09 확인). classifyMarineRiskLevel(염분,수온) 기준 판정: 중문=주의, 나머지 3곳=관심.
  // 제주남부(KG_0021)는 제주 본섬 훨씬 남쪽 국가 관측망 지점이라 지도 초기 화면(전체 줌 11) 기준으로는 화면 밖에 위치함.
  { id: "khoa-tw0075", name: "중문해수욕장(KHOA 부이)", x: 150, y: 210, level: "warning", domain: "aqua", temperature: "27.22°C", salinity: "26.82 psu", lat: 33.2345, lng: 126.40955 },
  { id: "khoa-kg0021", name: "제주남부(KHOA 부이)", x: 150, y: 320, level: "caution", domain: "aqua", temperature: "27.76°C", salinity: "32.80 psu", lat: 32.09041, lng: 126.96586 },
  { id: "khoa-kg0028", name: "제주해협(KHOA 부이)", x: 150, y: 30, level: "caution", domain: "aqua", temperature: "26.93°C", salinity: "30.47 psu", lat: 33.70011, lng: 126.5905 },
  { id: "khoa-dt0023", name: "모슬포(KHOA 조위관측소)", x: 70, y: 235, level: "caution", domain: "aqua", temperature: "26.60°C", salinity: "30.60 psu", lat: 33.21444, lng: 126.25111 },
]

export const timeSeries: TimeSeriesReading[] = [
  { label: "효돈천(돈내코) 수위", value: 1.05, threshold: 2.0, unit: "m", worseWhen: "above" },
  { label: "효돈천(쇠소깍) 수위", value: 0.98, threshold: 1.5, unit: "m", worseWhen: "above" },
  { label: "함덕 해수온", value: 24.6, threshold: 28.0, unit: "°C", worseWhen: "above" },
  // classifySalinity(marineAlertThresholds.ts) 정상 기준 30.0psu — 한경 용수 인근 관심 케이스(29.4psu)만 임계 초과로 표시
  { label: "한경 염분", value: 29.4, threshold: 30.0, unit: "psu", worseWhen: "below" },
]

export const aiInsights: AiInsight[] = [
  { id: "river", title: "하천 범람 예측", basis: "강우레이더 + 수위센서 융합" },
  { id: "coast", title: "연안 위험 탐지", basis: "AI CCTV + AIoT 스마트폴" },
  { id: "aqua", title: "해양 위험 예측", basis: "다중모델 + 위성 + 현장관측" },
  { id: "heavy-rain", title: "돌발 강우 조기경보", basis: "우량계 실측 추이 vs 기상청 예보 비교" },
  { id: "typhoon", title: "태풍 경로 안내", basis: "기상청 발표 자료 수신 (자체 관측 없음)" },
  { id: "heat", title: "폭염 특보 및 열섬 안내", basis: "체감온도 관측 + 열섬 구간(시원한 길·더운 길) 분석" },
]

export const agencyStatuses: AgencyStatus[] = [
  { id: "jeju-do", agency: "제주특별자치도 상황실", role: "총괄", status: "connected", lastAction: "09:41 갱신" },
  { id: "seogwipo", agency: "서귀포시 상황실", role: "현장 대응", status: "connected", lastAction: "09:39 갱신" },
  { id: "coast-guard", agency: "제주해양경찰서", role: "연안 출동", status: "connected", lastAction: "09:38 갱신" },
  { id: "fire", agency: "제주소방본부", role: "구조 출동", status: "connected", lastAction: "09:35 갱신" },
  { id: "kma", agency: "기상청 제주지방기상청", role: "기상 연계", status: "connected", lastAction: "09:10 갱신" },
]

// 2026-09-22 리셋 — 하천·연안은 평시 정기점검, 저염분 고수온만 관심 단계 케이스 진행 중
export const recentActions: RecentAction[] = [
  { id: "a1", time: "09:10", title: "함덕·협재 AIoT 스마트폴 상시 점검 완료", owner: "연안관제팀", note: "장비 4기 전 기기 정상" },
  { id: "a2", time: "09:05", title: "기상청 강우레이더 API 연동 정상 확인", owner: "시스템", note: "기관 연계 이상 없음" },
  { id: "a3", time: "09:00", title: "효돈천(돈내코·쇠소깍) 정기 점검 완료", owner: "하천관제팀", note: "이상 없음 · 정상 단계 유지" },
  { id: "a4", time: "08:58", title: "한경 용수 인근 현장 예찰 요청 접수", owner: "양식정책팀", note: "저염분수 관심 단계 대응" },
  { id: "a5", time: "08:52", title: "한경 용수 인근 염분 관심 구간 진입 감지", owner: "시스템 자동 판정", note: "AI 자동 관심 단계 판정 · 담당자 확인 대기" },
]

export const sensorCrossCheck = { normal: 16, fault: 0, missing: 1 }

export const predictionConfidence = { level: "고신뢰", percent: 92 }

export const sixHourSeries = [
  { time: "04:00", 돈내코수위: 1.02, 쇠소깍수위: 0.95, 함덕수온: 24.3 },
  { time: "05:00", 돈내코수위: 1.03, 쇠소깍수위: 0.96, 함덕수온: 24.4 },
  { time: "06:00", 돈내코수위: 1.03, 쇠소깍수위: 0.96, 함덕수온: 24.4 },
  { time: "07:00", 돈내코수위: 1.04, 쇠소깍수위: 0.97, 함덕수온: 24.5 },
  { time: "08:00", 돈내코수위: 1.04, 쇠소깍수위: 0.97, 함덕수온: 24.5 },
  { time: "09:00", 돈내코수위: 1.05, 쇠소깍수위: 0.98, 함덕수온: 24.6 },
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

// 2026-09-22 리셋 — 하천·연안 센서는 정상, 한경 염분센서만 저염분수 관심 케이스(29.4psu)로 표시
export const dashboardSensors = [
  { id: "sn1", name: "효돈천 수위센서 #HD-01", type: "하천", location: "돈내코 계곡 인근", value: "1.05 m", status: "safe" as RiskLevel, updatedAt: "09:10" },
  { id: "sn2", name: "효돈천 수위센서 #HD-02", type: "하천", location: "쇠소깍 하류", value: "0.98 m", status: "safe" as RiskLevel, updatedAt: "09:10" },
  { id: "sn3", name: "효돈천 AIoT 계측망 #1 (상류)", type: "기상", location: "서귀포시 효돈동", value: "강우 없음", status: "safe" as RiskLevel, updatedAt: "09:10" },
  { id: "sn4", name: "함덕 AIoT 스마트폴", type: "연안", location: "함덕해수욕장", value: "수온 24.6°C", status: "safe" as RiskLevel, updatedAt: "09:10" },
  { id: "sn5", name: "협재 AIoT 스마트폴", type: "연안", location: "협재해수욕장", value: "파고 0.6 m", status: "safe" as RiskLevel, updatedAt: "09:10" },
  { id: "sn6", name: "한경 염분센서", type: "해안관측", location: "한경면 해역", value: "29.4 psu", status: "caution" as RiskLevel, updatedAt: "08:52" },
]
