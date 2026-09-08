import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { HEAT_NAV } from "./heatNav"
import { heatAlertDispatch } from "../../data/mockHeat"

export function HeatAlertPage() {
  const d = heatAlertDispatch
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">안내 발송 현황</h1>
        <p className="mt-1 text-sm text-white/50">{d.message}</p>
      </div>

      <DomainSubNav items={HEAT_NAV} />

      <Card title="발송 대상 및 단계">
        <RiskBadge level="warning" label={d.stage} solid />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="발송 대상" value={`${d.target} (${d.targetDetail})`} />
          <Field label="발송 시각" value={d.sentAt} />
          <Field label="승인자" value={d.approver} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {d.channels.map((ch) => (
          <Card key={ch.id}>
            <p className="text-sm font-semibold text-white/85">{ch.name}</p>
            <p className="mt-2 text-xs text-white/40">발송 {ch.sent.toLocaleString()}건</p>
            <p className="text-xs text-white/40">수신 성공 {ch.success.toLocaleString()}</p>
            <p className="text-xs text-white/40">실패 {ch.fail.toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold text-accent">성공률 {ch.rate}</p>
            <p className="mt-1 text-[11px] text-white/30">최근 발송: {ch.lastSent}</p>
          </Card>
        ))}
      </div>

      <Card title="수신 실패 현황" subtitle={`전체 실패: ${d.totalFail.toLocaleString()}건`}>
        <p className="text-xs text-white/40">전국 단위 대량 발송 특성상 일부 통신 지연 실패 포함 — 재전송 진행 중.</p>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="text-sm font-medium text-white/85">{value}</p>
    </div>
  )
}
