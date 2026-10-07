import type { RiskLevel } from "../../types/domain"

/** 디자인은 위험등급을 safe·caution·warning·alert 4색으로만 그린다 — 심각(danger)은 경계와 같은 빨강 */
export type SpLevel = "safe" | "caution" | "warning" | "alert" | "offline" | "info"
export const spLevel = (l: RiskLevel): SpLevel => (l === "danger" ? "alert" : l)

export const LEVEL_NAME: Record<SpLevel, string> = { safe: "평시", caution: "관심", warning: "주의", alert: "경계", offline: "정보 없음", info: "정보" }

/** 위험등급 이름 — 디자인은 색을 4가지로 그리지만 이름은 심각(danger)과 경계(alert)를 구분해 쓴다. safe는 문맥에 따라 평시/정상 */
export const levelName = (l: RiskLevel, safe: "평시" | "정상" = "평시") => (l === "danger" ? "심각" : l === "safe" ? safe : LEVEL_NAME[spLevel(l)])

export const pad2 = (n: number) => String(n).padStart(2, "0")
export const fmtDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
export const fmtMD = (d: Date) => `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
export const fmtHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
export const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"]
