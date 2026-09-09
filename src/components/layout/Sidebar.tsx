import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { logout, type MockUser } from "../../data/mockAuth"
import { serviceStatusCards } from "../../data/mockDashboard"
import { getDominantRiskLevel, riskStyles } from "../ui/riskStyles"

// 순서: 사용자 지정(2026-09-08) — 통합 대시보드의 서비스 카드 순서(mockDashboard.ts)와 동일하게 유지
// 그룹 구분(서비스/운영)은 Figma Make 디자인 스펙 반영
const SERVICE_NAV = [
  { to: "/dashboard", label: "통합 대시보드", icon: "🗺️" },
  { to: "/heavy-rain", label: "호우", icon: "☔" },
  { to: "/typhoon", label: "태풍", icon: "🌀" },
  { to: "/heat", label: "폭염 대응", icon: "🔆" },
  { to: "/river", label: "하천범람", icon: "🌧️" },
  { to: "/aqua", label: "저염분 고수온", icon: "🌡️" },
  { to: "/coast", label: "연안 안전관리", icon: "🌊" },
]
const OPS_NAV = [
  { to: "/propagation", label: "상황전파·보고체계", icon: "📡" },
  { to: "/monitoring", label: "시스템 상태", icon: "🖥️" },
  { to: "/reports", label: "이력·보고서", icon: "📋" },
]

// 서비스 카드(mockDashboard.ts)와 도메인 메뉴를 이어주는 키 — 경로에서 앞의 "/"만 떼면 카드 id와 일치
const domainRisk = new Map(
  serviceStatusCards.map((card) => [`/${card.id}`, getDominantRiskLevel(card.counts)]),
)

function NavSection({ label, items, onNav }: { label: string; items: typeof SERVICE_NAV; onNav?: () => void }) {
  return (
    <div className="mb-1">
      <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">{label}</p>
      {items.map((item) => {
        const risk = domainRisk.get(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-2 border-l-2 px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-accent bg-inset text-accent"
                  : "border-transparent text-white/60 hover:bg-inset hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span aria-hidden>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {risk && risk !== "safe" && !isActive && (
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${riskStyles[risk].dot}`}
                    style={{ boxShadow: `0 0 6px var(--color-risk-${risk})` }}
                    aria-hidden
                  />
                )}
              </>
            )}
          </NavLink>
        )
      })}
    </div>
  )
}

export function Sidebar({ user }: { user: MockUser }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border-subtle bg-panel md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border-subtle px-4">
        <span className="text-lg">🚨</span>
        <span className="text-sm font-bold text-white">제주 재난 AX</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <NavSection label="서비스" items={SERVICE_NAV} />
        <NavSection label="운영" items={OPS_NAV} />
      </nav>
      <div className="relative border-t border-border-subtle p-2">
        {menuOpen && (
          <div className="absolute bottom-full left-2 right-2 z-10 mb-1 rounded-lg border border-border-subtle bg-panel py-1 shadow-panel">
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-inset"
            >
              로그아웃
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-inset"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
            {user.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1 text-left text-xs">
            <span className="block truncate font-semibold text-white/80">{user.name}</span>
            <span className="block truncate text-white/35">{user.org}</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
