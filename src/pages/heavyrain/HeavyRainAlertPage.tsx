import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { HEAVY_RAIN_NAV } from "./heavyRainNav"
import { heavyRainAlertDispatch } from "../../data/mockHeavyRain"

export function HeavyRainAlertPage() {
  const d = heavyRainAlertDispatch
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">경보 발송 현황</h1>
          <p className="mt-1 text-sm text-white/50">{d.message}</p>
        </div>
        <Link
          to="/heavy-rain/closure"
          className="rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
        >
          상황 종료 처리
        </Link>
      </div>

      <DomainSubNav items={HEAVY_RAIN_NAV} />

      <Card title="발송 대상 및 위험 단계">
        <RiskBadge level="alert" label={d.stage} solid />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="발송 대상" value={`${d.target} (${d.targetDetail})`} />
          <Field label="발송 시각" value={d.sentAt} />
          <Field label="승인자" value={d.approver} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {d.channels.map((ch) => (
          <Card key={ch.id}>
            <p className="text-sm font-semibold text-white/85">{ch.name}</p>
            <p className="mt-2 text-xs text-white/40">
              발송 {ch.sent.toLocaleString()}
              {ch.unit ?? "건"}
            </p>
            <p className="text-xs text-white/40">수신 성공 {ch.success.toLocaleString()}</p>
            <p className="text-xs text-white/40">실패 {ch.fail.toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold text-accent">성공률 {ch.rate}</p>
            <p className="mt-1 text-[11px] text-white/30">최근 발송: {ch.lastSent}</p>
          </Card>
        ))}
      </div>

      <Card title="수신 실패 현황" subtitle={`전체 실패: ${d.totalFail}건`}>
        <p className="text-xs text-white/40">통신사 지연 등 일시적 실패로, 재전송 후 대부분 수신 확인됨.</p>
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
