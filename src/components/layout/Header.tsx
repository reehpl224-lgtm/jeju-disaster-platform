import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { IS_STAGING } from "../../data/appMode"
import { audit } from "../../data/auditLog"
import { login, logout, type MockUser } from "../../data/mockAuth"
import { useRolePolicy } from "../../data/roles"
import { canAccess, ROLES, roleLabel } from "../../data/rolesLogic"
import { useServiceStatusCards } from "../../data/useServiceStatusCards"
import { disasterAlerts } from "../../data/mockIncidents"
import { useRainfallAlerts } from "../../data/useRainfallAlerts"
import { RiskBadge } from "../ui/RiskBadge"
import { getDominantRiskLevel, riskStyles } from "../ui/riskStyles"
import { DemoDataMenu } from "./DemoDataMenu"

const DASHBOARD_TABS = [
  { key: "summary", label: "종합 상황" },
  { key: "gis", label: "GIS 상황" },
  { key: "cctv", label: "CCTV" },
] as const
type DashboardTabKey = (typeof DASHBOARD_TABS)[number]["key"]

// 서비스 도메인 메뉴 — 순서는 통합 대시보드 하단 서비스 카드(mockDashboard.serviceStatusCards)와 동일
const SERVICE_NAV = [
  { to: "/heavy-rain", label: "호우", icon: "☔" },
  { to: "/typhoon", label: "태풍", icon: "🌀" },
  // [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 화면에서 뺌 — 복원하려면 아래 주석을 해제
  // { to: "/heat", label: "폭염 대응", icon: "🔆" },
  // { to: "/wildfire", label: "산불", icon: "🔥" },
  { to: "/tsunami", label: "지진해일", icon: "🛟" },
  { to: "/snow", label: "대설", icon: "❄️" },
  { to: "/river", label: "하천범람", icon: "🏞️" },
  { to: "/aqua", label: "저염분 고수온", icon: "🌡️" },
  { to: "/coast", label: "연안 안전관리", icon: "🌊" },
]
const OPS_NAV = [
  { to: "/events", label: "공통 이벤트", icon: "🧩" },
  { to: "/approvals", label: "통합 결재함", icon: "✅" },
  { to: "/esop", label: "e-SOP 대응", icon: "📑" },
  { to: "/criteria", label: "위험 단계 조건", icon: "📐" },
  { to: "/scenarios", label: "상황판단 시나리오", icon: "🎬" },
  { to: "/pilot-status", label: "실증서비스 구현 현황", icon: "🧪" },
  { to: "/propagation", label: "상황전파·보고체계", icon: "📡" },
  { to: "/monitoring", label: "시스템 상태", icon: "🖥️" },
  { to: "/data-systems", label: "데이터 시스템 연계현황", icon: "🗄️" },
  { to: "/city-systems", label: "행정시 전용 시스템", icon: "🏙️" },
  { to: "/data-usage", label: "데이터 사용 명세", icon: "🗂️" },
  { to: "/integration", label: "연계 오류·검증", icon: "🛠️" },
  { to: "/mock-api", label: "Mock API", icon: "🧪" },
  { to: "/dummy-data", label: "더미데이터", icon: "📥" },
  { to: "/panel-input", label: "패널 입력", icon: "✏️" },
  { to: "/roles", label: "역할·권한", icon: "🔐" },
  { to: "/audit", label: "이용 이력", icon: "🧾" },
  { to: "/reports", label: "이력·보고서", icon: "📋" },
  { to: "/demo-version", label: "데모버전", icon: "🏷️" },
]

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
  const serviceStatusCards = useServiceStatusCards()
  const rainAlerts = useRainfallAlerts()
  const policy = useRolePolicy()
  const allowed = (to: string) => canAccess(user.role, to, policy)
  const alerts = [...disasterAlerts, ...rainAlerts]
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clock = useClock()
  const [openMenu, setOpenMenu] = useState<"menu" | "notif" | "demo" | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const onDashboard = location.pathname === "/dashboard"
  const did = params.get("did") === "1"
  const didQ = did ? "&did=1" : ""
  const activeTab = (params.get("tab") as DashboardTabKey | null) ?? "summary"
  const userLabel = `${user.org.replace("제주특별자치도 ", "")} ${user.name} 님`
  // 서비스 카드 id와 도메인 경로("/" + id)가 일치 — 도메인 메뉴 옆에 현재 최고 위험 등급 점을 붙인다.
  // 카드와 같은 구독 값을 사용해 입력·특보 갱신을 따라간다
  const domainRisk = new Map(serviceStatusCards.map((card) => [`/${card.id}`, getDominantRiskLevel(card.counts)]))

  // 화면이 바뀌면 열려 있던 메뉴를 닫는다 — effect 안에서 setState 하지 않고 렌더 중에 이전 경로와 비교한다
  const routeKey = `${location.pathname}${location.search}`
  const [seenRoute, setSeenRoute] = useState(routeKey)
  if (seenRoute !== routeKey) {
    setSeenRoute(routeKey)
    setOpenMenu(null)
  }

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

  // 역할 체험(데모) — 그 역할의 체험 계정으로 다시 로그인해 기본 화면으로 간다
  function switchRole(account: string, home: string) {
    audit("접속", "역할 체험 전환", account)
    login(account)
    window.location.assign(home)
  }

  // DID 모드 — 종합상황 → GIS → CCTV 탭을 30초마다 돌려 보여 주고, Esc로 나간다
  useEffect(() => {
    if (!did) return
    const keys = DASHBOARD_TABS.map((t) => t.key)
    const timer = setInterval(() => {
      const cur = keys.indexOf((new URLSearchParams(window.location.search).get("tab") as DashboardTabKey | null) ?? "summary")
      navigate(`/dashboard?tab=${keys[(cur + 1) % keys.length]}&did=1`, { replace: true })
    }, 30_000)
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && navigate(`/dashboard?tab=${activeTab}`, { replace: true })
    window.addEventListener("keydown", onEsc)
    return () => {
      clearInterval(timer)
      window.removeEventListener("keydown", onEsc)
    }
  }, [did, navigate, activeTab])

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="header" ref={wrapRef}>
      <div className="header__brand">
        <Link to="/dashboard" aria-label="제주 재난 대응 플랫폼 프로토타입" style={{ display: "flex", alignItems: "center" }}>
          <img src="/jeju_w_ci.svg" alt="" className="header__logo" aria-hidden="true" style={{ width: "auto", objectFit: "contain" }} />
          <span className="header__title">제주 재난 대응 플랫폼 프로토타입</span>
        </Link>
        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: "var(--foreground-subtle)", whiteSpace: "nowrap" }}>
          Demo V0.1
        </span>
        {IS_STAGING && (
          <span
            title="스테이징 환경 — 임의의 값(샘플)이 보입니다"
            style={{ marginLeft: 6, padding: "2px 8px", border: "1px solid var(--risk-caution)", borderRadius: 9999, fontSize: 12, fontWeight: 700, color: "var(--risk-caution)", whiteSpace: "nowrap" }}
          >
            데모 스테이징
          </span>
        )}
        <p className="header__clock">
          {/* 좁은 화면(1280px 미만)에선 날짜를 숨기고 시각만 — demo10.css 헤더 축소 규칙 */}
          <span className="header__clock-date">{clock.slice(0, 11)}</span>
          {clock.slice(11)}
        </p>
        <nav className="header__nav">
          <ul>
            {(allowed("/dashboard") ? DASHBOARD_TABS : []).map((tab) => (
              <li key={tab.key}>
                <Link
                  to={`/dashboard?tab=${tab.key}${didQ}`}
                  aria-current={onDashboard && activeTab === tab.key ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="header__user">
        {did && (
          <Link to={`/dashboard?tab=${activeTab}`} className="did-exit btn btn--ghost btn--pill" style={{ height: 32, padding: "0 .75rem", fontSize: 12 }}>
            DID 종료 (Esc)
          </Link>
        )}
        <a href="/vlm" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--pill" style={{ height: 32, padding: "0 .75rem", fontSize: 12 }}>
          VLM
        </a>
        <a href="/ax-hub" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--pill" style={{ height: 32, padding: "0 .75rem", fontSize: 12 }}>
          AX HUB
        </a>
        <DemoDataMenu open={openMenu === "demo"} onToggle={() => setOpenMenu((v) => (v === "demo" ? null : "demo"))} />
        <p title={`역할: ${roleLabel(user.role)}`}>
          {userLabel}
          <small style={{ marginLeft: 6, opacity: 0.6, fontWeight: 500 }}>{roleLabel(user.role)}</small>
        </p>
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
            {alerts.length > 0 && (
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
                {alerts.length}
              </span>
            )}
          </button>
          {openMenu === "notif" && (
            <div className="menu" style={{ top: 48, right: 0, width: 320, maxHeight: 420, overflowY: "auto" }}>
              <p style={{ padding: "4px 12px 8px", fontSize: 12, color: "var(--foreground-subtle)", fontWeight: 700 }}>
                발효중 특보 · 알림
              </p>
              {alerts.length === 0 ? (
                <p style={{ padding: 16, textAlign: "center", color: "var(--foreground-subtle)", fontSize: 12 }}>
                  새 알림이 없습니다.
                </p>
              ) : (
                <ul>
                  {alerts.map((alert) => {
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
                        {/* 이동할 화면이 없는 특보는 링크처럼 보이지 않게 그냥 내용만 보여준다(예전엔 href="#" 빈 링크) */}
                        {alert.href ? (
                          <Link to={alert.href}>{body}</Link>
                        ) : (
                          <div style={{ display: "flex", padding: ".5rem .75rem" }}>{body}</div>
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
          {SERVICE_NAV.filter((item) => allowed(item.to)).map((item) => {
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
          {OPS_NAV.filter((item) => allowed(item.to)).map((item) => (
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
            <Link to="/dashboard?tab=summary&did=1">
              <span aria-hidden>🖥️</span>
              대형 상황판(DID) 모드
            </Link>
          </li>
          <li>
            <hr />
          </li>
          <li>
            <p style={{ padding: "4px 12px", fontSize: 11, color: "var(--foreground-subtle)", fontWeight: 700 }}>역할 체험(데모)</p>
          </li>
          {ROLES.map((r) => (
            <li key={r.id}>
              <button type="button" className="menu__action" aria-current={user.role === r.id ? "true" : undefined} onClick={() => switchRole(r.demoAccount, r.home)}>
                {user.role === r.id ? "● " : "○ "}
                {r.label}
              </button>
            </li>
          ))}
          <li>
            <hr />
          </li>
          <li>
            <button type="button" className="menu__action" onClick={handleLogout}>
              로그아웃
            </button>
          </li>
        </ul>
      )}
    </header>
  )
}
