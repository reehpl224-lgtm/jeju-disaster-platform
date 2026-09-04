import { useState } from "react"
import { TOOLBOX_PANELS, type ToolboxChipItem, type ToolboxPanel } from "./mapToolboxData"

function initialState() {
  const state: Record<string, boolean> = {}
  for (const panel of TOOLBOX_PANELS) {
    for (const section of panel.sections) {
      if (section.headingChecked !== undefined) {
        state[`heading:${panel.id}:${section.id}`] = section.headingChecked
      }
      for (const item of section.items) {
        state[item.id] = item.defaultChecked
      }
    }
  }
  return state
}

const CHIP_ACTIVE_CLASS: Record<ToolboxChipItem["activeColor"], string> = {
  blue: "border-risk-info bg-risk-info text-white",
  green: "border-accent bg-accent text-black",
}

export function MapToolbox() {
  const [activePanelId, setActivePanelId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>(initialState)

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const activePanel: ToolboxPanel | undefined = TOOLBOX_PANELS.find((p) => p.id === activePanelId)

  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5">
      <div className="flex gap-1">
        {TOOLBOX_PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => setActivePanelId((prev) => (prev === panel.id ? null : panel.id))}
            title={panel.buttonLabel}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${
              activePanelId === panel.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-border-subtle bg-panel text-white/70 hover:bg-inset"
            }`}
          >
            <span aria-hidden>{panel.icon}</span>
          </button>
        ))}
      </div>

      {activePanel && (
        <div className="w-64 rounded-lg border border-border-subtle bg-panel p-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <p className="text-sm font-bold text-white/90">{activePanel.panelTitle}</p>
            <button
              type="button"
              onClick={() => setActivePanelId(null)}
              className="text-white/40 hover:text-white"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {activePanel.sections.map((section) => (
              <div key={section.id}>
                {section.heading && (
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    {section.headingChecked !== undefined && (
                      <input
                        type="checkbox"
                        checked={checked[`heading:${activePanel.id}:${section.id}`] ?? false}
                        onChange={() => toggle(`heading:${activePanel.id}:${section.id}`)}
                        className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                      />
                    )}
                    {section.heading}
                  </label>
                )}

                {section.kind === "chip" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {section.items.map((item) => {
                      const chip = item as ToolboxChipItem
                      const active = checked[item.id]
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggle(item.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                            active ? CHIP_ACTIVE_CLASS[chip.activeColor] : "border-border-subtle text-white/40 hover:bg-inset"
                          }`}
                        >
                          {active ? "✓" : "✕"} {item.label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {section.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-white/70 hover:bg-inset"
                      >
                        <input
                          type="checkbox"
                          checked={checked[item.id] ?? false}
                          onChange={() => toggle(item.id)}
                          className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
