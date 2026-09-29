export const GIS_RAIL_ITEMS = [
  { key: "timeline", label: "타임라인", icon: "🕒" },
  { key: "broadcast", label: "상황전파", icon: "📡" },
  { key: "sensor", label: "센서정보", icon: "📶" },
  { key: "response", label: "대응현황", icon: "🚑" },
  { key: "contact", label: "담당자", icon: "☎️" },
  { key: "report", label: "보고서", icon: "📄" },
  { key: "asset", label: "자산현황", icon: "🏚️" },
  { key: "messenger", label: "방재메신저", icon: "💬" },
  { key: "news", label: "안전뉴스", icon: "📰" },
] as const

export type GisRailKey = (typeof GIS_RAIL_ITEMS)[number]["key"]
