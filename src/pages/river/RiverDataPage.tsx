import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import { riverSensorCheck } from "../../data/mockRiver"

const sources = dataSourcesByService.river
const SENSOR_STATUS_LEVEL: Record<"정상" | "이상", "safe" | "danger"> = { 정상: "safe", 이상: "danger" }

export function RiverDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">하천범람 위험 판단에 활용되는 데이터 소스의 실제 연동 가능 여부</p>
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

      <Card title="실측 센서 수집 현황" subtitle="효돈천 수위 센서 — 레이더 수위와 교차검증" dummy>
        {riverSensorCheck.length === 0 && (
          <p className="rounded-lg border border-border-subtle bg-inset p-3 text-sm text-white/50">수위 센서 수집 자료가 없습니다. 수집상태 엑셀에서 항목을 입력하면 이 목록에 표시됩니다.</p>
        )}
        <ul className="flex flex-col divide-y divide-border-subtle">
          {riverSensorCheck.map((sensor) => (
            <li key={sensor.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{sensor.name}</p>
                <p className="mt-0.5 text-xs text-white/35">{sensor.detail}</p>
              </div>
              <RiskBadge level={SENSOR_STATUS_LEVEL[sensor.status]} label={`${sensor.status} · ${sensor.value}`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
