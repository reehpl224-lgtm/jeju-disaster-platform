import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { addNote, clearRuns, deleteScenario, removeNote, resetScenarios, runNow, saveScenario, toggleNote, useScenarios } from "../../data/scenarios"
import {
  EXPECT_OPTIONS, LEVEL_LABEL, SERVICE_TITLE, blankScenario, defaultMetricId, evaluateRun, metricOf, newPhase, passRate, phaseLevel,
  type Phase, type Scenario, type ScenarioRun, type TestCheck,
} from "../../data/scenarioLogic"
import { SERVICE_IDS, type ServiceId } from "../../data/rolesLogic"
import type { EsopLevel } from "../../data/esopLogic"
import type { RiskLevel } from "../../types/domain"

const txt = "min-w-0 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
const btn = "h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
const hm = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
const when = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
const risk = (l: EsopLevel | "normal"): RiskLevel => (l === "normal" ? "safe" : l)
const KMA_VALUES = [["1", "예비특보"], ["2", "주의보"], ["3", "경보"], ["4", "심각(관계기관 판단)"]]

/**
 * 운영 > 상황판단 시나리오 — 요구사항 '상황판단 시나리오'·'시나리오 시험·개선'.
 * 서비스 하나의 상황이 단계적으로 악화되는 시나리오를 구성(관측값·간격·기대 단계)하고 실행하면, 단계마다 위험 단계 판정 → 대시보드 경보 →
 * 상황 전파 대상 → 대응 지시가 e-SOP 정의대로 이어지는지 시뮬레이션하고 자동으로 시험한다. 시험 결과에서 나온 개선사항도 적어 둔다.
 * 시나리오·시험 기록은 이 브라우저에만 저장되고 실제 사건 기록과 섞이지 않는다(경보·전파·지시는 실제로 발송·등록되지 않는다).
 */
export function ScenariosPage() {
  const { scenarios, runs, notes } = useScenarios()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [viewRunId, setViewRunId] = useState<string | null>(null)
  const scenario = scenarios.find((s) => s.id === pickedId) ?? scenarios[0]
  const myRuns = runs.filter((r) => r.scenarioId === scenario?.id)
  const viewRun = runs.find((r) => r.id === viewRunId && r.scenarioId === scenario?.id) ?? myRuns[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상황판단 시나리오</h1>
        <p className="mt-1 text-sm text-white/50">
          상황이 단계적으로 나빠지는 시나리오를 만들어 실행하면 위험 단계 판정 → 대시보드 경보 → 상황 전파 → 대응 지시가 이어지는지 시험합니다 — 실제로 발송·등록되지 않고 이 브라우저에만 저장됩니다.
        </p>
      </div>

      <Card
        title="시나리오"
        action={
          <div className="flex gap-2">
            <button type="button" className={btn} onClick={() => { const s = blankScenario("river"); saveScenario(s); setPickedId(s.id) }}>
              + 새 시나리오
            </button>
            <button type="button" className={btn} onClick={() => window.confirm("시나리오를 처음 제공한 4개로 되돌립니다. 만든 시나리오는 사라집니다(시험 기록은 유지).") && resetScenarios()}>
              처음 값으로
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="시나리오">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={scenario?.id === s.id}
              onClick={() => setPickedId(s.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${scenario?.id === s.id ? "bg-accent text-black" : "border border-border-subtle text-white/70 hover:bg-inset"}`}
            >
              {s.name}
            </button>
          ))}
          {scenarios.length === 0 && <p className="text-sm text-white/40">시나리오가 없습니다 — 새 시나리오를 만들어 보세요.</p>}
        </div>
      </Card>

      {scenario && (
        <>
          <Editor key={scenario.id} scenario={scenario} onRun={() => setViewRunId(runNow(scenario).id)} onDelete={() => window.confirm(`"${scenario.name}" 시나리오를 삭제합니다.`) && (deleteScenario(scenario.id), setPickedId(null))} />
          {viewRun ? <RunView run={viewRun} /> : <Card title="시험 결과"><p className="text-sm text-white/40">아직 실행한 기록이 없습니다 — "시나리오 실행"을 눌러 보세요.</p></Card>}
        </>
      )}

      <Card title="실행 이력" subtitle={`${runs.length}건 (최근 30건 보관)`} action={runs.length > 0 ? <button type="button" className={btn} onClick={() => window.confirm("시험 기록을 모두 지웁니다.") && clearRuns()}>비우기</button> : undefined}>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {runs.map((r) => {
            const checks = evaluateRun(r)
            const rate = passRate(checks)
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <RiskBadge level={rate === 100 ? "safe" : "alert"} label={`통과 ${rate}%`} />
                <button type="button" className="font-semibold text-white/85 hover:text-accent hover:underline" onClick={() => { setPickedId(r.scenarioId); setViewRunId(r.id) }}>
                  {r.scenarioName}
                </button>
                <span className="text-xs text-white/40">{when(r.startedAt)} · {r.phases.length}단계 · 시험 {checks.length}개</span>
              </li>
            )
          })}
          {runs.length === 0 && <li className="py-4 text-center text-sm text-white/30">실행 이력이 없습니다.</li>}
        </ul>
      </Card>

      <Notes scenarioId={scenario?.id} notes={notes} />
    </div>
  )
}

function Editor({ scenario: s, onRun, onDelete }: { scenario: Scenario; onRun: () => void; onDelete: () => void }) {
  const metric = metricOf(s)
  const patch = (p: Partial<Scenario>) => saveScenario({ ...s, ...p })
  const patchPhase = (id: string, p: Partial<Phase>) => patch({ phases: s.phases.map((x) => (x.id === id ? { ...x, ...p } : x)) })
  const kma = s.metricId === "kma"

  return (
    <Card
      title="시나리오 구성"
      subtitle="단계마다 관측값과 앞 단계로부터 지난 시간, 기대하는 위험 단계를 적습니다 — 고치면 바로 저장됩니다"
      action={
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={onDelete}>삭제</button>
          <button type="button" className="h-8 rounded-md bg-accent px-4 text-xs font-bold text-black hover:bg-accent-hover disabled:opacity-40" disabled={s.phases.length === 0} onClick={onRun}>
            ▶ 시나리오 실행
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${txt} w-72`} value={s.name} onChange={(e) => patch({ name: e.target.value })} aria-label="시나리오 이름" placeholder="시나리오 이름" />
        <select
          className={txt}
          value={s.serviceId}
          aria-label="서비스"
          onChange={(e) => {
            const id = e.target.value as ServiceId
            saveScenario({ ...blankScenario(id), id: s.id, name: s.name, subject: s.subject })
          }}
        >
          {/* [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖 — 복원하려면 filter 제거 */}
          {SERVICE_IDS.filter((id) => id !== "heat" && id !== "wildfire").map((id) => (
            <option key={id} value={id}>
              {SERVICE_TITLE[id]}
            </option>
          ))}
        </select>
        <input className={`${txt} w-56`} value={s.subject} onChange={(e) => patch({ subject: e.target.value })} aria-label="발생 지점" placeholder="발생 지점(예: 효돈천 돈내코)" />
      </div>
      <p className="mt-1 text-[11px] text-white/35">서비스를 바꾸면 단계가 그 서비스의 첫 단계로 돌아갑니다. 지표: {kma ? "기상청 특보 등급" : `${metric?.label}(${metric?.unit})`}</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="w-10 pb-2 font-medium">단계</th>
              <th className="pb-2 font-medium">관측값</th>
              <th className="pb-2 font-medium">앞 단계로부터(분)</th>
              <th className="pb-2 font-medium">기대 단계</th>
              <th className="pb-2 font-medium">정의표 판정</th>
              <th className="w-10 pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {s.phases.map((p, i) => {
              const got = phaseLevel(s, p.value)
              return (
                <tr key={p.id}>
                  <td className="py-2 font-bold text-white/60">{i + 1}</td>
                  <td className="py-2 pr-2">
                    {kma ? (
                      <select className={txt} value={String(p.value)} aria-label={`${i + 1}단계 관측값`} onChange={(e) => patchPhase(p.id, { value: Number(e.target.value) })}>
                        {KMA_VALUES.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex items-center gap-1">
                        <input className={`${txt} w-24`} inputMode="decimal" value={String(p.value)} aria-label={`${i + 1}단계 관측값`} onChange={(e) => patchPhase(p.id, { value: Number(e.target.value) || 0 })} />
                        <span className="text-xs text-white/40">{metric?.unit}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <input className={`${txt} w-20`} inputMode="numeric" value={String(p.minutes)} aria-label={`${i + 1}단계 경과 분`} onChange={(e) => patchPhase(p.id, { minutes: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td className="py-2 pr-2">
                    <select className={txt} value={p.expect} aria-label={`${i + 1}단계 기대 단계`} onChange={(e) => patchPhase(p.id, { expect: e.target.value as EsopLevel })}>
                      {EXPECT_OPTIONS.map((o) => (
                        <option key={o.level} value={o.level}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <RiskBadge level={risk(got)} label={LEVEL_LABEL[got]} />
                  </td>
                  <td className="py-2">
                    <button type="button" className="h-7 w-7 rounded border border-white/20 text-xs text-white/70 hover:bg-white/10" aria-label={`${i + 1}단계 삭제`} onClick={() => patch({ phases: s.phases.filter((x) => x.id !== p.id) })}>
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className={`${btn} mt-3`} onClick={() => patch({ phases: [...s.phases, newPhase(kma ? 2 : (s.phases[s.phases.length - 1]?.value ?? 0), 30, "warning")] })}>
        + 단계 추가
      </button>
      {!metric && !kma && <p className="mt-2 text-xs text-risk-danger">이 서비스의 지표를 찾지 못했습니다({defaultMetricId(s.serviceId)}).</p>}
    </Card>
  )
}

function RunView({ run }: { run: ScenarioRun }) {
  const checks = evaluateRun(run)
  const rate = passRate(checks)
  const byPhase = (id: string) => checks.filter((c) => c.phaseId === id)
  return (
    <Card title="시험 결과" subtitle={`${when(run.startedAt)} 실행 · ${run.scenarioName}`} action={<RiskBadge level={rate === 100 ? "safe" : "alert"} label={`통과 ${rate}% (${checks.filter((c) => c.ok).length}/${checks.length})`} />}>
      <ol className="flex flex-col gap-3">
        {run.phases.map((r, i) => (
          <li key={r.phaseId} className="rounded-lg border border-white/15 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">{i + 1}</span>
              <span className="text-xs text-white/40">{hm(r.at)}</span>
              <RiskBadge level={risk(r.level)} label={LEVEL_LABEL[r.level]} />
              {r.alert && <b className="text-white/85">{r.alert.title}</b>}
              {!r.alert && <span className="text-white/45">정상 — 경보 없음</span>}
            </div>
            {r.propagation.length > 0 && (
              <p className="mt-2 text-xs text-white/55">
                <b className="text-white/70">상황 전파</b> {r.propagation.join(" → ")}
              </p>
            )}
            {r.orders.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-xs text-white/55">
                {r.orders.map((o, k) => (
                  <li key={`${o.title}-${k}`}>
                    <b className="text-white/70">지시</b> {o.title} <span className="text-white/35">· {o.assignee} / {o.dept}</span>
                  </li>
                ))}
              </ul>
            )}
            <ul className="mt-2 flex flex-wrap gap-2">
              {byPhase(r.phaseId).map((c) => (
                <Check key={c.kind} c={c} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function Check({ c }: { c: TestCheck }) {
  return (
    <li title={c.text} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${c.ok ? "border-accent/40 text-accent" : "border-risk-danger/60 text-risk-danger"}`}>
      {c.ok ? "✓" : "✗"} {c.kind}
      {!c.ok && <span className="ml-1 font-normal">— {c.text}</span>}
    </li>
  )
}

function Notes({ scenarioId, notes }: { scenarioId?: string; notes: ReturnType<typeof useScenarios>["notes"] }) {
  const [text, setText] = useState("")
  return (
    <Card title="개선사항" subtitle="시험·시연에서 나온 의견을 적어 두고, 화면에 반영하면 완료로 바꿉니다">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addNote(text, scenarioId)
          setText("")
        }}
      >
        <input className={`${txt} flex-1`} value={text} onChange={(e) => setText(e.target.value)} placeholder="개선사항 입력 (예: 경계 단계 전파에 읍면동 이장 추가)" aria-label="개선사항" />
        <button type="submit" className={btn} disabled={!text.trim()}>
          등록
        </button>
      </form>
      <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
        {notes.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <RiskBadge level={n.done ? "safe" : "warning"} label={n.done ? "반영 완료" : "검토 필요"} />
            <span className={n.done ? "text-white/45 line-through" : "text-white/80"}>{n.text}</span>
            <span className="text-xs text-white/30">{when(n.at)}</span>
            <span className="ml-auto flex gap-2">
              <button type="button" className={btn} onClick={() => toggleNote(n.id)}>
                {n.done ? "되돌리기" : "반영 완료로"}
              </button>
              <button type="button" className={btn} onClick={() => removeNote(n.id)}>
                삭제
              </button>
            </span>
          </li>
        ))}
        {notes.length === 0 && <li className="py-4 text-center text-sm text-white/30">등록된 개선사항이 없습니다.</li>}
      </ul>
    </Card>
  )
}
