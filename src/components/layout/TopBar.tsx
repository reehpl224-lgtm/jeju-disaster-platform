import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { logout, type MockUser } from "../../data/mockAuth"

export function TopBar({ user }: { user: MockUser }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex flex-1 items-center gap-2">
        <input
          type="search"
          placeholder="검색"
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
        />
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="hidden sm:inline">갱신 시각 {stamp}</span>
        <button type="button" className="relative rounded-full p-1.5 hover:bg-slate-100" aria-label="알림">
          🔔
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-risk-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {user.name.slice(0, 1)}
            </span>
            <span className="hidden text-left text-xs sm:block">
              <span className="block font-semibold text-slate-700">{user.name}</span>
              <span className="block text-slate-400">{user.org}</span>
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
