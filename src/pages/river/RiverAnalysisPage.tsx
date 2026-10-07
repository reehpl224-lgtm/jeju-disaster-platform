import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../../components/ui/Card"
import { KHOA_TIDE_SNAPSHOT } from "../../components/ui/dataSource"
import { khoaSource, useKhoaLive } from "../../data/khoaLive"
import { LIVE } from "../../components/ui/dataSource"
import { PlanItemsCard } from "../../components/ui/PlanItemsCard"
import { riverPipeline, riverHydrology, riverPredictionOutput } from "../../data/mockMeetingItems"
import { riverFlowRatioAnalysis } from "../../data/riverFlowRatioAnalysis"
import { IS_SIMULATION_MODE } from "../../data/appEnv"
import { useRiverRun } from "../../data/riverRunHooks"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import {
  khoaMoseulpoTide,
  riverCctv,
  riverDataConfidence,
  riverImpact,
  riverInfra,
  riverRiskBasis,
  riverSensorCheck,
  riverStatuses,
  riverSuddenRainAlert,
  riverStageCriteria,
  riverTideCorrelation,
} from "../../data/mockRiver"

export function RiverAnalysisPage() {
  useKhoaLive() // 해양조사원 실측이 도착하면 다시 그린다
  const run = useRiverRun()
  const flowRatio = riverFlowRatioAnalysis(run)
  const observedSiteCount = Object.values(flowRatio.latest).filter(Boolean).length
  const riskSiteCount = Object.values(run.pointState).filter((point) => point && point.level !== "safe").length
  const impactValue = (value: string) => value === "해당 없음" || value === "-" ? "영향 모델 미연동" : value

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상황 분석 — 효돈천(돈내코·쇠소깍)</h1>
        <p className="mt-1 text-sm text-white/50">위험 근거 데이터 및 센서 교차 검증</p>
      </div>

      <Card title="시나리오 관측 — 계획홍수량 대비 비율(Q%)" subtitle="현재 시나리오 시각까지의 입력값 · 지점별 다음 관측 전에는 직전 값 유지" dummy>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["돈내코", "쇠소깍"] as const).map((location) => {
            const reading = flowRatio.latest[location]
            const status = riverStatuses.find((item) => item.name.includes(location))
            return (
              <div key={location} className="rounded-lg border border-border-subtle bg-inset p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white/80">{location}</span>
                  {reading && <RiskBadge level={status?.level ?? "safe"} label={status?.stage ?? "-"} />}
                </div>
                <p className="mt-2 text-xl font-bold text-white">{reading ? `${reading.flowRatioPercent}%` : "관측 없음"}</p>
                <p className="mt-1 text-xs text-white/45">{reading ? `마지막 관측 ${reading.observedAt}` : "시나리오 첫 관측 대기"}</p>
              </div>
            )
          })}
        </div>
        {flowRatio.series.length > 0 ? (
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flowRatio.series} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
                <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" unit="%" />
                <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
                <Line type="monotone" dataKey="donnaeko" name="돈내코 Q%" stroke="#8ec21f" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="soesokkak" name="쇠소깍 Q%" stroke="#0054a3" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-border-subtle bg-inset p-3 text-sm text-white/50">시나리오를 업로드하고 첫 시점을 진행하면 추이가 표시됩니다.</p>
        )}
      </Card>

      <Card title={IS_SIMULATION_MODE ? "시나리오 분석 — 모의 강우 참고" : "돌발 강우 AI 조기경고"} subtitle={`감지 시각 ${riverSuddenRainAlert.detectedAt} · ${riverSuddenRainAlert.trendNote}`} dummy>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "모의 기준" : "기상청 예보"}</p>
              <p className="mt-1 text-lg font-bold text-white/70">{riverSuddenRainAlert.forecastMm}{IS_SIMULATION_MODE ? "mm/h" : "mm"}</p>
            </div>
            <span className="text-xl text-white/30">→</span>
            <div>
              <p className="text-[11px] font-medium text-white/40">{IS_SIMULATION_MODE ? "모의 강우" : "실측"}</p>
              <p className="mt-1 text-lg font-bold text-risk-warning">{riverSuddenRainAlert.observedMm}{IS_SIMULATION_MODE ? "mm/h" : "mm"}</p>
            </div>
            {IS_SIMULATION_MODE ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1 text-xs font-bold text-white/50">
                시나리오 참고 · 독립 AI 판정 안 함
              </span>
            ) : riverSuddenRainAlert.level !== "safe" && riverSuddenRainAlert.forecastMm > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                AI 조기경고 · 예보 대비 +
                {Math.round(((riverSuddenRainAlert.observedMm - riverSuddenRainAlert.forecastMm) / riverSuddenRainAlert.forecastMm) * 100)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1 text-xs font-bold text-white/50">
                {riverSuddenRainAlert.label} · 감지 없음
              </span>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-white/50">{riverSuddenRainAlert.aiNote}</p>
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
          {riverSuddenRainAlert.confirmNote}
        </div>
      </Card>

      <Card title="하천 위험단계 상태 구간" subtitle="출처: TP-P22_002_플랫폼 데이터 리스트.xlsx — 계획홍수량(Q%)·수위 상태 기준 5단계 (원본 '경보' = 앱 '경계')">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/40">
              <th className="font-medium">단계</th>
              <th className="font-medium">계획홍수량(Q%)</th>
              <th className="font-medium">수위 상태</th>
              <th className="font-medium">주요 대응·통제</th>
            </tr>
          </thead>
          <tbody>
            {riverStageCriteria.map((c) => (
              <tr key={c.label} className="border-t border-border-subtle align-top">
                <td className="whitespace-nowrap py-1.5">
                  <RiskBadge level={c.level} label={c.label} />
                </td>
                <td className="text-white/80">{c.flowRatio}</td>
                <td className="text-white/80">{c.waterState}</td>
                <td className="text-xs text-white/55">{c.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-white/35">원본은 관심 20~30% 다음이 주의 50%로 30~50%가 비어 있어, 관심을 50% 미만까지 연장해 임의로 이었습니다(공식 기준 확정 시 수정).</p>
      </Card>

      <Card title="위험 근거 데이터" dummy>
        <StatTiles
          items={[
            { label: IS_SIMULATION_MODE ? "모의 강우량 (시간당)" : "강우량 (1h 누적)", value: riverRiskBasis.rainfall.value, sub: `${riverRiskBasis.rainfall.detail} · ${riverRiskBasis.rainfall.trend}` },
            { label: IS_SIMULATION_MODE ? "수위 지표(Q%)" : "현재 수위", value: riverRiskBasis.waterLevel.value, sub: `${riverRiskBasis.waterLevel.detail} · ${riverRiskBasis.waterLevel.trend}` },
            { label: IS_SIMULATION_MODE ? "모의 강우레이더" : "강우레이더 예측", value: riverRiskBasis.radar.value, sub: `${riverRiskBasis.radar.detail} · ${riverRiskBasis.radar.confidence}` },
            { label: IS_SIMULATION_MODE ? "모의 유역 포화도" : "유역 포화도", value: riverRiskBasis.saturation.value, sub: `${riverRiskBasis.saturation.detail} · ${riverRiskBasis.saturation.grade}` },
          ]}
        />
      </Card>

      <Card
        title="수위 × 조수 연계 시계열 (효돈천 쇠소깍 · 감조구간)"
        subtitle={`${riverTideCorrelation.note} · 다음 만조 ${riverTideCorrelation.nextHighTide}`}
        dummy
      >
        {riverTideCorrelation.series.length > 0 ? <div className="h-56 w-full">
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
        </div> : <p className="rounded-lg border border-border-subtle bg-inset p-3 text-sm text-white/50">수위·조위 관측 자료가 없어 상관 그래프를 표시할 수 없습니다. 이 파일럿은 Q%만 입력받습니다.</p>}
        {riverTideCorrelation.series.length > 0 && <p className="mt-2 text-[11px] text-white/35">
          {riverTideCorrelation.series.filter((p) => !p.predicted).at(-1)?.time}까지 관측값, 이후는 예측값입니다. 상류 돈내코 구간은 조수 영향이 없어 이 연계 차트에서 제외됩니다.
        </p>}
      </Card>

      <Card
        title="실측 조위 참고 — 국립해양조사원(KHOA) 모슬포 조위관측소"
        source={khoaSource(KHOA_TIDE_SNAPSHOT)}
        subtitle={`${khoaMoseulpoTide.location} · ${khoaMoseulpoTide.distanceNote}`}
      >
        {khoaMoseulpoTide.series.length > 0 && <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={khoaMoseulpoTide.series} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" unit="cm" />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="tideLevelCm" name="조위(cm)" stroke="#0054a3" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>}
        <p className="mt-2 text-[11px] text-white/35">
          {khoaMoseulpoTide.series.length === 0 ? (
            "조위 실측을 아직 받지 못했습니다 — 프록시 연결 전이거나 해양조사원 응답이 없는 상태입니다."
          ) : (
            <>
              data.go.kr 공공API 실연동 — {khoaMoseulpoTide.observedAt} 기준 실측값(접속할 때 받은 값). 현재 {khoaMoseulpoTide.series.at(-1)?.tideLevelCm}cm ·{" "}
              {khoaMoseulpoTide.series[0].tideLevelCm > (khoaMoseulpoTide.series.at(-1)?.tideLevelCm ?? 0) ? "간조 진행 중(하강)" : "만조 진행 중(상승)"}
            </>
          )}
        </p>
      </Card>

      <Card title="기상청 단기예보" subtitle="강수확률·시간당 강수 참고 — 범람 위험 판단 자체는 위 AI 조기경고·수위 근거 기준" source={LIVE}>
        <VilageForecastPanel />
      </Card>

      <Card title="영향 범위 GIS" dummy>
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          공간 영향 모델 미연동 — Q% 입력값만으로 침수 구역을 그릴 수 없습니다.
        </div>
        <p className="mt-3 text-sm text-white/65">현재 Q% 위험 지점: {run.playheadIndex >= 0 ? `${riskSiteCount}/2곳` : "첫 관측 전"}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="침수 예상 면적" value={impactValue(riverImpact.area)} />
          <Field label="영향 주민" value={impactValue(riverImpact.population)} />
          <Field label="주요 영향 시설" value={impactValue(riverImpact.facilities)} />
          <Field label="대피 경로 확보" value={riverImpact.evacuationRoutes === "-" ? "경로 정보 미연동" : riverImpact.evacuationRoutes} />
        </div>
        <p className="mt-2 text-xs text-white/40">면적·인구·시설·대피 경로는 공간 영향 자료가 있어야 산출할 수 있습니다.</p>
      </Card>

      <Card title="현장 영상 및 센서 교차 검증" dummy>
        {riverCctv.length === 0 && <p className="rounded-lg border border-border-subtle bg-inset p-3 text-sm text-white/50">현장 CCTV 영상·탐지 정보가 연결되지 않았습니다. Q% 판정에는 영상 확인 결과를 사용하지 않습니다.</p>}
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

        {riverSensorCheck.length === 0 && <p className="mt-4 rounded-lg border border-border-subtle bg-inset p-3 text-sm text-white/50">수위 센서 수집 자료가 없습니다. 별도 수집상태 엑셀에서 센서 현황을 입력할 수 있습니다.</p>}
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
        <p className="mt-2 text-xs text-white/40">Q%만으로 실제 수위(m)나 센서 통신 상태를 추정하지 않습니다.</p>
      </Card>

      <Card title="데이터 신뢰도 종합" subtitle={`Q% 입력 ${observedSiteCount}/2곳 · 다른 관측망은 별도 연동 필요`} dummy>
        <StatTiles
          items={[
            { label: "Q% 시나리오 입력", value: `${observedSiteCount}/2곳` },
            { label: "강우 센서", value: riverDataConfidence.rain === "-" ? "미수신" : riverDataConfidence.rain },
            { label: "수위 센서", value: riverDataConfidence.waterLevel === "-" ? "미수신" : riverDataConfidence.waterLevel },
            { label: "강우레이더", value: riverDataConfidence.radar === "-" ? "미수신" : riverDataConfidence.radar },
            { label: "현장 영상", value: riverDataConfidence.video === "-" ? "미수신" : riverDataConfidence.video },
            { label: "종합 신뢰도", value: riverDataConfidence.overall === "-" ? "산정 불가" : riverDataConfidence.overall, highlight: true },
          ]}
        />
        <p className="mt-2 text-xs text-white/40">Q% 입력 여부와 교차검증 신뢰도는 서로 다른 지표입니다. {riverDataConfidence.note}</p>
      </Card>

      <Card title="레거시 연계 데이터" subtitle={riverInfra.legacy.note}>
        <StatTiles
          items={[
            { label: "제주시 침수정보센서", value: `${riverInfra.legacy.jeju}개소` },
            { label: "서귀포시 침수정보센서", value: `${riverInfra.legacy.seogwipo}개소` },
            { label: "총 연계 규모", value: `${riverInfra.legacy.total}개소`, highlight: true },
          ]}
        />
      </Card>

      <PlanItemsCard
        title="AI 범람 예측 출력 항목 (미리보기)"
        subtitle="실증사 AI 엔진이 컨트롤타워로 보낼 예측 결과 형식 — 연동되면 이 항목들이 실제 값으로 채워짐"
        items={riverPredictionOutput}
        source="출처: 하천범람 실증사(소다시스템) 착수보고 발표자료의 NGSI-LD 예시 — 표시된 값은 형식 예시이며 효돈천 현재 값이 아닙니다."
      />

      <PlanItemsCard title="제주 수문 특성 반영" subtitle="건천·급경사·조석 영향에 특화된 AI 모델" items={riverHydrology} />

      <PlanItemsCard title="데이터 파이프라인" subtitle="ETRI 수문 빅데이터 · LDB 표준 · AX 허브 융합 데이터셋" items={riverPipeline} />
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

