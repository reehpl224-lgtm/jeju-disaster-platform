import { Card } from "../components/ui/Card"
import { RiskBadge } from "../components/ui/RiskBadge"
import {
  apiLinks,
  connectionSummary,
  incidentLog,
  jointResponseLog,
  monitoringActionLog,
  monitoringLastSyncedAt,
  overallStatus,
  sensorGroups,
  serviceHealth,
} from "../data/mockMonitoring"

const INCIDENT_ICON: Record<(typeof incidentLog)[number]["level"], string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🔵",
}

const SERVICE_STATUS_LEVEL: Record<(typeof serviceHealth)[number]["status"], "safe" | "caution" | "danger"> = {
  normal: "safe",
  warning: "caution",
  down: "danger",
}

const API_STATUS_LEVEL: Record<(typeof apiLinks)[number]["status"], "safe" | "caution" | "danger"> = {
  normal: "safe",
  delayed: "caution",
  down: "danger",
}

export function MonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">시스템 모니터링</h1>
          <p className="text-xs text-white/35">마지막 갱신: {monitoringLastSyncedAt}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
        >
          ↻ 새로고침
        </button>
      </div>

      <Card title="전체 운영 상태">
        <div className="flex items-center gap-3">
          <RiskBadge level="safe" label={overallStatus.status} />
          <p className="text-sm text-white/50">
            서비스 {overallStatus.normalServices} / 장애 {overallStatus.downServices} / 경고{" "}
            {overallStatus.warningServices}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connectionSummary.map((item) => (
          <Card key={item.id}>
            <p className="text-xs font-medium text-white/40">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-white">
              {"percent" in item ? `${item.percent}%` : item.status}
            </p>
            <p className="mt-1 text-xs text-white/35">{item.detail}</p>
          </Card>
        ))}
      </div>

      <Card title="이상·장애 알림">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {incidentLog.map((incident) => (
            <li key={incident.id} className="flex gap-3 py-3">
              <span className="text-lg leading-none">{INCIDENT_ICON[incident.level]}</span>
              <div>
                <p className="text-sm font-semibold text-white/80">{incident.title}</p>
                <p className="text-xs text-white/35">{incident.detail}</p>
                <p className="text-xs text-white/35">{incident.impact}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="데이터 수집원 및 센서 연결 상태">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sensorGroups.map((group) => (
            <div key={group.id} className="rounded-lg border border-border-subtle p-3">
              <p className="text-sm font-semibold text-white/80">{group.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <RiskBadge level="safe" label={`정상 ${group.normal}`} />
                <RiskBadge level="caution" label={`경고 ${group.warning}`} />
                <RiskBadge level="offline" label={`오프라인 ${group.offline}`} />
              </div>
              <p className="mt-2 text-[11px] text-white/35">마지막 갱신: {group.lastSync}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="GIS·AI 분석 서비스 처리 상태">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-white/35">
                <th className="pb-2 font-medium">서비스명</th>
                <th className="pb-2 font-medium">유형</th>
                <th className="pb-2 font-medium">상태</th>
                <th className="pb-2 font-medium">지연</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {serviceHealth.map((service) => (
                <tr key={service.id}>
                  <td className="py-2 font-medium text-white/80">{service.name}</td>
                  <td className="py-2 text-white/40">{service.type}</td>
                  <td className="py-2">
                    <RiskBadge level={SERVICE_STATUS_LEVEL[service.status]} />
                  </td>
                  <td className="py-2 text-white/40">{service.delay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="연계 API 운영 현황">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-white/35">
                <th className="pb-2 font-medium">API 명칭</th>
                <th className="pb-2 font-medium">기관</th>
                <th className="pb-2 font-medium">상태</th>
                <th className="pb-2 font-medium">응답</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {apiLinks.map((api) => (
                <tr key={api.id}>
                  <td className="py-2 font-medium text-white/80">{api.name}</td>
                  <td className="py-2 text-white/40">{api.agency}</td>
                  <td className="py-2">
                    <RiskBadge level={API_STATUS_LEVEL[api.status]} />
                  </td>
                  <td className="py-2 text-white/40">{api.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="기관별 공동 대응 상태">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {jointResponseLog.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between py-2.5 text-sm">
                <p className="font-medium text-white/80">{agency.agency}</p>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${agency.status === "down" ? "text-risk-danger" : "text-risk-safe"}`}>
                    {agency.status === "down" ? "⚠ 장애" : "● 연결"}
                  </p>
                  <p className="text-[11px] text-white/35">{agency.lastAction}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="주요 조치 이력">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {monitoringActionLog.map((log) => (
              <li key={log.id} className="flex gap-3 py-2.5 text-sm">
                <span className="w-12 shrink-0 text-xs text-white/35">{log.time}</span>
                <p className="text-white/70">{log.title}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
