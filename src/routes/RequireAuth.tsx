import { Navigate, useLocation } from "react-router-dom"
import { getCurrentUser } from "../data/mockAuth"
import { AppShell } from "../components/layout/AppShell"

export function RequireAuth() {
  const user = getCurrentUser()
  const location = useLocation()

  if (!user) {
    // 로그인 후 원래 요청한 화면(예: 새 창으로 연 상세 화면)으로 돌아가도록 요청 경로를 넘긴다
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (user.role === "restricted") {
    return <Navigate to="/403" replace />
  }

  return <AppShell user={user} />
}
