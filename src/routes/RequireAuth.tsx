import { Navigate, useLocation } from "react-router-dom"
import { getCurrentUser } from "../data/mockAuth"
import { useRolePolicy } from "../data/roles"
import { canAccess } from "../data/rolesLogic"
import { AppShell } from "../components/layout/AppShell"

export function RequireAuth() {
  const user = getCurrentUser()
  const location = useLocation()
  const policy = useRolePolicy()

  if (!user) {
    // 로그인 후 원래 요청한 화면(예: 새 창으로 연 상세 화면)으로 돌아가도록 요청 경로를 넘긴다
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (user.role === "restricted") {
    return <Navigate to="/403" replace />
  }

  // 역할별 접근 범위(화면·서비스) — 요구사항 '사용자·역할 관리'. 허용되지 않은 경로는 접근 권한 없음 화면으로 보낸다
  if (!canAccess(user.role, location.pathname, policy)) {
    return <Navigate to="/403" replace state={{ denied: location.pathname }} />
  }

  return <AppShell user={user} />
}
