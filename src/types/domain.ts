/** 위험등급 5단계(정상<관심<주의<경계<위험) + 비위험 상태(info/offline). 순서: safe < caution < warning < alert < danger */
export type RiskLevel = "danger" | "alert" | "warning" | "caution" | "safe" | "info" | "offline"

export interface RiskLevelMeta {
  level: RiskLevel
  label: string
}

export interface KpiCard {
  id: string
  title: string
  level: RiskLevel
  headline: string
  detail: string
  href: string
  ctaLabel: string
}

export interface RiskMarker {
  id: string
  name: string
  x: number
  y: number
  level: RiskLevel
  domain: "river" | "coast" | "aqua" | "heavyRain" | "typhoon" | "heat"
  /** 양식장 콜아웃 관측값 — 점검중 등 단일 상태 문구를 표시할 때 사용 */
  value?: string
  /** 양식장 콜아웃 수온 (예: "24.7°C") */
  temperature?: string
  /** 양식장 콜아웃 염분 (예: "24.1 psu") */
  salinity?: string
}

export interface TimeSeriesReading {
  label: string
  value: number
  threshold: number
  unit: string
  /** 위험 방향 — "above": 임계값 이상이면 위험(기본값), "below": 임계값 이하이면 위험(예: 염분) */
  worseWhen?: "above" | "below"
}

export interface AiInsight {
  id: string
  title: string
  basis: string
}

export interface AgencyStatus {
  id: string
  agency: string
  role: string
  status: "connected" | "delayed" | "down"
  lastAction: string
}

export interface RecentAction {
  id: string
  time: string
  title: string
  owner: string
  note: string
}

export interface SensorGroupStatus {
  id: string
  name: string
  normal: number
  warning: number
  offline: number
  lastSync: string
}

export interface IncidentLogEntry {
  id: string
  level: "critical" | "warning" | "info"
  title: string
  detail: string
  impact: string
  time: string
}

export interface ServiceHealth {
  id: string
  name: string
  type: string
  status: "normal" | "warning" | "down"
  delay: string
  lastSync: string
}

export interface ApiLinkStatus {
  id: string
  name: string
  agency: string
  status: "normal" | "delayed" | "down"
  responseTime: string
  lastReceived: string
}

/** CCTV 운영 주체 — 레거시 현황 조사 면담(2026-09-07) 기준 3개 그룹 */
export type CctvOperator = "도 자체관제" | "불법주정차" | "자치경찰단 ITS"

export interface CctvCamera {
  id: string
  name: string
  address: string
  domain: "aqua" | "coast" | "river" | "general"
  operator: CctvOperator
  status: "online" | "offline"
  lastFrameAt: string
}

/** CCTV 전체 규모 요약 — 목록에 있는 대표 카메라 수와 실제 운영 규모는 다르다(양식장 대표 사례 표기 방식과 동일) */
export interface CctvCoverageSummary {
  ownOperatedTotal: number
  includingIllegalParkingTotal: number
  itsLinkedCount: number
  itsTotalCount: number
  representativeCount: number
}

/** 상황 전파 단계 — 도청 → 시 상황실 → 읍면동 순차 전파의 단계별 도달 시각 */
export interface PropagationStep {
  id: string
  stage: string
  time: string
}

export interface ReportingChainStep {
  id: string
  label: string
  role: string
}

export interface PropagationChannel {
  id: string
  name: string
  detail: string
}

/**
 * 담당자·연락처 안내 — 레거시시스템 현황 조사 면담(2026-09-07) Q4·Q27 근거.
 * 인사이동 시 실제 담당자 정보는 AI추진단이 접수해 반영하는 운영 방식으로 합의됨.
 */
export interface DutyContact {
  id: string
  domain: "aqua" | "coast" | "river" | "general"
  role: string
  name: string
  org: string
  phone: string
  channel: string
  updatedAt: string
}
