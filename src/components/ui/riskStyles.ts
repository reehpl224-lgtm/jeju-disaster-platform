import type { RiskLevel } from "../../types/domain"

interface RiskStyle {
  label: string
  text: string
  bg: string
  border: string
  dot: string
}

export const riskStyles: Record<RiskLevel, RiskStyle> = {
  danger: {
    label: "위험",
    text: "text-risk-danger",
    bg: "bg-risk-danger-bg",
    border: "border-risk-danger/30",
    dot: "bg-risk-danger",
  },
  warning: {
    label: "경계",
    text: "text-risk-warning",
    bg: "bg-risk-warning-bg",
    border: "border-risk-warning/30",
    dot: "bg-risk-warning",
  },
  caution: {
    label: "주의",
    text: "text-risk-caution",
    bg: "bg-risk-caution-bg",
    border: "border-risk-caution/30",
    dot: "bg-risk-caution",
  },
  safe: {
    label: "정상",
    text: "text-risk-safe",
    bg: "bg-risk-safe-bg",
    border: "border-risk-safe/30",
    dot: "bg-risk-safe",
  },
  info: {
    label: "정보",
    text: "text-risk-info",
    bg: "bg-risk-info-bg",
    border: "border-risk-info/30",
    dot: "bg-risk-info",
  },
  offline: {
    label: "오프라인",
    text: "text-risk-offline",
    bg: "bg-risk-offline-bg",
    border: "border-risk-offline/30",
    dot: "bg-risk-offline",
  },
}
