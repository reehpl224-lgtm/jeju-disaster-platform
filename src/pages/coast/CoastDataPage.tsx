import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import { coastSafetyAssets } from "../../data/mockCoast"

const sources = dataSourcesByService.coast
const ASSET_STATUS_LEVEL: Record<"정상" | "오류", "safe" | "danger"> = { 정상: "safe", 오류: "danger" }

export function CoastDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">연안 안전관리에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
      </div>

      <Card title="데이터 출처 현황" subtitle="이 서비스가 쓰는 데이터를 실제 연동 가능 여부로 구분">
        <DataSourceCategoryPanel sources={sources} />
      </Card>

      <StatTiles
        items={[
          { label: "현재 사용 가능", value: sources.available.length, tone: "safe" },
          { label: "제주 레거시(미적용)", value: sources.legacy.length, tone: "caution" },
          { label: "요청 가능(실증서비스)", value: sources.requestable.length, tone: "info" },
          { label: "현재 없는 데이터", value: sources.missing.length, tone: "offline" },
        ]}
      />

      <Card title="AIoT 스마트폴 수집 현황" subtitle="함덕·협재 스마트폴 — CCTV·기상센서·경보스피커" dummy>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {coastSafetyAssets.map((asset) => (
            <li key={asset.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{asset.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {asset.location} · {asset.detail}
                </p>
              </div>
              <RiskBadge level={ASSET_STATUS_LEVEL[asset.status]} label={asset.status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
