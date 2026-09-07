import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaJourneys, aquaSummary } from "../../data/mockAqua"

export function AquaHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">양식장 대응 — 저염분수·고수온</h1>
        <p className="mt-1 text-sm text-white/50">AI 하이브리드 예측 기반 저염분수·고수온 경보 및 양식장 e-SOP 대응</p>
      </div>

      <AquaSubNav />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-white/35">실증 대상지</p>
            <p className="mt-0.5 font-medium text-white/80">{aquaSummary.targetArea}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">공간 해상도 목표</p>
            <p className="mt-0.5 font-medium text-white/80">{aquaSummary.spatialResolution}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">저염분수 경보 임계값</p>
            <p className="mt-0.5 font-medium text-white/80">{aquaSummary.salinityThreshold}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">AI 탐지 라벨</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {aquaSummary.aiLabels.map((label) => (
                <code key={label} className="rounded bg-inset px-1.5 py-0.5 text-[11px] text-accent">
                  {label}
                </code>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-white/40">활성 위험</p>
          <p className="mt-1 text-xl font-bold text-risk-danger">{aquaSummary.activeRisk.count}건</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.activeRisk.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">승인 대기</p>
          <p className="mt-1 text-xl font-bold text-risk-warning">{aquaSummary.pendingApproval.count}건</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.pendingApproval.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">영향 양식장</p>
          <p className="mt-1 text-xl font-bold text-risk-caution">{aquaSummary.affectedFarms.count}개소</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.affectedFarms.detail}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">데이터 품질</p>
          <p className="mt-1 text-xl font-bold text-risk-safe">{aquaSummary.dataQuality.percent}%</p>
          <p className="mt-1 text-xs text-white/35">{aquaSummary.dataQuality.detail}</p>
        </Card>
      </div>

      <Card title="대응 여정" subtitle={`최근 갱신 ${aquaSummary.lastUpdated}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {aquaJourneys.map((journey) => (
            <Link
              key={journey.id}
              to={journey.href}
              className="flex flex-col justify-between rounded-lg border border-border-subtle bg-inset p-4 transition hover:border-accent"
            >
              <div>
                <p className="text-sm font-semibold text-white/85">{journey.label}</p>
                <p className="mt-1 text-xs text-white/40">{journey.desc}</p>
              </div>
              <span className="mt-3 text-xs font-bold text-accent">여정 진입 →</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
