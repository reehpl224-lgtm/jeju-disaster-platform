import { Card } from "../../components/ui/Card"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { TYPHOON_NAV } from "./typhoonNav"
import { typhoonForecastTrack, typhoonReports, typhoonSource } from "../../data/mockTyphoon"

export function TyphoonAnalysisPage() {
  const latest = typhoonReports[0]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">경로 분석 — {latest.name}</h1>
        <p className="mt-1 text-sm text-white/50">{typhoonSource.note}</p>
      </div>

      <DomainSubNav items={TYPHOON_NAV} />

      <Card title="제주 접근 예상 경로" subtitle="기상청 예보 기준 — 자체 산출 아님">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">예상 시각</th>
              <th className="pb-2 font-medium">제주로부터 거리</th>
              <th className="pb-2 font-medium">최대풍속</th>
              <th className="pb-2 font-medium">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {typhoonForecastTrack.map((point, i) => (
              <tr key={point.time}>
                <td className="py-2 font-medium text-white/80">{point.time}</td>
                <td className={`py-2 ${i === 3 ? "font-bold text-risk-alert" : "text-white/60"}`}>{point.distanceFromJejuKm}km</td>
                <td className="py-2 text-white/60">{point.maxWindMs}m/s</td>
                <td className="py-2 text-white/40">{point.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="관련 레거시 시스템">
        <p className="text-sm text-white/70">{typhoonSource.relatedLegacySystem}</p>
        <p className="mt-2 text-xs text-white/40">태풍은 자체 관측망이 없어 이 페이지의 모든 수치는 기상청 발표 자료를 그대로 옮긴 것입니다.</p>
      </Card>
    </div>
  )
}
