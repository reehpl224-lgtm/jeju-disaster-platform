import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import {
  aquaClosurePrediction,
  aquaClosureSummary,
  aquaClosureTimeline,
  aquaRetraining,
} from "../../data/mockAqua"

export function AquaClosurePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">종료 보고서</h1>
          <p className="mt-1 text-sm text-white/50">상황 종료 및 사후 처리 — 저염분수·고수온</p>
        </div>
        <Link
          to="/aqua"
          className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
        >
          AX 컨트롤타워 홈으로 →
        </Link>
      </div>

      <AquaSubNav />

      <Card title="사건 요약">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="사건 유형" value={aquaClosureSummary.type} />
          <Field label="발생 위치" value={aquaClosureSummary.location} />
          <Field label="발생 시각" value={aquaClosureSummary.startedAt} />
          <Field label="종료 시각" value={aquaClosureSummary.endedAt} />
          <Field label="총 대응 시간" value={aquaClosureSummary.duration} />
          <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
            <p className="text-[11px] text-white/35">최종 위험 등급</p>
            <RiskBadge level="caution" label={aquaClosureSummary.finalGrade} solid />
          </div>
        </div>
      </Card>

      <Card title="조치 이력 타임라인">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaClosureTimeline.map((entry) => (
            <li key={entry.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{entry.time}</span>
              <p className="text-white/70">{entry.title}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="예측·실측 데이터 비교">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="예측 최저 염분" value={aquaClosurePrediction.predictedSalinity} />
            <Row label="실측 최저 염분" value={aquaClosurePrediction.actualSalinity} />
            <Row label="예측 오차" value={aquaClosurePrediction.error} />
          </dl>
          <div className="mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-xs text-white/30">
            염분·수온 시계열 예측·실측 비교 그래프
          </div>
        </Card>

        <Card title="판단 근거 — 위성·부이·GIS">
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            {aquaClosurePrediction.reasoning.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="재학습 반영 상태">
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="반영 대상 이벤트" value={aquaRetraining.target} />
          <Row label="반영 상태" value={aquaRetraining.status} />
          <Row label="최종 업데이트" value={aquaRetraining.updatedAt} />
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
    <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
      <dt className="text-white/40">{label}</dt>
      <dd className="font-medium text-white/80">{value}</dd>
    </div>
  )
}
