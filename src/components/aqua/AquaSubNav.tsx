import { NavLink } from "react-router-dom"

const SUB_NAV = [
  { to: "/aqua", label: "홈", end: true },
  { to: "/aqua/data", label: "데이터 수집" },
  { to: "/aqua/prediction", label: "AI 예측" },
  { to: "/aqua/farms", label: "영향 양식장" },
  { to: "/aqua/alerts", label: "경보 승인" },
  { to: "/aqua/response", label: "e-SOP 대응" },
  { to: "/aqua/monitoring", label: "실시간 모니터링" },
]

export function AquaSubNav() {
  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-border-subtle pb-3">
      {SUB_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
