import { NavLink, useLocation } from "react-router-dom"
import { AQUA_NAV } from "../../pages/aqua/aquaNav"
import { COAST_NAV } from "../../pages/coast/coastNav"
import { HEAT_NAV } from "../../pages/heat/heatNav"
import { HEAVY_RAIN_NAV } from "../../pages/heavyrain/heavyRainNav"
import { RIVER_NAV } from "../../pages/river/riverNav"
import { TYPHOON_NAV } from "../../pages/typhoon/typhoonNav"

interface NavItem {
  to: string
  label: string
  end?: boolean
  /** 별도 메뉴 없이 이 항목 아래로 묶이는 하위 화면 경로 */
  also?: string[]
}

const underPath = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

/** 도메인 경로 접두사 → 사이드바 제목·메뉴. items[0]("홈" — 지도 상황판)은 "상세 대시보드"가 새 창으로 열리게 되면서
 *  사이드바에서 주석 처리함(2026-09-28) — 아래 DomainSidebar의 items 구성부 참고 */
const DOMAINS: { prefix: string; title: string; icon: string; items: NavItem[] }[] = [
  { prefix: "/heavy-rain", title: "호우", icon: "☔", items: HEAVY_RAIN_NAV },
  { prefix: "/typhoon", title: "태풍", icon: "🌀", items: TYPHOON_NAV },
  { prefix: "/heat", title: "폭염 대응", icon: "🔆", items: HEAT_NAV },
  { prefix: "/river", title: "하천범람", icon: "🏞️", items: RIVER_NAV },
  { prefix: "/aqua", title: "저염분 고수온", icon: "🌡️", items: AQUA_NAV },
  { prefix: "/coast", title: "연안 안전관리", icon: "🌊", items: COAST_NAV },
]

export function findDomain(pathname: string) {
  return DOMAINS.find((d) => pathname === d.prefix || pathname.startsWith(`${d.prefix}/`))
}

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

/** 현재 경로에 해당하는 하위 화면 이름 — 사이드바 메뉴 정의에서 가장 긴 접두사 일치 */
export function currentLabel(domain: NonNullable<ReturnType<typeof findDomain>>, pathname: string) {
  const all: NavItem[] = [...domain.items, { to: `${domain.prefix}/dashboard`, label: "상세 대시보드" }]
  const hit = all
    .flatMap((i) => [i.to, ...(i.also ?? [])].map((path) => ({ path, label: i.label })))
    .filter((c) => underPath(pathname, c.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return hit?.label ?? ""
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
