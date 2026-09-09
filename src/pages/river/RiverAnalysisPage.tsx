import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import {
  khoaMoseulpoTide,
  riverCctv,
  riverDataConfidence,
  riverImpact,
  riverInfra,
  riverRiskBasis,
  riverSensorCheck,
  riverSuddenRainAlert,
  riverTideCorrelation,
} from "../../data/mockRiver"

export function RiverAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상황 분석 — 효돈천(돈내코·쇠소깍)</h1>
        <p className="mt-1 text-sm text-white/50">위험 근거 데이터 및 센서 교차 검증</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card title="돌발 강우 AI 조기경고" subtitle={`감지 시각 ${riverSuddenRainAlert.detectedAt} · ${riverSuddenRainAlert.trendNote}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-medium text-white/40">기상청 예보</p>
              <p className="mt-1 text-lg font-bold text-white/70">{riverSuddenRainAlert.forecastMm}mm</p>
            </div>
            <span className="text-xl text-white/30">→</span>
            <div>
              <p className="text-[11px] font-medium text-white/40">실측</p>
              <p className="mt-1 text-lg font-bold text-risk-warning">{riverSuddenRainAlert.observedMm}mm</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
              AI 조기경고 · 예보 대비 +
              {Math.round(((riverSuddenRainAlert.observedMm - riverSuddenRainAlert.forecastMm) / riverSuddenRainAlert.forecastMm) * 100)}%
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/50">{riverSuddenRainAlert.aiNote}</p>
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
          {riverSuddenRainAlert.confirmNote}
        </div>
      </Card>

      <Card title="위험 근거 데이터">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="강우량 (1h 누적)" value={riverRiskBasis.rainfall.value} detail={riverRiskBasis.rainfall.detail} trend={riverRiskBasis.rainfall.trend} />
          <Metric label="현재 수위" value={riverRiskBasis.waterLevel.value} detail={riverRiskBasis.waterLevel.detail} trend={riverRiskBasis.waterLevel.trend} />
          <Metric label="강우레이더 예측" value={riverRiskBasis.radar.value} detail={riverRiskBasis.radar.detail} trend={riverRiskBasis.radar.confidence} />
          <Metric label="유역 포화도" value={riverRiskBasis.saturation.value} detail={riverRiskBasis.saturation.detail} trend={riverRiskBasis.saturation.grade} />
        </div>
      </Card>

      <Card
        title="수위 × 조수 연계 시계열 (효돈천 쇠소깍 · 감조구간)"
        subtitle={`${riverTideCorrelation.note} · 다음 만조 ${riverTideCorrelation.nextHighTide}`}
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riverTideCorrelation.series} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
              <ReferenceLine y={riverTideCorrelation.boundaryLevelM} stroke="#f2731a" strokeDasharray="4 4" label={{ value: "경계 수위 3.5m", fill: "#f2731a", fontSize: 11, position: "insideTopLeft" }} />
              <Line type="monotone" dataKey="waterLevelM" name="쇠소깍 수위(m)" stroke="#8ec21f" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tideLevelM" name="조위(m)" stroke="#0054a3" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          14:30까지 관측값, 이후는 예측값입니다. 상류 돈내코 구간은 조수 영향이 없어 이 연계 차트에서 제외됩니다.
        </p>
      </Card>

      <Card
        title="실측 조위 참고 — 국립해양조사원(KHOA) 모슬포 조위관측소"
        subtitle={`${khoaMoseulpoTide.location} · ${khoaMoseulpoTide.distanceNote}`}
      >
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={khoaMoseulpoTide.series} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" unit="cm" />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="tideLevelCm" name="조위(cm)" stroke="#0054a3" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          data.go.kr 공공API 실연동 — {khoaMoseulpoTide.observedAt} 기준 실측값(정적 스냅샷). 현재{" "}
          {khoaMoseulpoTide.series.at(-1)?.tideLevelCm}cm ·{" "}
          {khoaMoseulpoTide.series[0].tideLevelCm > (khoaMoseulpoTide.series.at(-1)?.tideLevelCm ?? 0) ? "간조 진행 중(하강)" : "만조 진행 중(상승)"}
        </p>
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
