import { NavLink } from "react-router-dom"

const NAV_ITEMS = [
  { to: "/dashboard", label: "통합 대시보드", icon: "🗺️" },
  { to: "/aqua", label: "양식장 대응", icon: "🌡️" },
  { to: "/coast", label: "연안 안전", icon: "🌊" },
  { to: "/river", label: "하천 범람", icon: "🌧️" },
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
