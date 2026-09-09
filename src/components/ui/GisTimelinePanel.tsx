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
    <div className="absolute right-2 bottom-2 z-10 flex max-h-[calc(100%-16px)] w-72 flex-col rounded-lg border border-border-subtle bg-panel/95 shadow-panel">
      <div className="flex shrink-0 gap-1 border-b border-border-subtle p-3 pb-2 text-xs font-semibold">
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

      {filters && <div className="shrink-0 border-b border-border-subtle p-3 py-2">{filters}</div>}

      <div className="overflow-y-auto p-3 pt-2">{active?.content}</div>
    </div>
  )
}
