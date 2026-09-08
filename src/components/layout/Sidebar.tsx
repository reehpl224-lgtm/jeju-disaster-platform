import { NavLink } from "react-router-dom"

// 순서: 사용자 지정(2026-09-08) — 통합 대시보드의 서비스 카드 순서(mockDashboard.ts)와 동일하게 유지
const NAV_ITEMS = [
  { to: "/dashboard", label: "통합 대시보드", icon: "🗺️" },
  { to: "/heavy-rain", label: "호우", icon: "☔" },
  { to: "/typhoon", label: "태풍", icon: "🌀" },
  { to: "/heat", label: "폭염 대응", icon: "🔆" },
  { to: "/river", label: "하천범람", icon: "🌧️" },
  { to: "/aqua", label: "저염분 고수온", icon: "🌡️" },
  { to: "/coast", label: "연안 안전관리", icon: "🌊" },
  { to: "/propagation", label: "상황전파·보고체계", icon: "📡" },
  { to: "/monitoring", label: "시스템 상태", icon: "🖥️" },
  { to: "/reports", label: "이력·보고서", icon: "📋" },
]

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border-subtle bg-panel md:block">
      <div className="flex h-14 items-center gap-2 border-b border-border-subtle px-4">
        <span className="text-lg">🚨</span>
        <span className="text-sm font-bold text-white">제주 재난 AX</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">주요 메뉴</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 border-l-2 px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-accent bg-inset text-accent"
                  : "border-transparent text-white/60 hover:bg-inset hover:text-white"
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
