import { Outlet, useLocation } from "react-router-dom"
import { Crumbs, DomainSidebar } from "./DomainSidebar"
import { currentLabel, findDomain } from "./domainSidebarUtils"
import { Header } from "./Header"
import type { MockUser } from "../../data/mockAuth"

const BOARD_PATHS = ["/dashboard", "/heavy-rain", "/typhoon", "/heat", "/wildfire", "/tsunami", "/snow", "/river", "/aqua", "/coast"]

/**
 * demo-10 클론 셸 — 좌측 사이드바 없이 72px 헤더 + 본문.
 * 대시보드와 도메인 첫 화면은 지도 전면형 상황판이라 본문이 뷰포트 높이를 그대로 채운다(.stage).
 * 도메인 하위 화면은 클론의 "사이드바 + 콘텐츠" 틀(도메인 메뉴 사이드바 + 자체 스크롤 본문),
 * 그 외 화면은 헤더 아래에서 자체 스크롤한다.
 */
export function AppShell({ user }: { user: MockUser }) {
  const { pathname } = useLocation()
  const isBoard = BOARD_PATHS.includes(pathname)
  const domain = isBoard ? undefined : findDomain(pathname)

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <Header user={user} />
      {isBoard ? (
        <Outlet />
      ) : domain ? (
        <div className="shell">
          <DomainSidebar domain={domain} />
          <main className="content page-content" id="main-content" tabIndex={-1} style={{ paddingRight: 10 }}>
            <Crumbs items={["홈", domain.title, currentLabel(domain, pathname)]} />
            <Outlet />
          </main>
        </div>
      ) : (
        <main id="main-content" tabIndex={-1} className="page-content min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      )}
    </div>
  )
}
