import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { disasterAlerts } from "../../data/mockIncidents"
import { overallStatus } from "../../data/mockMonitoring"
import { RiskBadge } from "../ui/RiskBadge"

// 브레드크럼 라벨 — Sidebar 메뉴 라벨과 동일하게 유지, sub는 Figma Make 디자인 스펙의 문구를 따름
const ROUTE_META: Record<string, { label: string; sub: string }> = {
  "/dashboard": { label: "통합 대시보드", sub: "GIS 상황" },
  "/heavy-rain": { label: "호우", sub: "실시간 강수" },
  "/typhoon": { label: "태풍", sub: "태풍 경로·영향" },
  "/heat": { label: "폭염 대응", sub: "열섬·온도" },
  "/river": { label: "하천범람", sub: "수위·수문" },
  "/aqua": { label: "저염분 고수온", sub: "양식장·부이" },
  "/coast": { label: "연안 안전관리", sub: "해안·파고" },
  "/propagation": { label: "상황전파·보고체계", sub: "전파 이력" },
  "/monitoring": { label: "시스템 상태", sub: "헬스체크" },
  "/reports": { label: "이력·보고서", sub: "이벤트 이력" },
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function TopBar() {
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)
  const now = useClock()

  const pad = (n: number) => String(n).padStart(2, "0")
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const matchedPath = Object.keys(ROUTE_META).find((path) => location.pathname.startsWith(path))
  const route = matchedPath ? ROUTE_META[matchedPath] : ROUTE_META["/dashboard"]
  const systemNormal = overallStatus.status === "정상"

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border-subtle bg-base px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="truncate font-semibold text-white">{route.label}</span>
        <span className="shrink-0 text-white/20">›</span>
        <span className="truncate text-xs text-white/40">{route.sub}</span>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
            systemNormal ? "border-accent/25 bg-accent-soft" : "border-risk-warning/35 bg-risk-warning-bg"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${systemNormal ? "bg-accent animate-pulse" : "bg-risk-warning"}`} />
          <span className={`text-[11px] font-medium ${systemNormal ? "text-accent" : "text-risk-warning"}`}>
            시스템 {overallStatus.status}
          </span>
        </div>
        {disasterAlerts.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-risk-alert/35 bg-risk-alert-bg px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-alert" />
            <span className="text-[11px] font-medium text-risk-alert">경보 활성 {disasterAlerts.length}건</span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden flex-col items-end sm:flex">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-white/80">{timeStr}</span>
          <span className="text-[10px] text-white/30">{dateStr}</span>
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-1.5 hover:bg-inset"
            aria-label="알림"
          >
            🔔
            {disasterAlerts.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-risk-danger text-[10px] font-bold text-white">
                {disasterAlerts.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-border-subtle bg-panel py-2 shadow-panel">
              <p className="px-3 pb-2 text-xs font-semibold text-white/40">발효중 특보 · 알림</p>
              {disasterAlerts.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-white/30">새 알림이 없습니다.</p>
              ) : (
                <ul className="flex max-h-80 flex-col divide-y divide-border-subtle overflow-y-auto">
                  {disasterAlerts.map((alert) => (
                    <li key={alert.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white/85">{alert.title}</p>
                        <RiskBadge level={alert.level} />
                      </div>
                      <p className="mt-1 text-xs text-white/45">{alert.message}</p>
                      <p className="mt-1 text-[11px] text-white/30">
                        {alert.target} · {alert.issuedAt.slice(0, 16).replace("T", " ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
