import type { ReactNode } from "react"

type PillSize = "sm" | "md"

const SIZE_CLASS: Record<PillSize, string> = {
  sm: "px-2.5 py-1",
  md: "px-3 py-1.5",
}

export function pillClass(active: boolean, size: PillSize = "md"): string {
  return `rounded-full ${SIZE_CLASS[size]} text-xs font-semibold transition ${
    active ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
  }`
}

interface PillProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  size?: PillSize
}

export function Pill({ active, onClick, children, size = "md" }: PillProps) {
  return (
    <button type="button" onClick={onClick} className={pillClass(active, size)}>
      {children}
    </button>
  )
}
