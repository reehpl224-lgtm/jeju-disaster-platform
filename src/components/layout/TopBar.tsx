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
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border-subtle bg-base px-4">
      <div className="flex flex-1 items-center gap-2">
        <input
          type="search"
          placeholder="검색"
          className="w-full max-w-sm rounded-full border border-border-subtle bg-inset px-3 py-1.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-accent"
        />
      </div>
      <div className="flex items-center gap-4 text-sm text-white/50">
        <span className="hidden sm:inline">갱신 시각 {stamp}</span>
        <button type="button" className="relative rounded-full p-1.5 hover:bg-inset" aria-label="알림">
          🔔
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-risk-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-inset"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
              {user.name.slice(0, 1)}
            </span>
            <span className="hidden text-left text-xs sm:block">
              <span className="block font-semibold text-white/80">{user.name}</span>
              <span className="block text-white/35">{user.org}</span>
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-border-subtle bg-panel py-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-inset"
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
