import { NavLink } from "react-router-dom"
import { pillClass } from "../ui/Pill"

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
          className={({ isActive }) => pillClass(isActive)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
