import type { ReactNode } from "react"
import { ComingSoonPanel } from "../board/ComingSoon"
import { GIS_RAIL_ITEMS, type GisRailKey } from "./gisRailItems"

interface GisSidePanelProps {
  activeKey: GisRailKey
  onClose: () => void
  content: Partial<Record<GisRailKey, ReactNode>>
}

export function GisSidePanel({ activeKey, onClose, content }: GisSidePanelProps) {
  const title = GIS_RAIL_ITEMS.find((item) => item.key === activeKey)?.label ?? ""

  return (
    <div className="absolute left-[72px] top-2 z-10 max-h-[calc(100%-16px)] w-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel/95 p-3 shadow-panel">
      <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-2">
        <p className="text-sm font-bold text-white/90">{title}</p>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white" aria-label="닫기">
          ✕
        </button>
      </div>

      {content[activeKey] ??
        (activeKey === "messenger" || activeKey === "news" ? (
          <ComingSoonPanel kind={activeKey} />
        ) : (
          <p className="py-6 text-center text-xs text-white/30">표시할 데이터가 없습니다.</p>
        ))}
    </div>
  )
}
