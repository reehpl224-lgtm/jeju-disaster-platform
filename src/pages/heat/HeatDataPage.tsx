import { Card } from "../../components/ui/Card"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"

export function HeatDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">폭염 대응에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
      </div>

      <Card title="데이터 출처 현황" subtitle="이 서비스가 쓰는 데이터를 실제 연동 가능 여부로 구분">
        <DataSourceCategoryPanel sources={dataSourcesByService.heat} />
      </Card>
    </div>
  )
}
