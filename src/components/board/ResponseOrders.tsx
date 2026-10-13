import { useState } from "react"
import { useEsopDefs } from "../../data/esopDefs"
import { stepsOf } from "../../data/esopLogic"
import { getCurrentUser } from "../../data/mockAuth"
import { endIncident, moveOrder, recordOrder, useResponseLog } from "../../data/responseLog"
import { NEXT_STATUS, openIncidentOf, ordersOf, type OrderStatus } from "../../data/responseLogic"
import { useRolePolicy } from "../../data/roles"
import { hasPerm, SERVICE_IDS, type ServiceId } from "../../data/rolesLogic"
import { useCurrentLevels } from "../../data/useCurrentLevels"
import type { RiskLevel } from "../../types/domain"
import { SpRisk } from "../sidepanel/primitives"

const STATUS_LEVEL: Record<OrderStatus, RiskLevel> = { 지시: "info", 전달: "caution", "수행 중": "warning", 완료: "safe", 실패: "alert" }
const hm = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })

/**
 * 서비스 보드 우측 '대응 지시' 카드 — 요구사항 '대응 지시·조치 결과 관리'.
 * 지시 등록(e-SOP 절차에서 불러오기 가능) → 전달 → 수행 시작 → 결과 등록(완료·실패)으로 처리 상태를 관리하고,
 * 모든 단계가 사건(공통 사건 ID)의 조치 기록에 시각·기록자와 함께 남는다. 저장은 이 브라우저뿐이고 대상자에게 실제로 전달되지는 않는다.
 */
export function ResponseOrders({ serviceId }: { serviceId: string }) {
  const store = useResponseLog()
  const policy = useRolePolicy()
  const defs = useEsopDefs()
  const level = useCurrentLevels()[serviceId] ?? "warning"
  const role = getCurrentUser()?.role ?? "restricted"
  const canIssue = hasPerm(role, "orderIssue", policy)
  const canResult = hasPerm(role, "orderResult", policy)
  const open = openIncidentOf(store, serviceId)
  const orders = open ? ordersOf(store, open.id) : []
  const active = orders.filter((o) => o.status !== "완료").length
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState("")
  const [dept, setDept] = useState("")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const steps = (SERVICE_IDS as readonly string[]).includes(serviceId) ? stepsOf(defs, serviceId as ServiceId, level) : []

  const allowed = (to: OrderStatus) => (to === "전달" ? canIssue : canResult)
  const submit = () => {
    if (!title.trim()) return
    recordOrder(serviceId, { title, assignee, dept })
    setTitle("")
    setAssignee("")
    setDept("")
  }

  return (
    <div className="sp-card sp-card--open spg-dark">
      <div className="sp-row">
        <b className="sp-h2" style={{ fontSize: 13 }}>
          대응 지시
        </b>
        <span className="sp-spacer" />
        <SpRisk level={active > 0 ? "warning" : "safe"}>{orders.length === 0 ? "지시 없음" : active > 0 ? `${active}건 진행` : "모두 완료"}</SpRisk>
      </div>
      <p className="sp-sub">{open ? `사건 ${open.id}` : "지시나 조치를 기록하면 사건(공통 사건 ID)이 열립니다"}</p>

      {orders.map((o) => (
        <div className="bo-order" key={o.id}>
          <div className="sp-row" style={{ alignItems: "flex-start" }}>
            <b style={{ flex: "1 1 0", minWidth: 0, fontSize: 12, lineHeight: "18px" }}>{o.title}</b>
            <SpRisk level={STATUS_LEVEL[o.status]}>{o.status}</SpRisk>
          </div>
          <p className="sp-sub">
            {o.assignee || "담당자 미정"}
            {o.dept && ` · ${o.dept}`} · {hm(o.events[o.events.length - 1].at)}
            {o.result && ` · 결과: ${o.result}`}
          </p>
          {NEXT_STATUS[o.status].length > 0 && (
            <div className="sp-row" style={{ flexWrap: "wrap" }}>
              {o.status === "수행 중" && canResult && (
                <input
                  className="bo-input"
                  value={notes[o.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [o.id]: e.target.value })}
                  placeholder="조치 결과 (예: 출입 통제 완료)"
                  aria-label={`${o.title} 조치 결과`}
                />
              )}
              {NEXT_STATUS[o.status].map((to) => (
                <button
                  key={to}
                  type="button"
                  className={`bd-btn ${to === "실패" ? "bd-btn--no" : "bd-btn--ok"}`}
                  disabled={!allowed(to)}
                  title={allowed(to) ? undefined : "이 역할은 권한이 없습니다"}
                  onClick={() => {
                    moveOrder(o.id, to, notes[o.id])
                    setNotes({ ...notes, [o.id]: "" })
                  }}
                >
                  {to === "수행 중" ? (o.status === "실패" ? "다시 수행" : "수행 시작") : to === "완료" ? "완료 등록" : to === "실패" ? "실패 등록" : "전달"}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {canIssue ? (
        <form
          className="bo-form"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {steps.length > 0 && (
            <select
              className="bo-input"
              aria-label="e-SOP 절차에서 불러오기"
              value=""
              onChange={(e) => {
                const s = steps.find((x) => x.id === e.target.value)
                if (s) {
                  setTitle(s.action)
                  setAssignee(s.target)
                  setDept(s.dept)
                }
              }}
            >
              <option value="">e-SOP 절차에서 불러오기 (현재 {level === "danger" ? "심각" : level === "alert" ? "경계" : level === "warning" ? "주의" : "관심"} 단계)</option>
              {steps.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.target} — {s.action}
                </option>
              ))}
            </select>
          )}
          <input className="bo-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="지시 내용 (예: 하천변 출입 통제)" aria-label="지시 내용" />
          <div className="sp-row">
            <input className="bo-input" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="담당자·전파 대상" aria-label="담당자" />
            <input className="bo-input" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="대응 부서" aria-label="대응 부서" />
          </div>
          <button type="submit" className="bd-btn bd-btn--line" disabled={!title.trim()}>
            지시 등록
          </button>
        </form>
      ) : (
        <p className="sp-note">지시 등록·전달은 재난상황실 운영자·관리자 역할이 합니다.</p>
      )}

      {open && canIssue && (
        <button
          type="button"
          className="bd-end"
          onClick={() => window.confirm(`사건 ${open.id}을(를) 종료로 기록합니다. 이후 기록은 새 사건으로 시작됩니다.`) && endIncident(serviceId)}
        >
          이 사건 종료 기록 →
        </button>
      )}
    </div>
  )
}
