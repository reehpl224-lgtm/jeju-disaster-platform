import { useState, type ReactNode } from "react"

export interface GisTimelineTab {
  key: string
  label: string
  content: ReactNode
}

export function GisTimelinePanel({ tabs, filters }: { tabs: GisTimelineTab[]; filters?: ReactNode }) {
  const [tabKey, setTabKey] = useState(tabs[0]?.key)
  const active = tabs.find((t) => t.key === tabKey) ?? tabs[0]

  return (
    // Card 안에 들어가는 일반 블록 — 예전에는 지도 위에 뜨는 플로팅 오버레이였지만, 우측 GisTimelinePanel이
    // 항상 같은 자리를 차지하는 툴바 팝업(JejuTileMap)과 겹쳐서 지도 밖 전용 컬럼으로 옮김(2026-09-09).
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-border-subtle pb-2 text-xs font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTabKey(tab.key)}
            className={`rounded-full px-2.5 py-1 ${tab.key === active?.key ? "bg-accent text-black" : "text-white/50 hover:bg-inset"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filters && <div className="shrink-0 border-b border-border-subtle py-2">{filters}</div>}

      <div className="overflow-y-auto pt-2">{active?.content}</div>
    </div>
  )
}
