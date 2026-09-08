import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { TYPHOON_NAV } from "./typhoonNav"
import { typhoonClosure } from "../../data/mockTyphoon"

export function TyphoonClosurePage() {
  const c = typhoonClosure
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">종료 보고</h1>
          <p className="mt-1 text-sm text-white/50">
            {c.caseId} · {c.title}
          </p>
        </div>
        <Link to="/typhoon" className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset">
          태풍 대시보드로 →
        </Link>
      </div>

      <DomainSubNav items={TYPHOON_NAV} />

      <Card title="사건 상태">
        <RiskBadge level="safe" label={c.status} solid />
        <p className="mt-2 text-xs text-white/40">{c.confirmedBy}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="사건 유형" value={c.type} />
          <Field label="총 대응 시간" value={`${c.duration} (${c.durationDetail})`} />
          <Field label="기관 공조" value={`${c.agencies} · ${c.agencyDetail}`} />
        </div>
      </Card>

      <Card title="관측 근거 데이터">
        <ul className="flex flex-col gap-2 text-sm">
          {c.observed.map((item) => (
            <li key={item.id} className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
              <span className="text-white/40">{item.label}</span>
              <span className="font-medium text-white/80">{item.value}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="종료 조건 충족 여부">
        <ul className="flex flex-col gap-2">
          {c.closureConditions.map((cond) => (
            <li key={cond} className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-risk-safe">✔</span> {cond}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold text-risk-safe">모든 종료 조건 충족 · 최종 승인 완료</p>
      </Card>

      <Card title="최종 종료 보고서">
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="담당 부서" value={c.report.department} />
          <Row label="승인 근거 e-SOP" value={c.report.sop} />
          <Row label="인명 피해" value={c.report.casualties} />
          <Row label="재산 피해" value={c.report.property} />
          <Row label="학습 포인트" value={c.report.lesson} />
        </dl>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle/60 pb-2">
      <dt className="shrink-0 text-white/40">{label}</dt>
      <dd className="text-right font-medium text-white/80">{value}</dd>
    </div>
  )
}
