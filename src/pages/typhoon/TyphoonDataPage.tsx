import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import { typhoonSource } from "../../data/mockTyphoon"

const sources = dataSourcesByService.typhoon

export function TyphoonDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">태풍 위험 판단에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
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

      <Card title="관측망 현황">
        <p className="text-sm text-white/80">{typhoonSource.note}</p>
        <p className="mt-2 text-xs text-white/40">연계 레거시: {typhoonSource.relatedLegacySystem}</p>
      </Card>
    </div>
  )
}
