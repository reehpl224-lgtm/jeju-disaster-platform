import { GIS_RAIL_ITEMS, type GisRailKey } from "./gisRailItems"

interface GisIconRailProps {
  activeKey: GisRailKey | null
  onSelect: (key: GisRailKey) => void
  /** 기본값은 전체 8개 항목. 화면별로 일부 항목을 뺄 때 필터링해서 넘긴다. */
  items?: readonly (typeof GIS_RAIL_ITEMS)[number][]
}

export function GisIconRail({ activeKey, onSelect, items = GIS_RAIL_ITEMS }: GisIconRailProps) {
  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-lg border border-border-subtle bg-panel/95 p-1.5 shadow-panel">
      {items.map((item) => (
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
