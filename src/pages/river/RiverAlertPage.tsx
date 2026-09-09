import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import { riverAlertDispatch } from "../../data/mockRiver"

export function RiverAlertPage() {
  const d = riverAlertDispatch
  const [retried, setRetried] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">경보 발송 현황</h1>
        <p className="mt-1 text-sm text-white/50">{d.message}</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card title="발송 대상 및 위험 단계">
        <RiskBadge level="danger" label={d.stage} solid />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="발송 대상" value={`${d.target} (${d.targetDetail})`} />
          <Field label="발송 시각" value={d.sentAt} />
          <Field label="영향 하천" value={d.rivers} />
          <Field label="영향 행정구역" value={d.district} />
          <Field label="승인자" value={d.approver} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <Card title="수신 실패 항목" subtitle={`전체 실패: ${d.totalFail}건`}>
        {retried ? (
          <p className="rounded-lg border border-risk-safe/40 bg-risk-safe-bg p-2.5 text-xs text-risk-safe">
            ✓ 재시도 요청을 보냈습니다. 채널사 응답을 기다리는 중입니다.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setRetried(true)}
            className="rounded-full border border-risk-danger/40 px-3 py-1.5 text-xs font-bold text-risk-danger hover:bg-risk-danger-bg"
          >
            전체 재시도
          </button>
        )}
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">채널</th>
              <th className="pb-2 font-medium">대상 식별자</th>
              <th className="pb-2 font-medium">실패 유형</th>
              <th className="pb-2 font-medium">발생 시각</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            <tr>
              <td className="py-2 text-white/70">현장 단말</td>
              <td className="py-2 text-white/40">FD-118 서귀포 남부</td>
              <td className="py-2 text-white/40">중계 응답 없음</td>
              <td className="py-2 text-white/40">14:32:15</td>
            </tr>
            <tr>
              <td className="py-2 text-white/70">문자(SMS)</td>
              <td className="py-2 text-white/40">타임아웃 118건</td>
              <td className="py-2 text-white/40">통신사 지연</td>
              <td className="py-2 text-white/40">14:32:09</td>
            </tr>
          </tbody>
        </table>
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
