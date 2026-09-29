import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { aquaFarms, aquaKhoaEnhancementReview, aquaModelConfidence, aquaQualityMetrics, aquaRiskState } from "../../data/mockAqua"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { riskMarkers } from "../../data/mockDashboard"

const AQUA_MARKERS = riskMarkers.filter((m) => m.domain === "aqua")

export function AquaPredictionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI 예측 결과 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">다중모델 융합 기반 저염분수·고수온 확산 경로 및 위험 판단</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="현재 위험 판단 상태" subtitle={`갱신 ${aquaRiskState.updatedAt}`} dummy>
          <RiskBadge level={aquaRiskState.riskLevel} label={aquaRiskState.level} solid />
          <p className="mt-3 text-sm font-semibold text-white/85">{aquaRiskState.headline}</p>
          <p className="mt-1 text-xs text-white/40">예측 신뢰도 {aquaRiskState.confidence}% · 데이터 품질 양호</p>
        </Card>
        <Card title="저염분수 예상 도달" dummy>
          <RiskBadge level={aquaRiskState.lowSalinity.riskLevel} label={aquaRiskState.lowSalinity.eta} solid />
          <p className="mt-3 text-sm text-white/85">{aquaRiskState.lowSalinity.time}</p>
          <p className="mt-1 text-xs text-white/40">{aquaRiskState.lowSalinity.location}</p>
        </Card>
        <Card title="고수온 예상 도달" dummy>
          <RiskBadge level={aquaRiskState.highTemp.riskLevel} label={aquaRiskState.highTemp.eta} solid />
          <p className="mt-3 text-sm text-white/85">{aquaRiskState.highTemp.time}</p>
          <p className="mt-1 text-xs text-white/40">{aquaRiskState.highTemp.location}</p>
        </Card>
      </div>

      <Card
        title="저염분수·고수온 유입 경로 및 영향 범위"
        subtitle={`영향 양식장 ${aquaRiskState.affectedFarmCount}개소 위험권 내 · ${aquaRiskState.affectedFarmDelta}`}
        dummy
      >
        <div className="h-72 w-full overflow-hidden rounded-lg">
          <JejuTileMap markers={AQUA_MARKERS} className="relative h-full w-full" />
        </div>
        <p className="mt-2 text-[11px] text-white/35">확정 관측지점(한경 금등·한경 용수·대정 일과)과 KHOA 실측 지점 — 유입 경로 오버레이는 2단계 구현 예정</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="다중 모델 신뢰도" dummy>
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

        <Card title="데이터 품질 지표" dummy>
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

      <Card title="KHOA 실측 기반 AI 보강 가능성 검토" subtitle={aquaKhoaEnhancementReview.feasible} dummy>
        <p className="text-sm text-white/80">{aquaKhoaEnhancementReview.summary}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-risk-safe">바로 활용 가능</p>
            <ul className="mt-1.5 flex flex-col gap-1.5 text-xs text-white/60">
              {aquaKhoaEnhancementReview.usable.map((u) => (
                <li key={u}>· {u}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-risk-warning">한계</p>
            <ul className="mt-1.5 flex flex-col gap-1.5 text-xs text-white/60">
              {aquaKhoaEnhancementReview.limited.map((l) => (
                <li key={l}>· {l}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
          실증사 요청 필요: {aquaKhoaEnhancementReview.vendorAsk}
        </p>
      </Card>

      <Card title="영향 양식장 목록 (미리보기)" dummy action={<Link to="/aqua/farms" className="text-xs font-semibold text-white/50 hover:text-accent">전체 양식장 보기 →</Link>}>
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
