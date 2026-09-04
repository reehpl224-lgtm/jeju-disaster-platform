import type { AquaStage } from "../../types/aqua"

const STATUS_STYLE: Record<AquaStage["status"], string> = {
  완료: "border-risk-safe bg-risk-safe-bg text-risk-safe",
  "진행 중": "border-accent bg-accent-soft text-accent",
  대기: "border-border-subtle bg-inset text-white/35",
}

export function StageTracker({ stages }: { stages: AquaStage[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((stage) => (
        <div key={stage.step} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold ${STATUS_STYLE[stage.status]}`}
          >
            {stage.step}단계
          </div>
          <span className="text-[11px] text-white/50">{stage.label}</span>
          <span className="text-[10px] text-white/30">{stage.status}</span>
        </div>
      ))}
    </div>
  )
}
