import type { ApiLinkStatus, IncidentLogEntry, SensorGroupStatus, ServiceHealth } from "../types/domain"

export const monitoringLastSyncedAt = "2026-09-04 09:42:17"

export const overallStatus = {
  status: "정상" as const,
  normalServices: 12,
  downServices: 1,
  warningServices: 2,
}

export const connectionSummary = [
  { id: "sensor", label: "센서 연결", percent: 98.2, detail: "활성 247 / 오프라인 5" },
  { id: "cctv", label: "CCTV 연결", percent: 96.7, detail: "활성 116 / 오프라인 4" },
  { id: "api", label: "API 연계", status: "경고", detail: "정상 9 / 지연 1 / 장애 1" },
  { id: "ai", label: "AI 분석 서비스", status: "정상", detail: "모델 6 / 처리 지연 0" },
]

export const incidentLog: IncidentLogEntry[] = [
  {
    id: "i1",
    level: "critical",
    title: "기상청 API 연계 장애",
    detail: "강우레이더 데이터 미수신 · 09:38 발생",
    impact: "영향: 하천 범람 예측 모델 입력 누락",
    time: "09:38",
  },
  {
    id: "i2",
    level: "warning",
    title: "서귀포 수위센서 S-114 응답 지연",
    detail: "마지막 수신: 09:30 · 지연 12분",
    impact: "영향: 하천 수위 시계열 공백 발생",
    time: "09:30",
  },
  {
    id: "i3",
    level: "warning",
    title: "연안 AIoT 스마트폴 SP-022 오프라인",
    detail: "마지막 수신: 08:55 · 오프라인 47분",
    impact: "영향: 삼양해수욕장 감지 영역 공백",
    time: "08:55",
  },
  {
    id: "i4",
    level: "info",
    title: "AI 이상탐지 모델 재배포 완료",
    detail: "v2.4.1 → v2.4.2 · 09:20 적용",
    impact: "영향: 없음",
    time: "09:20",
  },
  {
    id: "i5",
    level: "info",
    title: "GIS 타일 서버 캐시 갱신",
    detail: "완료 · 09:15",
    impact: "영향: 없음",
    time: "09:15",
  },
]

export const sensorGroups: SensorGroupStatus[] = [
  { id: "rain", name: "강우 센서", normal: 64, warning: 2, offline: 1, lastSync: "09:42" },
  { id: "water-level", name: "수위 센서", normal: 51, warning: 1, offline: 2, lastSync: "09:30" },
  { id: "buoy", name: "해양 부이", normal: 18, warning: 0, offline: 1, lastSync: "09:40" },
  { id: "smartpole", name: "AIoT 스마트폴", normal: 34, warning: 0, offline: 1, lastSync: "08:55" },
]

export const serviceHealth: ServiceHealth[] = [
  { id: "s1", name: "하천 범람 예측 엔진", type: "AI 예측", status: "normal", delay: "-", lastSync: "09:41" },
  { id: "s2", name: "연안 위험 탐지 엔진", type: "AI CCTV", status: "normal", delay: "-", lastSync: "09:40" },
  { id: "s3", name: "해양 위험 예측 엔진", type: "AI 예측", status: "warning", delay: "약 3분", lastSync: "09:35" },
  { id: "s4", name: "AX HUB 데이터 파이프라인", type: "데이터 연계", status: "normal", delay: "-", lastSync: "09:42" },
  { id: "s5", name: "GIS 타일 서비스", type: "인프라", status: "normal", delay: "-", lastSync: "09:42" },
]

export const apiLinks: ApiLinkStatus[] = [
  { id: "kma", name: "강우레이더 API", agency: "기상청", status: "down", responseTime: "-", lastReceived: "09:38 이전" },
  // 2026-09-09 실연동 확인(모슬포 DT_0023) — mockRiver.ts khoaMoseulpoTide 참고
  { id: "khoa", name: "조위관측 API", agency: "국립해양조사원", status: "normal", responseTime: "110ms", lastReceived: "15:00" },
  // 2026-09-09 국립해양조사원(KHOA) data.go.kr 공공API 실연동 확인 — jeju-lowsalinity-warning 프로젝트 소스와 동일(mockAqua.ts khoaLiveObservations 참고)
  { id: "buoy-api", name: "해양관측부이 API", agency: "국립해양조사원(KHOA)", status: "normal", responseTime: "190ms", lastReceived: "15:00" },
  { id: "goci", name: "GOCI-II 해색 API", agency: "국가기상위성센터", status: "normal", responseTime: "540ms", lastReceived: "09:20" },
  // 아래 2건은 위 4건(정적 스냅샷)과 달리 kma-weather-proxy(Vercel)를 경유해 화면을 열 때마다 실시간으로 호출한다 —
  // src/data/weatherApi.ts, src/data/typhoonApi.ts 참고. responseTime·lastReceived는 고정값이 아니라 "매 조회마다 실시간"임을 표기.
  { id: "vilage-fcst", name: "기상청 단기예보 API (getVilageFcst)", agency: "기상청", status: "normal", responseTime: "매 조회 시 실시간 호출", lastReceived: "조회 시점" },
  { id: "typ-lst", name: "기상청 API허브 태풍 이름목록 (typ_lst)", agency: "기상청 API허브", status: "normal", responseTime: "매 조회 시 실시간 호출", lastReceived: "조회 시점" },
]

export const jointResponseLog = [
  { id: "j1", agency: "제주특별자치도 상황실", status: "connected" as const, lastAction: "09:41 갱신" },
  { id: "j2", agency: "서귀포시 상황실", status: "connected" as const, lastAction: "09:39 갱신" },
  { id: "j3", agency: "제주해양경찰서", status: "connected" as const, lastAction: "09:38 갱신" },
  { id: "j4", agency: "제주소방본부", status: "connected" as const, lastAction: "09:35 갱신" },
  { id: "j5", agency: "기상청 제주지방기상청", status: "down" as const, lastAction: "09:38 발생 · 강우레이더 API 미수신" },
]

export const monitoringActionLog = [
  { id: "m1", time: "09:38", title: "기상청 API 장애 감지 → 담당자 알림 발송" },
  { id: "m2", time: "09:30", title: "수위센서 S-114 지연 감지 → 현장 점검 요청" },
  { id: "m3", time: "09:20", title: "AI 이상탐지 모델 v2.4.2 자동 배포 완료" },
  { id: "m4", time: "08:55", title: "스마트폴 SP-022 오프라인 → 유지보수 접수" },
]
