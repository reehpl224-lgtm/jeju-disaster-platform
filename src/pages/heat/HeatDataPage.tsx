import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"

const sources = dataSourcesByService.heat

export function HeatDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">폭염 대응에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
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
        <p className="text-sm text-white/80">자체 실측 장비 없음 — 기상청 폭염특보·단기예보를 그대로 표출합니다.</p>
        <p className="mt-2 text-xs text-white/40">무더위쉼터 위치·정원은 데이터 소스가 아닌 자산현황이라 별도 관리 — 홈 화면 참고</p>
      </Card>
    </div>
  )
}
