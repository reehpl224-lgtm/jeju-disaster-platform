import { useState, type ReactNode } from "react"

export interface GisTimelineTab {
  key: string
  label: string
  content: ReactNode
}

export function GisTimelinePanel({ tabs }: { tabs: GisTimelineTab[] }) {
  const [tabKey, setTabKey] = useState(tabs[0]?.key)
  const active = tabs.find((t) => t.key === tabKey) ?? tabs[0]

  return (
    <div className="absolute right-2 bottom-2 z-10 max-h-[calc(100%-16px)] w-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel/95 p-3 shadow-xl">
      <div className="mb-2 flex gap-1 border-b border-border-subtle pb-2 text-xs font-semibold">
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

      {active?.content}
    </div>
  )
}
