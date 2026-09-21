import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { aquaFarmTotals, aquaFarms } from "../../data/mockAqua"

export function AquaFarmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">영향 양식장 현황</h1>
        <p className="mt-1 text-sm text-white/50">저염분수·고수온 위험권 내 양식장 영향 상태</p>
      </div>

      <StatTiles
        items={[
          { label: "영향 양식장", value: `총 ${aquaFarmTotals.total}개소` },
          { label: "심각", value: `${aquaFarmTotals.danger}개소`, tone: "danger" },
          { label: "경계", value: `${aquaFarmTotals.alert}개소`, tone: "alert" },
          { label: "주의", value: `${aquaFarmTotals.warning}개소`, tone: "warning" },
          { label: "관심", value: `${aquaFarmTotals.caution}개소`, tone: "caution" },
        ]}
      />

      <Card
        title="양식장별 영향 상태"
        subtitle={`대표 사례 ${aquaFarms.length}개소 (전체 ${aquaFarmTotals.total}개소 중) · 목록 클릭 시 상세 정보로 이동`}
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaFarms.map((farm) => (
            <li key={farm.id}>
              <Link
                to={`/aqua/farms/${farm.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-inset"
              >
                <div>
                  <p className="text-sm font-semibold text-white/85">{farm.name}</p>
                  <p className="text-xs text-white/40">
                    {farm.region} · {farm.species}
                  </p>
                </div>
                <div className="text-right">
                  <RiskBadge level={farm.level} label={farm.riskType} solid />
                  <p className="mt-1 text-xs text-white/35">
                    도달 D+{farm.etaHours}h
                    {farm.salinity ? ` · 염분 ${farm.salinity} psu` : ""}
                    {farm.temperature ? ` · 수온 ${farm.temperature}°C` : ""}
                    {farm.tempSustainedDays ? ` (지속 ${farm.tempSustainedDays}일째)` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
