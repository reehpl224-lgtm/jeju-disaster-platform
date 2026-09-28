import { type FormEvent, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { getCurrentUser, login } from "../data/mockAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // RequireAuth가 넘긴 원래 요청 경로 — 앱 내부 경로("/..."로 시작, "//" 제외)만 허용
  const requested = (location.state as { from?: unknown } | null)?.from
  const returnTo = typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard"
  const existing = getCurrentUser()
  const [orgId, setOrgId] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (existing) {
    return <Navigate to={returnTo} replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!orgId.trim() || !password.trim()) {
      setError("사원번호와 비밀번호를 입력해 주세요.")
      return
    }
    const user = login(orgId.trim())
    navigate(user.role === "restricted" ? "/403" : returnTo, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-base p-8 shadow-xl lg:p-16">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base">🚨</span>
          <h1 className="text-lg font-bold text-white">제주 재난 대응 플랫폼</h1>
        </div>
        <p className="mb-6 text-sm font-medium text-white/50">로그인</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-white/60">🪪 사원번호</span>
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
              placeholder="사원번호를 입력하세요 (예: jeju-ax)"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-white/60">🔑 비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-white/60">🛡️ OTP</span>
            <div className="flex gap-2">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-inset px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
                placeholder="OTP를 입력하세요 (데모: 생략 가능)"
              />
              <button
                type="button"
                onClick={() => setNotice("데모 환경이라 OTP는 실제로 발송되지 않습니다 — OTP 칸은 비워 두고 로그인하면 됩니다.")}
                className="shrink-0 rounded-lg border border-accent px-3 text-xs font-bold text-accent transition hover:bg-accent-soft"
              >
                OTP 발신
              </button>
            </div>
          </label>

          {error && <p className="text-xs font-medium text-risk-danger">{error}</p>}
          {notice && (
            <p role="status" className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-xs text-white/60">
              {notice}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-full bg-accent py-2.5 text-sm font-bold text-black transition hover:bg-accent-hover"
          >
            로그인
          </button>

          <button
            type="button"
            onClick={() => setNotice("비밀번호 초기화는 운영 환경에서 관리자(아래 비상연락망)를 통해 진행합니다 — 데모에선 아무 비밀번호로 로그인할 수 있습니다.")}
            className="rounded-full border border-border-subtle py-2.5 text-sm font-semibold text-white/60 transition hover:bg-inset"
          >
            비밀번호 초기화
          </button>
        </form>

        <div className="mt-6 space-y-0.5 text-[11px] text-white/35">
          <p>
            장애시, 비상연락망: <span className="font-semibold text-white/50">000-0000-0000</span>
          </p>
          <p>
            유지보수 사업자: <span className="font-semibold text-white/50">000-0000-0000</span>
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-inset p-3 text-[11px] leading-relaxed text-white/40">
          데모 계정 — 사원번호 <code className="rounded bg-black/30 px-1 py-0.5 text-accent">jeju-ax</code>: 담당자
          로그인 · 사원번호 <code className="rounded bg-black/30 px-1 py-0.5 text-accent">guest</code>: 권한 없는
          계정 체험. 비밀번호·OTP는 임의 값 또는 공란으로 진행하세요.
        </div>
      </div>
    </div>
  )
}
