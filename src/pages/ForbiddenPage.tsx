import { useLocation, useNavigate } from "react-router-dom"
import { getCurrentUser, logout } from "../data/mockAuth"
import { ROLES, roleLabel } from "../data/rolesLogic"

export function ForbiddenPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const denied = (useLocation().state as { denied?: string } | null)?.denied
  const role = user && user.role !== "restricted" ? user.role : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-panel p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-risk-danger-bg text-2xl">
          🚫
        </div>
        <h1 className="text-lg font-bold text-white">접근 권한이 없습니다</h1>
        <p className="mt-2 text-sm text-white/50">이 페이지에 접근할 권한이 없습니다.</p>
        <p className="mt-1 text-sm text-white/50">
          제주 재난 대응 플랫폼의 관리자 또는 담당 부서에 문의하여 권한을 요청하시기 바랍니다.
        </p>

        {role && (
          <p className="mt-3 rounded-lg bg-inset px-3 py-2 text-xs text-white/60">
            현재 역할 <b className="text-white/80">{roleLabel(role)}</b>
            {denied && <> · 요청한 화면 <code className="text-accent">{denied}</code></>}은(는) 이 역할의 접근 범위 밖입니다.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {role && (
            <button
              type="button"
              onClick={() => navigate(ROLES.find((r) => r.id === role)?.home ?? "/dashboard", { replace: true })}
              className="rounded-full border border-accent py-2.5 text-sm font-bold text-accent transition hover:bg-accent-soft"
            >
              내 기본 화면으로
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate("/login", { replace: true })
            }}
            className="rounded-full bg-accent py-2.5 text-sm font-bold text-black transition hover:bg-accent-hover"
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  )
}
