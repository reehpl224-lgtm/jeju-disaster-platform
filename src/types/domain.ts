export type RiskLevel = "danger" | "warning" | "caution" | "safe" | "info" | "offline"

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
  domain: "river" | "coast" | "aqua"
  /** 양식장 수온 등 관측값 콜아웃에 표시할 값 (예: "24.7°C", "점검중") */
  value?: string
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
