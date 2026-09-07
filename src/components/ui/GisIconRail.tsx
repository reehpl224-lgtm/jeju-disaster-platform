export const GIS_RAIL_ITEMS = [
  { key: "timeline", label: "타임라인", icon: "🕒" },
  { key: "broadcast", label: "상황전파", icon: "📡" },
  { key: "sensor", label: "센서정보", icon: "📶" },
  { key: "response", label: "대응현황", icon: "🚑" },
  { key: "report", label: "보고서", icon: "📄" },
  { key: "asset", label: "자산현황", icon: "🏚️" },
  { key: "messenger", label: "방재메신저", icon: "💬" },
  { key: "news", label: "안전뉴스", icon: "📰" },
] as const

export type GisRailKey = (typeof GIS_RAIL_ITEMS)[number]["key"]

interface GisIconRailProps {
  activeKey: GisRailKey | null
  onSelect: (key: GisRailKey) => void
}

export function GisIconRail({ activeKey, onSelect }: GisIconRailProps) {
  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-lg border border-border-subtle bg-panel/95 p-1.5 shadow-xl">
      {GIS_RAIL_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          title={item.label}
          className={`flex w-14 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-center text-[10px] font-medium leading-tight transition ${
            activeKey === item.key
              ? "bg-accent-soft text-accent"
              : "text-white/60 hover:bg-inset hover:text-white"
          }`}
        >
          <span aria-hidden className="text-sm">
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  )
}
