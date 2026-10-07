import { NavLink, useLocation } from "react-router-dom"
import { findDomain, underPath, type NavItem } from "./domainSidebarUtils"

/** 도메인 하위 화면의 좌측 사이드바 — demo-10 클론의 사이드바 + 콘텐츠 틀(.shell / .sidebar / .tree) */
export function DomainSidebar({ domain }: { domain: NonNullable<ReturnType<typeof findDomain>> }) {
  const { pathname } = useLocation()
  const items: NavItem[] = [
    // "홈"(GIS 보드) 메뉴 — "상세 대시보드"가 새 창으로 열리게 되면서 필요성이 낮아져 주석 처리(2026-09-28 사용자 요청)
    // domain.items[0],
    { to: `${domain.prefix}/dashboard`, label: "상세 대시보드" },
    ...domain.items.slice(1),
  ]
  return (
    <aside className="sidebar">
      <div className="sidebar__search" style={{ paddingBottom: ".75rem" }}>
        <p style={{ fontSize: 18, fontWeight: 700 }}>
          <span aria-hidden>{domain.icon}</span> {domain.title}
        </p>
        <p className="label">화면 메뉴</p>
      </div>
      <ul className="tree">
        {items.map((item) => {
          const isDashboardDetail = item.to.endsWith("/dashboard")
          const underGrouped = item.also?.some((p) => underPath(pathname, p)) ?? false
          return (
            <li key={item.to}>
              {/* 사이드바는 상세 화면 창 안에만 있으므로 모든 메뉴가 그 창 안에서 이동한다 —
                  보드에서 상세 창을 여는 쪽(PanelParts의 DetailLink)이 창 분리를 담당(2026-09-28) */}
              <NavLink
                to={item.to}
                end={item.end ?? isDashboardDetail}
                className={({ isActive }) => (isActive || underGrouped ? "active" : undefined)}
              >
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export function Crumbs({ items }: { items: string[] }) {
  const shown = items.filter(Boolean)
  return (
    <p className="crumbs">
      {shown.map((label, i) => (
        <span key={label + i}>
          {i > 0 && <span aria-hidden> › </span>}
          {i === shown.length - 1 ? <b>{label}</b> : label}
        </span>
      ))}
    </p>
  )
}
