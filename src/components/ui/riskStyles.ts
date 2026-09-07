import type { RiskLevel } from "../../types/domain"

interface RiskStyle {
  label: string
  text: string
  bg: string
  border: string
  dot: string
  solidBg: string
}

export const riskStyles: Record<RiskLevel, RiskStyle> = {
  danger: {
    label: "심각",
    text: "text-risk-danger",
    bg: "bg-risk-danger-bg",
    border: "border-risk-danger/40",
    dot: "bg-risk-danger",
    solidBg: "bg-risk-danger text-white",
  },
  alert: {
    label: "경계",
    text: "text-risk-alert",
    bg: "bg-risk-alert-bg",
    border: "border-risk-alert/40",
    dot: "bg-risk-alert",
    solidBg: "bg-risk-alert text-white",
  },
  warning: {
    label: "주의",
    text: "text-risk-warning",
    bg: "bg-risk-warning-bg",
    border: "border-risk-warning/40",
    dot: "bg-risk-warning",
    solidBg: "bg-risk-warning text-white",
  },
  caution: {
    label: "관심",
    text: "text-risk-caution",
    bg: "bg-risk-caution-bg",
    border: "border-risk-caution/40",
    dot: "bg-risk-caution",
    solidBg: "bg-risk-caution text-black",
  },
  safe: {
    label: "정상",
    text: "text-risk-safe",
    bg: "bg-risk-safe-bg",
    border: "border-risk-safe/40",
    dot: "bg-risk-safe",
    solidBg: "bg-risk-safe text-black",
  },
  info: {
    label: "정보",
    text: "text-risk-info",
    bg: "bg-risk-info-bg",
    border: "border-risk-info/40",
    dot: "bg-risk-info",
    solidBg: "bg-risk-info text-white",
  },
  offline: {
    label: "오프라인",
    text: "text-risk-offline",
    bg: "bg-risk-offline-bg",
    border: "border-risk-offline/40",
    dot: "bg-risk-offline",
    solidBg: "bg-risk-offline text-white",
  },
}
