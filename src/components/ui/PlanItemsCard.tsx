import { Card } from "./Card"
import { RiskBadge } from "./RiskBadge"
import { MEETING_SOURCE, type PlanItem } from "../../data/mockMeetingItems"

/** 회의록에서 나온 계획·검토 항목을 진행 상태와 함께 나열하는 카드 */
export function PlanItemsCard({ title, subtitle, items }: { title: string; subtitle?: string; items: PlanItem[] }) {
  return (
    <Card title={title} subtitle={subtitle}>
      <ul className="flex flex-col divide-y divide-border-subtle">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium text-white/85">{item.title}</p>
              <p className="mt-0.5 text-xs text-white/40">{item.detail}</p>
            </div>
            <RiskBadge level={item.level} label={item.status} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-white/35">{MEETING_SOURCE} — 계획·검토 상태이며 실제 측정 결과가 아닙니다.</p>
    </Card>
  )
}
