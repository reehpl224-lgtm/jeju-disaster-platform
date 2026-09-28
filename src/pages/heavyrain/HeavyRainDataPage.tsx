import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import { weatherStations } from "../../data/mockHeavyRain"

const sources = dataSourcesByService.heavyRain

export function HeavyRainDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">호우 위험 판단에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
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

      <Card title="관측소 수집 현황" subtitle="침수센서·우량계·적설계·풍속풍향계 — 자체 관측망" dummy>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {weatherStations.map((station) => (
            <li key={station.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{station.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {station.type} · 최근 수신 {station.updatedAt}
                </p>
              </div>
              <RiskBadge level={station.status} label={station.value} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
