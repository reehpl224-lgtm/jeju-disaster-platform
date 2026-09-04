import type { AquaChecklistItem } from "../../types/aqua"

const STATUS_META: Record<AquaChecklistItem["status"], { icon: string; class: string }> = {
  완료: { icon: "✓", class: "text-risk-safe" },
  미완료: { icon: "!", class: "text-risk-caution" },
  실패: { icon: "✕", class: "text-risk-danger" },
  대기: { icon: "○", class: "text-white/30" },
}

export function ChecklistRow({ item, action }: { item: AquaChecklistItem; action?: React.ReactNode }) {
  const meta = STATUS_META[item.status]
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold ${meta.class}`}>
          {meta.icon}
        </span>
        <div>
          <p className="text-sm font-medium text-white/80">{item.label}</p>
          <p className="text-xs text-white/35">
            담당: {item.owner} {item.time !== "-" && `/ ${item.time}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${meta.class}`}>{item.status}</span>
        {action}
      </div>
    </div>
  )
}
