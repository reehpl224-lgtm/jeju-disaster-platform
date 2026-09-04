import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaFarms, aquaModelConfidence, aquaQualityMetrics, aquaRiskState } from "../../data/mockAqua"

export function AquaPredictionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI 예측 결과 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">다중모델 융합 기반 저염분수·고수온 확산 경로 및 위험 판단</p>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="현재 위험 판단 상태" subtitle={`갱신 ${aquaRiskState.updatedAt}`}>
          <RiskBadge level="danger" label={aquaRiskState.level} solid />
          <p className="mt-3 text-sm font-semibold text-white/85">{aquaRiskState.headline}</p>
          <p className="mt-1 text-xs text-white/40">예측 신뢰도 {aquaRiskState.confidence}% · 데이터 품질 양호</p>
        </Card>
        <Card title="저염분수 예상 도달">
          <RiskBadge level="warning" label={aquaRiskState.lowSalinity.eta} solid />
          <p className="mt-3 text-sm text-white/85">{aquaRiskState.lowSalinity.time}</p>
          <p className="mt-1 text-xs text-white/40">{aquaRiskState.lowSalinity.location}</p>
        </Card>
        <Card title="고수온 예상 도달">
          <RiskBadge level="caution" label={aquaRiskState.highTemp.eta} solid />
          <p className="mt-3 text-sm text-white/85">{aquaRiskState.highTemp.time}</p>
          <p className="mt-1 text-xs text-white/40">{aquaRiskState.highTemp.location}</p>
        </Card>
      </div>

      <Card
        title="저염분수·고수온 유입 경로 및 영향 범위"
        subtitle={`영향 양식장 ${aquaRiskState.affectedFarmCount}개소 위험권 내 · ${aquaRiskState.affectedFarmDelta}`}
      >
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          저염분수·고수온 유입 경로 GIS 지도 (2단계 상세 구현 예정)
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="다중 모델 신뢰도">
          <ul className="flex flex-col gap-3">
            {aquaModelConfidence.map((model) => (
              <li key={model.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-white/70">{model.name}</span>
                  <span className="font-bold text-accent">{model.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-inset">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${model.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="데이터 품질 지표">
          <ul className="flex flex-col gap-2.5">
            {aquaQualityMetrics.map((metric) => (
              <li key={metric.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-2.5">
                <div>
                  <p className="text-sm font-medium text-white/80">{metric.name}</p>
                  <p className="text-xs text-white/35">{metric.note}</p>
                </div>
                <RiskBadge level={metric.level} label={`${metric.percent}%`} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="영향 양식장 목록 (미리보기)" action={<Link to="/aqua/farms" className="text-xs font-semibold text-white/50 hover:text-accent">전체 양식장 보기 →</Link>}>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaFarms.slice(0, 4).map((farm) => (
            <li key={farm.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <p className="font-medium text-white/80">{farm.name}</p>
                <p className="text-xs text-white/35">
                  {farm.region} · {farm.species}
                </p>
              </div>
              <RiskBadge level={farm.level} label={farm.riskType} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
