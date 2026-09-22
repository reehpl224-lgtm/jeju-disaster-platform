import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { logout, type MockUser } from "../../data/mockAuth"
import { serviceStatusCards } from "../../data/mockDashboard"
import { disasterAlerts } from "../../data/mockIncidents"
import { overallStatus } from "../../data/mockMonitoring"
import { RiskBadge } from "../ui/RiskBadge"
import { getDominantRiskLevel, riskStyles } from "../ui/riskStyles"

export const DASHBOARD_TABS = [
  { key: "summary", label: "종합 상황" },
  { key: "gis", label: "GIS 상황" },
  { key: "cctv", label: "CCTV" },
] as const
export type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"]

// 서비스 도메인 메뉴 — 순서는 통합 대시보드 하단 서비스 카드(mockDashboard.serviceStatusCards)와 동일
const SERVICE_NAV = [
  { to: "/heavy-rain", label: "호우", icon: "☔" },
  { to: "/typhoon", label: "태풍", icon: "🌀" },
  { to: "/heat", label: "폭염 대응", icon: "🔆" },
  { to: "/river", label: "하천범람", icon: "🏞️" },
  { to: "/aqua", label: "저염분 고수온", icon: "🌡️" },
  { to: "/coast", label: "연안 안전관리", icon: "🌊" },
]
const OPS_NAV = [
  { to: "/pilot-status", label: "실증서비스 구현 현황", icon: "🧪" },
  { to: "/propagation", label: "상황전파·보고체계", icon: "📡" },
  { to: "/monitoring", label: "시스템 상태", icon: "🖥️" },
  { to: "/data-systems", label: "데이터 시스템 연계현황", icon: "🗄️" },
  { to: "/reports", label: "이력·보고서", icon: "📋" },
]
const ROUTE_LABEL: Record<string, string> = Object.fromEntries(
  [...SERVICE_NAV, ...OPS_NAV].map((item) => [item.to, item.label]),
)

// 서비스 카드 id와 도메인 경로("/" + id)가 일치 — 도메인 메뉴 옆에 현재 최고 위험 등급 점을 붙인다
const domainRisk = new Map(serviceStatusCards.map((card) => [`/${card.id}`, getDominantRiskLevel(card.counts)]))

const RISK_TOTALS = (["danger", "alert", "warning"] as const).map((level) => ({
  level,
  count: serviceStatusCards.reduce((sum, card) => sum + (card.counts[level] ?? 0), 0),
}))

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** demo-10 클론의 72px 헤더 — 로고·시계·대시보드 탭·경보 요약·사용자·탑 메뉴 */
export function Header({ user }: { user: MockUser }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clock = useClock()
  const [openMenu, setOpenMenu] = useState<"menu" | "notif" | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const onDashboard = location.pathname === "/dashboard"
  const activeTab = (params.get("tab") as DashboardTabKey | null) ?? "summary"
  const sectionLabel = Object.entries(ROUTE_LABEL).find(([path]) => location.pathname.startsWith(path))?.[1]
  const systemNormal = overallStatus.status === "정상"
  const userLabel = `${user.org.replace("제주특별자치도 ", "")} ${user.name} 님`

  useEffect(() => {
    setOpenMenu(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="header" ref={wrapRef}>
      <div className="header__brand">
        <Link to="/dashboard" aria-label="제주 재난 AX" style={{ display: "flex", alignItems: "center" }}>
          <svg className="header__logo" viewBox="0 0 96 38" fill="none" aria-hidden="true">
            <text x="0" y="27" fontFamily="Pretendard, sans-serif" fontSize="26" fontWeight="800" fill="#fff">
              Je
            </text>
            <text x="32" y="27" fontFamily="Pretendard, sans-serif" fontSize="26" fontWeight="800" fill="var(--primary)">
              ju
            </text>
            <path d="M2 33h68" stroke="var(--quaternary)" strokeWidth="3" strokeLinecap="round" />
            <path d="M74 33h18" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="header__title">제주 재난 AX</span>
        </Link>
        <p className="header__clock">{clock}</p>
        <nav className="header__nav">
          <ul>
            {DASHBOARD_TABS.map((tab) => (
              <li key={tab.key}>
                <Link
                  to={`/dashboard?tab=${tab.key}`}
                  aria-current={onDashboard && activeTab === tab.key ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div
        className="header__spacer"
        style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: "1.25rem" }}
        aria-label="서비스 경보 요약"
      >
        {onDashboard ? (
          RISK_TOTALS.map(({ level, count }) => (
            <span key={level} className={`risk risk--${level}`}>
              {riskStyles[level].label} {count}
            </span>
          ))
        ) : (
          <span style={{ fontWeight: 700 }}>{sectionLabel ?? ""}</span>
        )}
        <span className={`risk ${systemNormal ? "risk--safe" : "risk--warning"}`}>시스템 {overallStatus.status}</span>
      </div>

      <div className="header__user">
        <p>{userLabel}</p>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="icon-btn"
            aria-label="알림"
            aria-expanded={openMenu === "notif"}
            data-open={openMenu === "notif" ? "" : undefined}
            onClick={() => setOpenMenu((v) => (v === "notif" ? null : "notif"))}
            style={{ position: "relative" }}
          >
            <span aria-hidden>🔔</span>
            {disasterAlerts.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  right: 2,
                  top: 2,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 9999,
                  background: "var(--risk-danger)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {disasterAlerts.length}
              </span>
            )}
          </button>
          {openMenu === "notif" && (
            <div className="menu" style={{ top: 48, right: 0, width: 320, maxHeight: 420, overflowY: "auto" }}>
              <p style={{ padding: "4px 12px 8px", fontSize: 12, color: "var(--foreground-subtle)", fontWeight: 700 }}>
                발효중 특보 · 알림
              </p>
              {disasterAlerts.length === 0 ? (
                <p style={{ padding: 16, textAlign: "center", color: "var(--foreground-subtle)", fontSize: 12 }}>
                  새 알림이 없습니다.
                </p>
              ) : (
                <ul>
                  {disasterAlerts.map((alert) => {
                    const body = (
                      <span style={{ display: "block", width: "100%" }}>
                        <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <b>{alert.title}</b>
                          <RiskBadge level={alert.level} />
                        </span>
                        <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--foreground-muted)" }}>
                          {alert.message}
                        </span>
                        <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--foreground-subtle)" }}>
                          {alert.target} · {alert.issuedAt.slice(0, 16).replace("T", " ")}
                        </span>
                      </span>
                    )
                    return (
                      <li key={alert.id}>
                        {alert.href ? (
                          <Link to={alert.href}>{body}</Link>
                        ) : (
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            {body}
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="탑 메뉴"
          aria-haspopup="menu"
          aria-expanded={openMenu === "menu"}
          aria-controls="top-menu"
          data-open={openMenu === "menu" ? "" : undefined}
          onClick={() => setOpenMenu((v) => (v === "menu" ? null : "menu"))}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {openMenu === "menu" && (
        <ul className="menu" id="top-menu">
          <li>
            <p style={{ padding: "4px 12px", fontSize: 11, color: "var(--foreground-subtle)", fontWeight: 700 }}>서비스</p>
          </li>
          {SERVICE_NAV.map((item) => {
            const risk = domainRisk.get(item.to)
            return (
              <li key={item.to}>
                <Link to={item.to}>
                  <span aria-hidden>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {risk && risk !== "safe" && (
                    <span className={`dot dot--${risk}`} title={`현재 최고 등급: ${riskStyles[risk].label}`} />
                  )}
                </Link>
              </li>
            )
          })}
          <li>
            <hr />
          </li>
          <li>
            <p style={{ padding: "4px 12px", fontSize: 11, color: "var(--foreground-subtle)", fontWeight: 700 }}>운영</p>
          </li>
          {OPS_NAV.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <hr />
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleLogout()
              }}
            >
              로그아웃
            </a>
          </li>
        </ul>
      )}
    </header>
  )
}
