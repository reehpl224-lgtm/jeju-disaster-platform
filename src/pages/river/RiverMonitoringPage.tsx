import { RainfallObservationPanel } from "../../components/ui/RainfallObservationPanel"
import { Card } from "../../components/ui/Card"
import { LIVE } from "../../components/ui/dataSource"
import { RiverForecastBlock, RiverPointsBlock, TideBlock } from "../dashboard/PilotBatchBlocks"

/**
 * 하천범람 실시간 모니터링 — 효돈천 AIoT 계측망(실증사) 실데이터가 아직 없어 관측점·스마트폴·수위 예측·수위×조위는
 * 실증 3사 샘플 배치(src/data/pilotBatch)의 임의 값을 쓴다(각 블록에 "샘플"·"실증사 연계 전 임의 데이터" 표시).
 * 실증사 데이터가 오면 public/data/pilot-batch.json을 같은 모양으로 두면 이 화면도 같이 바뀐다.
 * 우량 관측은 기상청 API허브 실연동이다.
 */
export function RiverMonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">실시간 모니터링</h1>
        <p className="mt-1 text-sm text-white/50">효돈천(돈내코·쇠소깍) 관측점·수위·우량 현황 — 관측점 값은 실증사 연계 전 임의 샘플입니다</p>
      </div>

      <Card title="실시간 우량 관측 — 기상청 API허브" subtitle="apihub.kma.go.kr 실연동(AWS 매분자료)" source={LIVE}>
        <RainfallObservationPanel />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card dummy>
          <RiverPointsBlock />
        </Card>
        <Card dummy>
          <RiverForecastBlock />
        </Card>
      </div>

      <Card dummy>
        <TideBlock />
      </Card>
    </div>
  )
}
