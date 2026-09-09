import { Link, Navigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaFarms, aquaSummary } from "../../data/mockAqua"
import { classifySalinity, classifyTemperature, marineStageToRiskLevel } from "../../data/marineAlertThresholds"
import type { AquaFarm } from "../../types/aqua"
import type { RiskLevel } from "../../types/domain"

/** e-SOP 5단계 번호체계(aquaStages와 동일: 관심1·주의2·경계3·심각4·해제5) 기준 표기 */
const STAGE_LABEL: Record<RiskLevel, string> = {
  danger: "4단계 — 심각",
  alert: "3단계 — 경계",
  warning: "2단계 — 주의",
  caution: "1단계 — 관심",
  safe: "해제",
  info: "정보",
  offline: "확인 불가",
}

const RECOMMENDED_ACTION: Record<RiskLevel, string> = {
  danger: "즉시 출하 검토 · 시설 점검 · 인근 양식장 공동 대응",
  alert: "먹이 공급 중단 · 시설 점검",
  warning: "관찰 강화 · 먹이 공급량 조절",
  caution: "정기 관측 유지 · 변동 추이 확인",
  safe: "정기 관측 유지",
  info: "해당 없음",
  offline: "해당 없음",
}

const LEVEL_ORDER: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]

function nextStageCondition(farm: AquaFarm): string {
  const rank = LEVEL_ORDER.indexOf(farm.level)
  if (rank === LEVEL_ORDER.length - 1) {
    return "이미 최고 위험 단계(심각)입니다 — 염분·수온이 정상 기준으로 회복되는 추세가 확인되면 하향 검토"
  }
  const nextLevel = LEVEL_ORDER[rank + 1]
  const conditions: string[] = []
  if (farm.salinity !== undefined) {
    const next = aquaSummary.salinityLevels.find((l) => l.level === nextLevel)
    if (next) conditions.push(`염분 ${next.range} 구간 진입 시`)
  }
  if (farm.temperature !== undefined) {
    const next = aquaSummary.temperatureLevels.find((l) => l.level === nextLevel)
    if (next) conditions.push(`수온 ${next.range} 진입 시`)
  }
  if (conditions.length === 0) return "다음 단계 조건 산출에 필요한 관측값이 없습니다"
  return `${conditions.join(" 또는 ")} 다음 단계로 상향`
}

export function AquaFarmDetailPage() {
  const { farmId } = useParams()
  const farm = aquaFarms.find((f) => f.id === farmId)

  if (!farm) {
    return <Navigate to="/aqua/farms" replace />
  }

  const salinityGrade =
    farm.salinity !== undefined ? STAGE_LABEL[marineStageToRiskLevel(classifySalinity(farm.salinity))] : "영향 없음"
  const temperatureGrade =
    farm.temperature !== undefined
      ? STAGE_LABEL[marineStageToRiskLevel(classifyTemperature(farm.temperature, farm.tempSustainedDays ?? 0))]
      : "영향 없음"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/aqua/farms" className="text-xs font-semibold text-white/40 hover:text-accent">
          ← 영향 양식장 현황으로
        </Link>
        <h1 className="mt-1 text-xl font-bold text-white">{farm.name}</h1>
        <p className="mt-1 text-sm text-white/50">양식장 상세 정보</p>
      </div>

      <AquaSubNav />

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
            <Row label="최종 갱신" value={`2026-09-04 ${aquaSummary.lastUpdated}`} />
          </dl>
        </Card>

        <Card title="e-SOP 단계">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="현재 단계" value={STAGE_LABEL[farm.level]} />
            <Row label="권고 조치" value={RECOMMENDED_ACTION[farm.level]} />
            <Row label="다음 단계 조건" value={nextStageCondition(farm)} />
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
            <Row label="예측 염분 농도" value={farm.salinity ? `${farm.salinity} psu (임계 26.0 psu)` : "영향 없음"} />
            <Row label="경보 등급" value={salinityGrade} />
            <Row label="모델 신뢰도" value="87% (앙상블 3종)" />
            <Row label="위성 관측 일치" value="일치 (2026-09-03)" />
          </dl>
        </Card>
        <Card title="고수온 예측">
          <dl className="flex flex-col gap-2 text-sm">
            <Row
              label="현재 수온"
              value={farm.temperature ? `${farm.temperature}°C${farm.tempSustainedDays ? ` (지속 ${farm.tempSustainedDays}일째)` : ""}` : "영향 없음"}
            />
            <Row label="경보 등급" value={temperatureGrade} />
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
