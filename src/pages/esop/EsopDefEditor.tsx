import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { resetService, saveSteps, useEsopDefs } from "../../data/esopDefs"
import { ESOP_STAGES, moveStep, stepsOf, type EsopLevel, type EsopStep } from "../../data/esopLogic"
import type { ServiceId } from "../../data/rolesLogic"
import { useCurrentLevels } from "../../data/useCurrentLevels"

const cell = "w-full rounded border border-border-subtle bg-inset px-2 py-1.5 text-xs text-white outline-none focus:border-accent"
const iconBtn = "h-7 w-7 rounded border border-white/20 text-xs text-white/70 hover:bg-white/10 disabled:opacity-30"

/**
 * 서비스 하나의 e-SOP 절차 정의표 — 단계 4개마다 '전파 대상 · 대응 부서 · 현장 조치'를 처리 순서대로 적는다.
 * 고치면 바로 저장되고(이 브라우저에만), 편집 권한이 없으면 읽기만 한다. 같은 표가 상황전파 화면의 전파 대상 구성에 쓰인다.
 */
export function EsopDefEditor({ serviceId, title, editable }: { serviceId: ServiceId; title: string; editable: boolean }) {
  const defs = useEsopDefs()
  const now = useCurrentLevels()[serviceId]
  const [level, setLevel] = useState<EsopLevel>(now ?? "warning")
  const steps = stepsOf(defs, serviceId, level)
  const edited = Object.keys(defs).some((k) => k.startsWith(`${serviceId}:`))
  const save = (next: EsopStep[]) => saveSteps(serviceId, level, next)
  const patch = (i: number, p: Partial<EsopStep>) => save(steps.map((s, j) => (j === i ? { ...s, ...p } : s)))

  return (
    <Card
      title={`${title} — 단계별 e-SOP 절차 정의`}
      subtitle="위험 단계마다 상황 전파 대상 · 대응 부서 · 현장 조치를 처리 순서대로 정의합니다 (초기값은 샘플)"
      action={
        editable && edited ? (
          <button
            type="button"
            onClick={() => window.confirm(`${title}의 절차 정의를 처음 값(샘플)으로 되돌립니다.`) && resetService(serviceId)}
            className="h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10"
          >
            처음 값으로
          </button>
        ) : undefined
      }
    >
      <div role="tablist" aria-label="위험 단계" className="mb-3 flex flex-wrap gap-2">
        {ESOP_STAGES.map((s) => (
          <button
            key={s.level}
            type="button"
            role="tab"
            aria-selected={level === s.level}
            onClick={() => setLevel(s.level)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${level === s.level ? "border-accent bg-accent-soft text-accent" : "border-white/20 text-white/70 hover:bg-white/10"}`}
          >
            {s.label} · {stepsOf(defs, serviceId, s.level).length}단계
            {now === s.level && <RiskBadge level={s.level} label="현재" />}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs text-white/40">
              <th className="w-10 pb-2 font-medium">순서</th>
              <th className="pb-2 pr-2 font-medium">상황 전파 대상</th>
              <th className="pb-2 pr-2 font-medium">대응 부서</th>
              <th className="pb-2 pr-2 font-medium">현장 조치 사항</th>
              {editable && <th className="w-24 pb-2 font-medium" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {steps.map((s, i) => (
              <tr key={s.id} className="align-top">
                <td className="py-2 font-bold text-white/60">{i + 1}</td>
                {(["target", "dept", "action"] as const).map((f) => (
                  <td key={f} className="py-2 pr-2">
                    {editable ? (
                      <input className={cell} value={s[f]} aria-label={`${i + 1}번째 ${f === "target" ? "전파 대상" : f === "dept" ? "대응 부서" : "현장 조치"}`} onChange={(e) => patch(i, { [f]: e.target.value })} />
                    ) : (
                      <span className="text-white/80">{s[f] || "-"}</span>
                    )}
                  </td>
                ))}
                {editable && (
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button type="button" className={iconBtn} aria-label="위로" disabled={i === 0} onClick={() => save(moveStep(steps, i, -1))}>
                        ↑
                      </button>
                      <button type="button" className={iconBtn} aria-label="아래로" disabled={i === steps.length - 1} onClick={() => save(moveStep(steps, i, 1))}>
                        ↓
                      </button>
                      <button type="button" className={iconBtn} aria-label="삭제" onClick={() => save(steps.filter((_, j) => j !== i))}>
                        ✕
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {steps.length === 0 && <p className="py-3 text-xs text-white/40">이 단계에 정의된 절차가 없습니다.</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/35">
        <span>
          {editable ? "고치면 바로 저장됩니다 — 이 브라우저에만 저장되며 다른 PC와 공유되지 않습니다." : "편집 권한이 있는 역할(관리자·의사결정자)만 고칠 수 있습니다."}
        </span>
        {editable && (
          <button
            type="button"
            className="h-8 rounded-md border border-accent px-3 text-xs font-bold text-accent hover:bg-accent-soft"
            onClick={() => save([...steps, { id: `n${Date.now()}`, target: "", dept: "", action: "" }])}
          >
            + 절차 추가
          </button>
        )}
      </div>
    </Card>
  )
}
