import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaFarmTotals, aquaFarms } from "../../data/mockAqua"

export function AquaFarmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">영향 양식장 현황</h1>
        <p className="mt-1 text-sm text-white/50">저염분수·고수온 위험권 내 양식장 영향 상태</p>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-xs font-medium text-white/40">영향 양식장</p>
          <p className="mt-1 text-xl font-bold text-white">총 {aquaFarmTotals.total}개소</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">심각</p>
          <p className="mt-1 text-xl font-bold text-risk-danger">{aquaFarmTotals.danger}개소</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">경계</p>
          <p className="mt-1 text-xl font-bold text-risk-alert">{aquaFarmTotals.alert}개소</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">주의</p>
          <p className="mt-1 text-xl font-bold text-risk-warning">{aquaFarmTotals.warning}개소</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">관심</p>
          <p className="mt-1 text-xl font-bold text-risk-caution">{aquaFarmTotals.caution}개소</p>
        </Card>
      </div>

      <Card title="양식장별 영향 상태" subtitle="목록 클릭 시 상세 정보로 이동">
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
