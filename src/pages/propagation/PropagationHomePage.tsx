import { Card } from "../../components/ui/Card"
import {
  propagationChannels,
  propagationHistory,
  reportingChain,
  sequentialPropagation,
  simultaneousPropagationGoal,
} from "../../data/mockPropagation"

function minutesBetween(a: string, b: string) {
  const [h1, m1] = a.split(":").map(Number)
  const [h2, m2] = b.split(":").map(Number)
  return h2 * 60 + m2 - (h1 * 60 + m1)
}

export function PropagationHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상황 전파 · 보고체계</h1>
        <p className="mt-1 text-sm text-white/50">
          현재는 도청 → 시 상황실 → 읍면동 순차 전파로 단계별 지연 발생 — 동시 전파 체계가 목표
        </p>
      </div>

      <Card title="현재 전파 체계 (순차)" subtitle="가장 최근 사건 기준 — 단계별 도달 시각">
        <div className="flex flex-wrap items-center gap-2">
          {sequentialPropagation.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="rounded-lg border border-border-subtle bg-inset px-4 py-3 text-center">
                <p className="text-sm font-semibold text-white/80">{step.stage}</p>
                <p className="text-xs text-white/40">{step.time}</p>
              </div>
              {i < sequentialPropagation.length - 1 && (
                <span className="text-xs text-risk-warning">
                  → {minutesBetween(step.time, sequentialPropagation[i + 1].time)}분 지연
                </span>
              )}
            </div>
          ))}
          <span className="ml-2 rounded-full border border-risk-warning/40 bg-risk-warning-bg px-3 py-1 text-xs font-bold text-risk-warning">
            총 소요 {minutesBetween(sequentialPropagation[0].time, sequentialPropagation[sequentialPropagation.length - 1].time)}분
          </span>
        </div>
        <div className="mt-4 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
          목표: {simultaneousPropagationGoal.note} — {simultaneousPropagationGoal.status}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="재난 보고체계" subtitle="행정시 → 도청 → 행안부">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {reportingChain.map((step, i) => (
              <span key={step.id} className="flex items-center gap-2">
                <span className="rounded-full border border-border-subtle px-3 py-1.5 text-white/80">
                  {step.label} <span className="text-white/35">· {step.role}</span>
                </span>
                {i < reportingChain.length - 1 && <span className="text-white/30">→</span>}
              </span>
            ))}
          </div>
        </Card>

        <Card title="전파 채널 현황">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {propagationChannels.map((ch) => (
              <li key={ch.id} className="py-2.5 text-sm">
                <p className="font-medium text-white/85">{ch.name}</p>
                <p className="mt-0.5 text-xs text-white/40">{ch.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="전파 이력" subtitle="순차 전파 체계에서 실제 소요된 시간 기록">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">사건</th>
              <th className="pb-2 font-medium">일자</th>
              <th className="pb-2 font-medium">전파 단계</th>
              <th className="pb-2 font-medium">총 지연</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {propagationHistory.map((h) => (
              <tr key={h.id}>
                <td className="py-2 font-medium text-white/80">{h.title}</td>
                <td className="py-2 text-white/40">{h.date}</td>
                <td className="py-2 text-white/40">{h.steps}</td>
                <td className="py-2 text-risk-warning font-semibold">{h.totalDelay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
