import { useState } from "react"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { useEsopDefs } from "../../data/esopDefs"
import { ESOP_STAGES, stepsOf, type EsopLevel } from "../../data/esopLogic"
import { getCurrentUser } from "../../data/mockAuth"
import { useRolePolicy } from "../../data/roles"
import { canSeeService, SERVICE_IDS, type ServiceId } from "../../data/rolesLogic"
import { useCurrentLevels } from "../../data/useCurrentLevels"

const chip = (on: boolean) =>
  `inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${on ? "border-accent bg-accent-soft text-accent" : "border-white/20 text-white/70 hover:bg-white/10"}`

/**
 * 상황 전파 — 요구사항 '상황 전파': 이벤트가 생기면 해당 e-SOP에 따라 전파 대상을 구성한다.
 * 서비스와 단계를 고르면 e-SOP 절차 정의표에서 정의된 처리 순서대로 전파 대상·대응 부서·조치를 보여준다(서비스의 현재 단계가 기본값).
 * 실제 발송은 하지 않는다 — 구성된 대상을 확인하는 화면이다.
 */
export function EsopPropagationCard() {
  const defs = useEsopDefs()
  const policy = useRolePolicy()
  const levels = useCurrentLevels()
  const role = getCurrentUser()?.role ?? "restricted"
  const services = SERVICE_IDS.filter((id) => canSeeService(role, id, policy))
  const [picked, setPicked] = useState<ServiceId | null>(null)
  const [pickedLevel, setPickedLevel] = useState<EsopLevel | null>(null)
  const svc = picked && services.includes(picked) ? picked : (services.find((id) => levels[id]) ?? services[0])
  if (!svc) return null
  const level = pickedLevel ?? levels[svc] ?? "warning"
  const steps = stepsOf(defs, svc, level)
  const title = DOMAINS.find((d) => d.prefix === `/${svc}`)?.title ?? svc

  return (
    <Card title="e-SOP 기준 전파 대상 구성" subtitle="서비스와 단계를 고르면 e-SOP 절차 정의표의 처리 순서대로 전파 대상이 구성됩니다 — 현재 단계가 기본값">
      <div className="flex flex-wrap gap-2" role="group" aria-label="서비스">
        {services.map((id) => (
          <button key={id} type="button" aria-pressed={svc === id} className={chip(svc === id)} onClick={() => setPicked(id)}>
            {DOMAINS.find((d) => d.prefix === `/${id}`)?.icon} {DOMAINS.find((d) => d.prefix === `/${id}`)?.title}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="위험 단계">
        {ESOP_STAGES.map((s) => (
          <button key={s.level} type="button" aria-pressed={level === s.level} className={chip(level === s.level)} onClick={() => setPickedLevel(s.level)}>
            {s.label}
            {levels[svc] === s.level && <RiskBadge level={s.level} label="현재" />}
          </button>
        ))}
      </div>
      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-start gap-3 rounded-lg border border-white/15 p-3 text-sm">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">{i + 1}</span>
            <span>
              <b className="text-white/90">{s.target || "(대상 미정)"}</b>
              <span className="ml-2 text-xs text-white/40">{s.dept}</span>
              <span className="block text-white/65">{s.action}</span>
            </span>
          </li>
        ))}
        {steps.length === 0 && <li className="text-xs text-white/40">{title} {ESOP_STAGES.find((s) => s.level === level)?.label} 단계에 정의된 전파 대상이 없습니다.</li>}
      </ol>
      <p className="mt-3 text-[11px] text-white/35">정의는 운영 &gt; e-SOP 대응에서 고칩니다. 이 화면은 대상을 구성해 보여줄 뿐 실제 발송은 하지 않습니다.</p>
    </Card>
  )
}
