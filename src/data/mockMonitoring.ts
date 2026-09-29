import type { ApiLinkStatus, IncidentLogEntry, SensorGroupStatus, ServiceHealth } from "../types/domain"

// 2026-09-29 초기화 — 시스템 상태 시뮬레이션(연결률·장애·지연)을 비웠다(사용자 요청). 아래 apiLinks에는 매 조회마다 실제로 호출하는 API만 남긴다.
export const monitoringLastSyncedAt = "-"

export const overallStatus = {
  status: "정상" as const,
  normalServices: 0,
  downServices: 0,
  warningServices: 0,
}

export const connectionSummary: { id: string; label: string; percent?: number; status?: string; detail: string }[] = [
  { id: "sensor", label: "센서 연결", detail: "연결 정보 없음" },
  { id: "cctv", label: "CCTV 연결", detail: "연결 정보 없음" },
  { id: "api", label: "API 연계", detail: "연결 정보 없음" },
  { id: "ai", label: "AI 분석 서비스", detail: "연결 정보 없음" },
]

export const incidentLog: IncidentLogEntry[] = []

export const sensorGroups: SensorGroupStatus[] = []

export const serviceHealth: ServiceHealth[] = []

/** 외부 API 연계 — 화면을 열 때마다 실제로 호출하는 API만 남긴다(응답 속도·장애 시뮬레이션 값은 비움) */
export const apiLinks: ApiLinkStatus[] = [
  { id: "vilage-fcst", name: "기상청 단기예보 API (getVilageFcst)", agency: "기상청", status: "normal", responseTime: "매 조회 시 실시간 호출", lastReceived: "조회 시점" },
  { id: "typ-lst", name: "기상청 API허브 태풍 이름목록 (typ_lst)", agency: "기상청 API허브", status: "normal", responseTime: "매 조회 시 실시간 호출", lastReceived: "조회 시점" },
]

export const jointResponseLog: { id: string; agency: string; status: "connected" | "down"; lastAction: string }[] = []

export const monitoringActionLog: { id: string; time: string; title: string }[] = []
