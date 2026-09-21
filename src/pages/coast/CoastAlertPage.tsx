import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { PlanItemsCard } from "../../components/ui/PlanItemsCard"
import { coastAlertChannels } from "../../data/mockMeetingItems"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { coastEventDetail, coastEvents } from "../../data/mockCoast"

export function CoastAlertPage() {
  const [approved, setApproved] = useState<string | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)
  const pending = coastEvents.filter((e) => e.status === "미확인")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">경보 승인</h1>
        <p className="mt-1 text-sm text-white/50">e-SOP 경보 승인 대기 중인 위험 이벤트 검토</p>
      </div>

      <Card title="승인 대기 이벤트">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {pending.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex items-center gap-2">
                <RiskBadge level={event.level} solid />
                <div>
                  <p className="text-sm font-semibold text-white/85">{event.type}</p>
                  <p className="text-xs text-white/40">
                    {event.source} · {event.location} · {event.time}
                  </p>
                </div>
              </div>
              {approved === event.id ? (
                <span className="text-xs font-bold text-risk-safe">✓ 승인 완료</span>
              ) : rejected === event.id ? (
                <span className="text-xs font-bold text-white/40">반려됨</span>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setApproved(event.id)}
                    className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-xs font-bold text-black hover:bg-accent-hover"
                  >
                    e-SOP 경보 승인
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejected(event.id)}
                    className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"
                  >
                    반려
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="선택 이벤트 — AI 판단 근거" subtitle={coastEventDetail.id}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border-subtle p-3">
            <p className="text-sm font-semibold text-white/80">이안류 위험도</p>
            <p className="mt-1 text-xs text-white/40">{coastEventDetail.ripCurrentRisk.value}</p>
            <p className="text-xs text-white/40">{coastEventDetail.ripCurrentRisk.confidence}</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3">
            <p className="text-sm font-semibold text-white/80">현장 영상 탐지</p>
            <p className="mt-1 text-xs text-white/40">{coastEventDetail.detection.class}</p>
            <p className="text-xs text-white/40">{coastEventDetail.detection.confidence}</p>
          </div>
        </div>
      </Card>

      <PlanItemsCard title="현장 경보 채널" subtitle="사고 감지 시 현장 경보·안내 수단" items={coastAlertChannels} />
    </div>
  )
}
