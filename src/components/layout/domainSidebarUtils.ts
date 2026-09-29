import { AQUA_NAV } from "../../pages/aqua/aquaNav"
import { COAST_NAV } from "../../pages/coast/coastNav"
import { HEAT_NAV } from "../../pages/heat/heatNav"
import { HEAVY_RAIN_NAV } from "../../pages/heavyrain/heavyRainNav"
import { RIVER_NAV } from "../../pages/river/riverNav"
import { TYPHOON_NAV } from "../../pages/typhoon/typhoonNav"

export interface NavItem {
  to: string
  label: string
  end?: boolean
  /** 별도 메뉴 없이 이 항목 아래로 묶이는 하위 화면 경로 */
  also?: string[]
}

export const underPath = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

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

/** 현재 경로에 해당하는 하위 화면 이름 — 사이드바 메뉴 정의에서 가장 긴 접두사 일치 */
export function currentLabel(domain: NonNullable<ReturnType<typeof findDomain>>, pathname: string) {
  const all: NavItem[] = [...domain.items, { to: `${domain.prefix}/dashboard`, label: "상세 대시보드" }]
  const hit = all
    .flatMap((i) => [i.to, ...(i.also ?? [])].map((path) => ({ path, label: i.label })))
    .filter((c) => underPath(pathname, c.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return hit?.label ?? ""
}

