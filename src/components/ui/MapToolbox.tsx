import { useState } from "react"

const TOOL_ITEMS = [
  { id: "weather", label: "기상·재난", defaultChecked: true },
  { id: "model", label: "기상모델", defaultChecked: false },
  { id: "risk", label: "재난위험도", defaultChecked: true },
  { id: "cctv", label: "CCTV·센서", defaultChecked: true },
  { id: "agency", label: "유관기관", defaultChecked: false },
]

export function MapToolbox() {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOOL_ITEMS.map((item) => [item.id, item.defaultChecked])),
  )

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="absolute right-2 top-2 z-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${
          open ? "border-accent bg-accent-soft text-accent" : "border-border-subtle bg-panel text-white/70 hover:bg-inset"
        }`}
        title="지도 도구"
      >
        🧰
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-40 rounded-lg border border-border-subtle bg-panel p-2 shadow-lg">
          <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/30">지도 도구</p>
          <ul className="flex flex-col gap-0.5">
            {TOOL_ITEMS.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-xs text-white/70 hover:bg-inset">
                  <input
                    type="checkbox"
                    checked={checked[item.id]}
                    onChange={() => toggle(item.id)}
                    className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                  />
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
