import { useState } from "react"
import { RiskBadge } from "./RiskBadge"
import { disasterAlerts, disasterIncidents } from "../../data/mockIncidents"

function formatHM(iso: string) {
  return iso.slice(11, 16)
}

type Tab = "timeline" | "advisory"

export function GisTimelinePanel() {
  const [tab, setTab] = useState<Tab>("timeline")

  return (
    <div className="absolute right-2 bottom-2 z-10 max-h-[calc(100%-16px)] w-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel/95 p-3 shadow-xl">
      <div className="mb-2 flex gap-1 border-b border-border-subtle pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab("timeline")}
          className={`rounded-full px-2.5 py-1 ${tab === "timeline" ? "bg-accent text-black" : "text-white/50 hover:bg-inset"}`}
        >
          타임라인
        </button>
        <button
          type="button"
          onClick={() => setTab("advisory")}
          className={`rounded-full px-2.5 py-1 ${tab === "advisory" ? "bg-accent text-black" : "text-white/50 hover:bg-inset"}`}
        >
          발효중 특보
        </button>
      </div>

      {tab === "timeline" ? (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {disasterIncidents.map((incident) => (
            <li key={incident.id} className="py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white/60">{formatHM(incident.reportedAt)}</span>
                <RiskBadge level={incident.severity} label={incident.status} />
              </div>
              <p className="mt-0.5 text-white/80">
                [{incident.type}] {incident.title}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {disasterAlerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <RiskBadge level={alert.level} label={alert.title} />
                <span className="text-white/35">
                  {formatHM(alert.issuedAt)}~{formatHM(alert.expiresAt)}
                </span>
              </div>
              <p className="mt-1.5 text-white/50">
                {alert.target} · {alert.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
