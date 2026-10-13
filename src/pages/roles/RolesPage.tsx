import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { getCurrentUser } from "../../data/mockAuth"
import { resetPolicy, savePolicy, useRolePolicy } from "../../data/roles"
import { PERMS, ROLES, SERVICE_IDS, type PermKey, type RoleId, type ServiceId } from "../../data/rolesLogic"

const th = "px-2 pb-2 text-center text-xs font-medium text-white/50"

/**
 * 운영 > 역할·권한. 요구사항 '사용자·역할 관리' — 역할 4종별 화면 접근 범위와 서비스(데이터) 접근 범위를 정의하고 바로 적용한다.
 * 정의는 이 브라우저에만 저장되고 서버가 검사하지 않는다(프로토타입 수준 적용). 관리자의 '역할·권한 관리'는 잠금 방지로 항상 켜져 있다.
 */
export function RolesPage() {
  const policy = useRolePolicy()
  const me = getCurrentUser()

  const setPerm = (role: RoleId, key: PermKey, on: boolean) =>
    savePolicy({ ...policy, perms: { ...policy.perms, [role]: { ...policy.perms[role], [key]: on } } })
  const setService = (role: RoleId, id: ServiceId, on: boolean) =>
    savePolicy({ ...policy, services: { ...policy.services, [role]: on ? [...policy.services[role], id] : policy.services[role].filter((s) => s !== id) } })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">역할·권한</h1>
          <p className="mt-1 text-sm text-white/50">
            역할별로 볼 수 있는 화면과 서비스를 정합니다. 바꾸면 바로 적용되고 이 브라우저에만 저장됩니다(실제 인증·서버 검사는 아닙니다).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("역할·권한을 처음 값(샘플)으로 되돌립니다.")) resetPolicy()
          }}
          className="h-9 rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"
        >
          처음 값으로 되돌리기
        </button>
      </div>

      <Card title="역할 4종" subtitle="현재 로그인한 역할은 표시되고, 상단 메뉴의 '역할 체험'으로 바꿔 볼 수 있습니다">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ROLES.map((r) => (
            <li key={r.id} className={`rounded-lg border p-3 text-sm ${me?.role === r.id ? "border-accent bg-accent-soft" : "border-white/15"}`}>
              <p className="font-bold text-white/90">
                {r.label} {me?.role === r.id && <span className="ml-1 text-xs text-accent">현재 역할</span>}
              </p>
              <p className="mt-0.5 text-xs text-white/50">{r.summary}</p>
              <p className="mt-1 text-xs text-white/35">
                기본 화면 <code>{r.home}</code> · 체험 사원번호 <code>{r.demoAccount}</code>
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="화면·기능 권한" subtitle="체크한 역할만 해당 화면(메뉴)을 열 수 있습니다. 허용되지 않은 화면은 '접근 권한 없음'으로 이동합니다">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs font-medium text-white/50">화면·기능</th>
                {ROLES.map((r) => (
                  <th key={r.id} className={th}>
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {PERMS.map((p) => (
                <tr key={p.key}>
                  <td className="py-2 text-white/80">
                    {p.label}
                    {p.paths.length > 0 && <span className="ml-2 text-[11px] text-white/30">{p.paths.join(" · ")}</span>}
                  </td>
                  {ROLES.map((r) => (
                    <td key={r.id} className="py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${r.label} — ${p.label}`}
                        checked={policy.perms[r.id][p.key]}
                        disabled={r.id === "admin" && p.key === "roles"}
                        onChange={(e) => setPerm(r.id, p.key, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="서비스(데이터) 접근 범위" subtitle="서비스 보드·상세 화면·분야별 데이터를 역할마다 어느 서비스까지 볼 수 있는지">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs font-medium text-white/50">서비스</th>
                {ROLES.map((r) => (
                  <th key={r.id} className={th}>
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {SERVICE_IDS.map((id) => {
                const d = DOMAINS.find((x) => x.prefix === `/${id}`)
                return (
                  <tr key={id}>
                    <td className="py-2 text-white/80">
                      <span aria-hidden="true">{d?.icon}</span> {d?.title ?? id}
                    </td>
                    {ROLES.map((r) => (
                      <td key={r.id} className="py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${r.label} — ${d?.title ?? id}`}
                          checked={policy.services[r.id].includes(id)}
                          onChange={(e) => setService(r.id, id, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
