import { Link } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { getCurrentUser } from "../../data/mockAuth"
import { decide, useResponseLog } from "../../data/responseLog"
import { useRolePolicy } from "../../data/roles"
import { hasPerm } from "../../data/rolesLogic"

/**
 * 통합 결재함 위쪽 — 서비스 보드에서 등록된 '승인이 필요한 대응 지시'(경보 발령·시설 제어·출동·대피 등)의 승인 대기 목록.
 * 요구사항 '승인 기반 실행 원칙': 권한자가 승인해야 그 지시가 전달·수행으로 넘어간다. 승인·반려 결과는 사건 이력에 남는다.
 */
export function PendingOrderApprovals() {
  const store = useResponseLog()
  const policy = useRolePolicy()
  const role = getCurrentUser()?.role ?? "restricted"
  const can = hasPerm(role, "orderApprove", policy)
  const pending = store.orders.filter((o) => o.approval?.status === "대기")
  const svcOf = (incidentId: string) => store.incidents.find((i) => i.id === incidentId)?.serviceId ?? ""
  const titleOf = (id: string) => DOMAINS.find((d) => d.prefix === `/${id}`)

  return (
    <Card title={`대응 지시 승인 대기 ${pending.length}건`} subtitle="실제 조치(경보 발령·시설 제어·출동·대피 등)는 승인 후에만 전달·수행할 수 있습니다">
      <ul className="flex flex-col divide-y divide-border-subtle">
        {pending.map((o) => {
          const svc = svcOf(o.incidentId)
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <Link to={`/${svc}`} className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/70 hover:text-accent">
                {titleOf(svc)?.icon} {titleOf(svc)?.title ?? svc}
              </Link>
              <span className="min-w-0 flex-1 font-medium text-white/85">{o.title}</span>
              <span className="text-xs text-white/40">{o.assignee || "담당자 미정"} · {o.incidentId}</span>
              {can ? (
                <span className="flex gap-2">
                  <button type="button" className="h-8 rounded-md bg-accent px-3 text-xs font-bold text-black hover:bg-accent-hover" onClick={() => decide(o.id, "승인")}>
                    승인
                  </button>
                  <button type="button" className="h-8 rounded-md border border-risk-danger/60 px-3 text-xs font-bold text-risk-danger hover:bg-white/5" onClick={() => decide(o.id, "반려")}>
                    반려
                  </button>
                </span>
              ) : (
                <span className="text-xs text-white/35">승인 권한자(관리자·의사결정자)만 처리</span>
              )}
            </li>
          )
        })}
        {pending.length === 0 && <li className="py-4 text-center text-sm text-white/30">승인 대기 중인 대응 지시가 없습니다.</li>}
      </ul>
    </Card>
  )
}
