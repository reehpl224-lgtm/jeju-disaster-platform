import { Link, Navigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { aquaFarms } from "../../data/mockAqua"

export function AquaFarmDetailPage() {
  const { farmId } = useParams()
  const farm = aquaFarms.find((f) => f.id === farmId)

  if (!farm) {
    return <Navigate to="/aqua/farms" replace />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/aqua/farms" className="text-xs font-semibold text-white/40 hover:text-accent">
          ← 영향 양식장 현황으로
        </Link>
        <h1 className="mt-1 text-xl font-bold text-white">{farm.name}</h1>
        <p className="mt-1 text-sm text-white/50">양식장 상세 정보</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="기본 정보">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="위치" value={farm.region} />
            <Row label="면적" value={farm.area ?? "정보 없음"} />
            <Row label="품종" value={farm.species} />
            <Row label="담당자" value={farm.manager ?? "정보 없음"} />
            <Row label="등록일" value={farm.registeredAt ?? "정보 없음"} />
          </dl>
        </Card>

        <Card title="현재 위험 상태">
          <RiskBadge level={farm.level} label={farm.riskType} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="예상 도달" value={`D+${farm.etaHours}시간`} />
            <Row label="경보 상태" value="승인 완료" />
            <Row label="최종 갱신" value="2026-09-04 14:32" />
          </dl>
        </Card>

        <Card title="e-SOP 단계">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="현재 단계" value="2단계 — 주의" />
            <Row label="권고 조치" value="먹이 공급 중단 · 시설 점검" />
            <Row label="다음 단계 조건" value="염분 25.0 psu 이하 지속 6시간" />
          </dl>
        </Card>
      </div>

      <Card title="위치 및 영향 범위">
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          양식장 GIS 지도 — 위험 반경 및 저염분수 유입 경로 오버레이 (2단계 상세 구현 예정)
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="저염분수 예측">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="예측 염분 농도" value={farm.salinity ? `${farm.salinity} psu (임계 25.0 psu)` : "영향 없음"} />
            <Row label="모델 신뢰도" value="87% (앙상블 3종)" />
            <Row label="위성 관측 일치" value="일치 (2026-09-03)" />
          </dl>
        </Card>
        <Card title="고수온 예측">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="현재 수온" value={farm.temperature ? `${farm.temperature}°C` : "영향 없음"} />
            <Row label="경보 등급" value="주의 (1단계)" />
            <Row label="모델 신뢰도" value="79% (단일 모델)" />
          </dl>
        </Card>
      </div>

      <Card title="예측·실측 시계열 비교" subtitle="72시간 기준">
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          저염분수 농도 및 수온 시계열 그래프 — 예측값(점선)·실측값(실선)
        </div>
      </Card>
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
