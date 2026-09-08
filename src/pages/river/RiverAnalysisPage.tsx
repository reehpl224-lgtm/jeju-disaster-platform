import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import {
  riverCctv,
  riverDataConfidence,
  riverImpact,
  riverInfra,
  riverRiskBasis,
  riverSensorCheck,
} from "../../data/mockRiver"

export function RiverAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상황 분석 — 효돈천(돈내코·쇠소깍)</h1>
        <p className="mt-1 text-sm text-white/50">위험 근거 데이터 및 센서 교차 검증</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card title="위험 근거 데이터">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="강우량 (1h 누적)" value={riverRiskBasis.rainfall.value} detail={riverRiskBasis.rainfall.detail} trend={riverRiskBasis.rainfall.trend} />
          <Metric label="현재 수위" value={riverRiskBasis.waterLevel.value} detail={riverRiskBasis.waterLevel.detail} trend={riverRiskBasis.waterLevel.trend} />
          <Metric label="강우레이더 예측" value={riverRiskBasis.radar.value} detail={riverRiskBasis.radar.detail} trend={riverRiskBasis.radar.confidence} />
          <Metric label="유역 포화도" value={riverRiskBasis.saturation.value} detail={riverRiskBasis.saturation.detail} trend={riverRiskBasis.saturation.grade} />
        </div>
      </Card>

      <Card title="수위 시계열 예측 (효돈천 쇠소깍 · 향후 3시간)">
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          수위 시계열 차트 — 관측값·예측값·경계선 표시
        </div>
      </Card>

      <Card title="영향 범위 GIS">
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          GIS 영향 범위 지도 — 범람 예상 구역·대피 경로·통제 지점 표시
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="침수 예상 면적" value={riverImpact.area} />
          <Field label="영향 주민" value={riverImpact.population} />
          <Field label="주요 영향 시설" value={riverImpact.facilities} />
          <Field label="대피 경로 확보" value={riverImpact.evacuationRoutes} />
        </div>
      </Card>

      <Card title="현장 영상 및 센서 교차 검증">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {riverCctv.map((cctv) => (
            <div key={cctv.id} className="rounded-lg border border-border-subtle p-3">
              <div className="flex h-24 items-center justify-center rounded-lg bg-black/30 text-xs text-white/30">
                현장 CCTV 마스킹 이미지 (탐지 메타데이터 표시)
              </div>
              <p className="mt-2 text-sm font-semibold text-white/80">현장 CCTV — {cctv.label}</p>
              <p className="text-xs text-white/40">탐지 시각 {cctv.time} · 수위 변화 감지 {cctv.detected} · 영상 품질 {cctv.quality}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {riverSensorCheck.map((sensor) => (
            <div key={sensor.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
              <div>
                <p className="text-sm font-medium text-white/80">{sensor.name}</p>
                <p className="text-xs text-white/40">
                  측정값 {sensor.value} · {sensor.detail}
                </p>
              </div>
              <RiskBadge level={sensor.status === "정상" ? "safe" : "danger"} label={sensor.status} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="데이터 신뢰도 종합" subtitle={riverDataConfidence.note}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MiniStat label="강우 센서" value={riverDataConfidence.rain} />
          <MiniStat label="수위 센서" value={riverDataConfidence.waterLevel} />
          <MiniStat label="강우레이더" value={riverDataConfidence.radar} />
          <MiniStat label="현장 영상" value={riverDataConfidence.video} />
          <MiniStat label="종합 신뢰도" value={riverDataConfidence.overall} highlight />
        </div>
      </Card>

      <Card title="레거시 연계 데이터" subtitle={riverInfra.legacy.note}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="제주시 침수정보센서" value={`${riverInfra.legacy.jeju}개소`} />
          <MiniStat label="서귀포시 침수정보센서" value={`${riverInfra.legacy.seogwipo}개소`} />
          <MiniStat label="총 연계 규모" value={`${riverInfra.legacy.total}개소`} highlight />
        </div>
      </Card>
    </div>
  )
}

function Metric({ label, value, detail, trend }: { label: string; value: string; detail: string; trend: string }) {
  return (
    <div className="rounded-lg border border-border-subtle p-3">
      <p className="text-xs font-medium text-white/40">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/35">{detail}</p>
      <p className="text-[11px] font-semibold text-risk-warning">{trend}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="text-sm font-medium text-white/85">{value}</p>
    </div>
  )
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border-subtle p-2.5 text-center">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className={`mt-1 text-sm font-bold ${highlight ? "text-accent" : "text-white/80"}`}>{value}</p>
    </div>
  )
}
