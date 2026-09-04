import { NavLink } from "react-router-dom"

interface DomainSubNavItem {
  to: string
  label: string
  end?: boolean
}

export function DomainSubNav({ items }: { items: DomainSubNavItem[] }) {
  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-border-subtle pb-3">
      {items.map((item) => (
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
