import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { HEAVY_RAIN_NAV } from "./heavyRainNav"
import { heavyRainAiForecast, heavyRainTopStations, heavyRainTrend, weatherStations } from "../../data/mockHeavyRain"

export function HeavyRainAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">상세 분석 — 제주시 한천 침수경보</h1>
        <p className="mt-1 text-sm text-white/50">강우 추이 및 관측망 근거 데이터</p>
      </div>

      <DomainSubNav items={HEAVY_RAIN_NAV} />

      <Card title="강우 추이 (시간당·누적)" subtitle={`감지 시각 ${heavyRainAiForecast.detectedAt} 기준`}>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heavyRainTrend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
              <Line type="monotone" dataKey="rainfallMm" name="시간당 강우(mm/h)" stroke="#f2731a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumulativeMm" name="누적 강우(mm)" stroke="#8ec21f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="당일 누적 강수량 TOP5" subtitle="실제 서비스는 TOP50 랭킹 — 참고 사이트(demo-10.muhanit.kr) 패턴">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">순위</th>
              <th className="pb-2 font-medium">관측소</th>
              <th className="pb-2 font-medium">지역</th>
              <th className="pb-2 font-medium">당일 누적 강수량</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {heavyRainTopStations.map((s) => (
              <tr key={s.rank}>
                <td className="py-2 font-mono text-white/50">{s.rank}</td>
                <td className="py-2 font-medium text-white/80">{s.stationName}</td>
                <td className="py-2 text-white/40">{s.region}</td>
                <td className={`py-2 font-bold ${s.rank === 1 ? "text-risk-warning" : "text-white/70"}`}>{s.cumulativeMm}mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="AI 조기경보 근거">
        <p className="text-sm text-white/70">{heavyRainAiForecast.aiNote}</p>
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-xs font-medium text-accent">
          {heavyRainAiForecast.confirmNote}
        </div>
      </Card>

      <Card title="기상청 단기예보" subtitle="강수확률·시간당 강수 참고 — 침수경보 자체는 AI 조기경보 근거 기준">
        <VilageForecastPanel />
      </Card>

      <Card title="관측망 근거 데이터">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weatherStations.map((station) => (
            <div key={station.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
              <div>
                <p className="text-sm font-medium text-white/80">{station.name}</p>
                <p className="text-xs text-white/40">
                  {station.value} · 최종 수신 {station.updatedAt}
                </p>
              </div>
              <RiskBadge level={station.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
