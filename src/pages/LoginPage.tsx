import { type FormEvent, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { getCurrentUser, login } from "../data/mockAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const existing = getCurrentUser()
  const [orgId, setOrgId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (existing) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!orgId.trim() || !password.trim()) {
      setError("기관 ID와 비밀번호를 입력해 주세요.")
      return
    }
    const user = login(orgId.trim())
    navigate(user.role === "restricted" ? "/403" : "/dashboard", { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <h1 className="text-lg font-bold text-slate-900">제주 재난 대응 플랫폼 로그인</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-slate-400">기관 계정으로 로그인</p>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">기관 ID</span>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="예: jeju-ax"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="비밀번호"
            />
          </label>

          {error && <p className="text-xs font-medium text-risk-danger">{error}</p>}

          <button
            type="submit"
            className="rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            로그인
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-px flex-1 bg-slate-200" />
            또는
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            SSO 로그인 (공동행정망)
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          계정이 없으신가요? <span className="font-medium text-slate-600 underline">관리자 승인 신청</span>
        </p>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-400">
          데모 계정 — 기관 ID <code className="rounded bg-white px-1 py-0.5">jeju-ax</code>: 담당자 로그인 · 기관 ID{" "}
          <code className="rounded bg-white px-1 py-0.5">guest</code>: 권한 없는 계정 체험. 비밀번호는 아무 값이나
          입력하세요.
        </div>
      </div>
    </div>
  )
}
