import { useNavigate } from "react-router-dom"
import { logout } from "../data/mockAuth"

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-risk-danger-bg text-2xl">
          🚫
        </div>
        <h1 className="text-lg font-bold text-slate-900">접근 권한이 없습니다</h1>
        <p className="mt-2 text-sm text-slate-500">이 페이지에 접근할 권한이 없습니다.</p>
        <p className="mt-1 text-sm text-slate-500">
          제주 재난 AX 대응 플랫폼의 관리자 또는 담당 부서에 문의하여 권한을 요청하시기 바랍니다.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            통합 대시보드로
          </button>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate("/login", { replace: true })
            }}
            className="rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  )
}
