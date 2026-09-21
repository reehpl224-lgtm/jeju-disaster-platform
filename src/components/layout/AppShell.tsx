import { Outlet, useLocation } from "react-router-dom"
import { Header } from "./Header"
import type { MockUser } from "../../data/mockAuth"

const BOARD_PATHS = ["/dashboard", "/heavy-rain", "/typhoon", "/heat", "/river", "/aqua", "/coast"]

/**
 * demo-10 클론 셸 — 좌측 사이드바 없이 72px 헤더 + 본문.
 * 대시보드와 도메인 첫 화면은 지도 전면형 상황판이라 본문이 뷰포트 높이를 그대로 채우고(.stage),
 * 그 외 화면은 헤더 아래에서 자체 스크롤한다.
 */
export function AppShell({ user }: { user: MockUser }) {
  const { pathname } = useLocation()
  const isBoard = BOARD_PATHS.includes(pathname)

  return (
    <div className="app">
      <Header user={user} />
      {isBoard ? (
        <Outlet />
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      )}
    </div>
  )
}
