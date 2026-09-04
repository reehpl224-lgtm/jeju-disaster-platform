import { Navigate } from "react-router-dom"
import { getCurrentUser } from "../data/mockAuth"
import { AppShell } from "../components/layout/AppShell"

export function RequireAuth() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === "restricted") {
    return <Navigate to="/403" replace />
  }

  return <AppShell user={user} />
}
