import { NavLink } from "react-router-dom"
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
}

/** 도메인 경로 접두사 → 사이드바 제목·메뉴. 첫 항목("대시보드"/"홈")은 지도 상황판, 그 아래에 기존 상세 대시보드를 둔다 */
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
  const items: NavItem[] = [
    domain.items[0],
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
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end ?? item.to.endsWith("/dashboard")}>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  )
}
