import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { COAST_NAV } from "./coastNav"
import { coastMonitoringDomains } from "../../data/mockCoast"

export function CoastMonitoringPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">현장 모니터링</h1>
          <p className="mt-1 text-sm text-white/50">하천·연안·양식장 통합 현장 대응 상태</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/coast/dispatch"
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
          >
            현장 공조로 이동 →
          </Link>
          <Link
            to="/coast/closure"
            className="rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            상황 종료 처리
          </Link>
        </div>
      </div>

      <DomainSubNav items={COAST_NAV} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  )
}
