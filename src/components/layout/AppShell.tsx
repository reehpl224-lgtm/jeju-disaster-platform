import { useLayoutEffect } from "react"
import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { Crumbs, DomainSidebar } from "./DomainSidebar"
import { currentLabel, findDomain } from "./domainSidebarUtils"
import { Header } from "./Header"
import type { MockUser } from "../../data/mockAuth"

/** 스크롤이 생기는 본문 영역 — 화면(경로)이나 탭(?tab=…)이 바뀌면 이 영역들을 맨 위로 되돌린다 */
const SCROLL_AREAS = ".page-content, .panel__scroll"

/**
 * 다른 페이지로 옮기거나 탭을 바꾸면 이전 화면에서 내려 둔 스크롤 위치가 남아 중간부터 보이던 것을 막는다.
 * 경로와 검색값(?tab=…)이 바뀔 때마다 창과 본문·패널의 스크롤을 맨 위로 올린다.
 */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll<HTMLElement>(SCROLL_AREAS).forEach((el) => {
      el.scrollTop = 0
    })
  }, [pathname, search])
  return null
}

const BOARD_PATHS = ["/dashboard", "/heavy-rain", "/typhoon", /* "/heat", "/wildfire", */ "/tsunami", "/snow", "/river", "/aqua", "/coast"]

/**
 * demo-10 클론 셸 — 좌측 사이드바 없이 72px 헤더 + 본문.
 * 대시보드와 도메인 첫 화면은 지도 전면형 상황판이라 본문이 뷰포트 높이를 그대로 채운다(.stage).
 * 도메인 하위 화면은 클론의 "사이드바 + 콘텐츠" 틀(도메인 메뉴 사이드바 + 자체 스크롤 본문),
 * 그 외 화면은 헤더 아래에서 자체 스크롤한다.
 */
export function AppShell({ user }: { user: MockUser }) {
  const { pathname } = useLocation()
  // 대형 상황판(DID) 모드 — ?did=1. 조작 메뉴를 감추고 화면을 키워 멀리서 보게 한다(요구사항 '역할별 화면·운영환경 대응')
  const did = useSearchParams()[0].get("did") === "1"
  const isBoard = BOARD_PATHS.includes(pathname)
  const domain = isBoard ? undefined : findDomain(pathname)

  return (
    <div className={did ? "app app--did" : "app"}>
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <ScrollToTop />
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
