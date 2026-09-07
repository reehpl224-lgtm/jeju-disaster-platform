import { Link } from "react-router-dom"
import { RiskBadge } from "./RiskBadge"
import { WeatherTimeline } from "./WeatherTimeline"
import { GIS_RAIL_ITEMS, type GisRailKey } from "./GisIconRail"
import { agencyStatuses, dashboardSensors, recentActions, weatherTimeline, weatherTimelineNow } from "../../data/mockDashboard"
import { disasterIncidents, disasterResponseTeams, shelters } from "../../data/mockIncidents"

interface GisSidePanelProps {
  activeKey: GisRailKey
  onClose: () => void
}

export function GisSidePanel({ activeKey, onClose }: GisSidePanelProps) {
  const title = GIS_RAIL_ITEMS.find((item) => item.key === activeKey)?.label ?? ""

  return (
    <div className="absolute left-[72px] top-2 z-10 max-h-[calc(100%-16px)] w-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel/95 p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-2">
        <p className="text-sm font-bold text-white/90">{title}</p>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white" aria-label="닫기">
          ✕
        </button>
      </div>

      {activeKey === "sensor" && (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {dashboardSensors.map((sensor) => (
            <li key={sensor.id} className="flex items-center justify-between gap-2 py-2 text-xs">
              <div>
                <p className="font-medium text-white/80">{sensor.name}</p>
                <p className="text-white/35">{sensor.location}</p>
              </div>
              <RiskBadge level={sensor.status} label={sensor.value} />
            </li>
          ))}
        </ul>
      )}

      {activeKey === "broadcast" && (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {recentActions.map((action) => (
            <li key={action.id} className="py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white/80">{action.title}</p>
                <span className="shrink-0 text-white/35">{action.time}</span>
              </div>
              <p className="mt-0.5 text-white/35">
                {action.owner} · {action.note}
              </p>
            </li>
          ))}
        </ul>
      )}

      {activeKey === "response" && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold text-white/40">기관별 대응 상태</p>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {agencyStatuses.map((agency) => (
                <li key={agency.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <p className="text-white/80">{agency.agency}</p>
                  <span className={agency.status === "down" ? "text-risk-danger" : "text-risk-safe"}>
                    {agency.status === "down" ? "⚠ 장애" : "● 연결"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold text-white/40">현장 대응팀</p>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {disasterResponseTeams.map((team) => (
                <li key={team.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <p className="text-white/80">{team.name}</p>
                  <RiskBadge level={team.status === "출동중" ? "info" : "offline"} label={team.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeKey === "asset" && (
        <ul className="flex flex-col gap-2">
          {shelters.map((shelter) => (
            <li key={shelter.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white/80">{shelter.name}</p>
                <RiskBadge level="safe" label={shelter.status} />
              </div>
              <p className="mt-1 text-white/35">{shelter.address}</p>
              <p className="mt-1 text-white/50">
                수용 {shelter.currentOccupancy} / {shelter.capacity}명
              </p>
            </li>
          ))}
        </ul>
      )}

      {activeKey === "report" && (
        <div className="flex flex-col gap-2 text-xs">
          <p className="text-white/50">종료된 사건의 상세 보고서를 조회합니다.</p>
          <Link
            to="/reports"
            className="inline-flex items-center justify-center rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            이력·보고서 전체 조회 →
          </Link>
        </div>
      )}

      {activeKey === "timeline" && (
        <div className="flex flex-col gap-3">
          <WeatherTimeline points={weatherTimeline} now={weatherTimelineNow} />
          <ul className="flex flex-col divide-y divide-border-subtle">
            {disasterIncidents.map((incident) => (
              <li key={incident.id} className="py-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <RiskBadge level={incident.severity} />
                  <p className="font-medium text-white/80">
                    [{incident.type}] {incident.title}
                  </p>
                </div>
                <p className="mt-0.5 text-white/35">
                  {incident.region} · {incident.status}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(activeKey === "messenger" || activeKey === "news") && (
        <p className="py-6 text-center text-xs text-white/30">2단계 상세 구현 예정 — 준비 중입니다.</p>
      )}
    </div>
  )
}
