import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { PlanItemsCard } from "../../components/ui/PlanItemsCard"
import { coastVerification, coastInstallReview } from "../../data/mockMeetingItems"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { MarineObservationPanel } from "../../components/ui/MarineObservationPanel"
import { coastMonitoringDomains, coastStageCriteria } from "../../data/mockCoast"
import { COAST_COMBINE_RULES, classifyCoastRisk } from "../../data/coastAlertThresholds"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"

// 결합 규칙 적용 예시 — KHOA 부이 실측 스냅샷(조위 정보 없음 → 평시 가정, AI 이벤트 없음)
const BUOY_EXAMPLES = khoaBuoyMarineConditions.map((b) => ({ ...b, result: classifyCoastRisk({ waveM: b.waveHeightM, windMs: b.windSpeedMs }) }))

export function CoastMonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">현장 모니터링</h1>
          <p className="mt-1 text-sm text-white/50">연안 안전관리 현장 대응 상태</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/coast/dispatch"
            className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"
          >
            현장 공조로 이동 →
          </Link>
          <Link
            to="/coast/closure"
            className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            상황 종료 처리
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {coastMonitoringDomains.map((domain) => (
          <Card key={domain.id}>
            <p className="text-xs font-medium text-white/40">{domain.label}</p>
            <div className="mt-1">
              <RiskBadge level={domain.level} label={domain.status} solid />
            </div>
            <p className="mt-2 text-xs text-white/35">{domain.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="도·서귀포시 공동 대응">
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
              <p className="text-white/80">제주도 상황실</p>
              <RiskBadge level="info" label="대응 중" />
            </li>
            <li className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
              <p className="text-white/80">서귀포시 상황실</p>
              <RiskBadge level="offline" label="대기 중" />
            </li>
          </ul>
          <p className="mt-2 text-xs text-white/35">공조 채널 상태: 연결됨</p>
        </Card>

        <Card title="현장 영상·탐지 메타데이터">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-xs text-white/30">
            현장 영상 마스킹 · AI 탐지 이벤트 (원본 미표시)
          </div>
        </Card>
      </div>

      <Card title="기상청 단기예보" subtitle="풍속·강수 참고 — 현장 위험 판단 자체는 AI 탐지·실측 기준">
        <VilageForecastPanel />
      </Card>

      <Card
        title="실시간 해양관측 — 기상청 API허브"
        subtitle="apihub.kma.go.kr 실연동(sea_obs.php) — 아래 표의 '서귀포 해수온 부이 결측'을 보완하는 인근 실측 참고치"
      >
        <MarineObservationPanel />
      </Card>

      <Card title="GIS 위험 위치·영향 범위">
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          하천 범람 영향 범위 · 연안 위험 구역 · 양식장 위험 반경
        </div>
      </Card>

      <Card title="센서·실측값 교차 검증" subtitle="데이터 지연·결측은 일반 경보와 별도 표시됩니다">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">관측소</th>
              <th className="pb-2 font-medium">항목</th>
              <th className="pb-2 font-medium">AI 예측</th>
              <th className="pb-2 font-medium">실측값</th>
              <th className="pb-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            <tr>
              <td className="py-2 text-white/70">한천 수위센서</td>
              <td className="py-2 text-white/40">수위</td>
              <td className="py-2 text-white/40">2.30m</td>
              <td className="py-2 text-white/40">2.34m</td>
              <td className="py-2"><RiskBadge level="safe" label="정상" /></td>
            </tr>
            <tr>
              <td className="py-2 text-white/70">이호 CCTV</td>
              <td className="py-2 text-white/40">위험행동</td>
              <td className="py-2 text-white/40">탐지 2건</td>
              <td className="py-2 text-white/40">확인 2건</td>
              <td className="py-2"><RiskBadge level="safe" label="정상" /></td>
            </tr>
            <tr>
              <td className="py-2 text-white/70">서귀포 해수온 부이</td>
              <td className="py-2 text-white/40">수온</td>
              <td className="py-2 text-white/40">29.5°C</td>
              <td className="py-2 text-white/40">-</td>
              <td className="py-2"><RiskBadge level="offline" label="결측" /></td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="연안 위험단계 상태 구간" subtitle="출처: TP-P22_002_플랫폼 데이터 리스트.xlsx — 유의파고·풍속·조위·위험 범위 기준 5단계 (원본 '경보' = 앱 '경계')">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs text-white/40">
                <th className="font-medium">단계</th>
                <th className="font-medium">유의파고</th>
                <th className="font-medium">풍속</th>
                <th className="font-medium">조위(수위)</th>
                <th className="font-medium">위험 범위</th>
              </tr>
            </thead>
            <tbody>
              {coastStageCriteria.map((c) => (
                <tr key={c.label} className="border-t border-border-subtle align-top" title={c.action}>
                  <td className="whitespace-nowrap py-1.5">
                    <RiskBadge level={c.level} label={c.label} />
                  </td>
                  <td className="text-white/80">{c.waveHeight}</td>
                  <td className="text-white/80">{c.windSpeed}</td>
                  <td className="text-xs text-white/70">{c.tide}</td>
                  <td className="text-xs text-white/55">{c.riskRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-lg border border-border-subtle p-3">
          <p className="text-xs font-bold text-white/70">지표 결합 규칙 (임의 설정 — 원본에 규칙 없음, 공식 기준 확정 시 수정)</p>
          <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4 text-[11px] text-white/60">
            {COAST_COMBINE_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs font-bold text-white/70">적용 예시 — KHOA 해양관측부이 실측 스냅샷</p>
          <ul className="mt-1.5 flex flex-col divide-y divide-border-subtle">
            {BUOY_EXAMPLES.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <div>
                  <p className="font-medium text-white/80">
                    {b.stationName} <span className="text-white/35">({b.stationCode} · {b.observedAt})</span>
                  </p>
                  <p className="mt-0.5 text-white/40">{b.result.reasons.join(" · ")}</p>
                </div>
                <RiskBadge level={b.result.level} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-white/30">부이는 외해·해협 지점이라 해수욕장 현장값이 아니며, 조위 정보가 없어 평시로 가정했습니다.</p>
        </div>
      </Card>

      <PlanItemsCard title="성능 검증 계획" subtitle="모의 상황 연출·시뮬레이션 기반 감지율·미탐률 검증" items={coastVerification} />

      <PlanItemsCard title="설치·장비 사전 검토" subtitle="카메라 위치·성능, 비식별화, 토목 협의" items={coastInstallReview} />
    </div>
  )
}
