import type { RiskLevel } from "../../types/domain"
import { riskStyles } from "./riskStyles"

interface WeatherTimelineProps {
  points: { time: string; level: RiskLevel }[]
  now: string
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export function WeatherTimeline({ points, now }: WeatherTimelineProps) {
  const start = toMinutes(points[0].time)
  const end = toMinutes(points[points.length - 1].time)
  const nowMinutes = Math.min(Math.max(toMinutes(now), start), end)
  const nowPercent = ((nowMinutes - start) / (end - start)) * 100

  return (
    <div>
      <div className="relative">
        <div className="flex h-8 overflow-hidden rounded-lg">
          {points.map((p) => (
            <div key={p.time} className={`flex-1 ${riskStyles[p.level].dot} opacity-80`} />
          ))}
        </div>
        <div
          className="absolute -top-1.5 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${nowPercent}%` }}
        >
          <span className="h-2.5 w-2.5 rotate-45 border border-white/60 bg-white" />
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-white/35">
        {points.map((p) => (
          <span key={p.time}>{p.time}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
        <span className="font-semibold text-white/30">범례</span>
        <Legend level="danger" />
        <Legend level="alert" />
        <Legend level="warning" />
        <Legend level="caution" />
        <Legend level="safe" />
        <span className="ml-auto text-white/35">현재 {now}</span>
      </div>
    </div>
  )
}

function Legend({ level }: { level: RiskLevel }) {
  const style = riskStyles[level]
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}
