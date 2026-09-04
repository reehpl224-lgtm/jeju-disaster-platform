import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import type { MockUser } from "../../data/mockAuth"

export function AppShell({ user }: { user: MockUser }) {
  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
