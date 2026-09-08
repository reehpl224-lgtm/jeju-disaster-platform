import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { HEAT_NAV } from "./heatNav"
import { heatLevelInfo, heatTrend } from "../../data/mockHeat"

export function HeatAnalysisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">특보 현황</h1>
        <p className="mt-1 text-sm text-white/50">{heatLevelInfo.criteria}</p>
      </div>

      <DomainSubNav items={HEAT_NAV} />

      <Card title="현재 특보 단계" subtitle={`갱신 ${heatLevelInfo.updatedAt}`}>
        <div className="flex items-center gap-4">
          <RiskBadge level={heatLevelInfo.level} label={heatLevelInfo.label} solid />
          <p className="text-lg font-bold text-white">체감온도 {heatLevelInfo.feelsLikeC}℃</p>
        </div>
      </Card>

      <Card title="최근 5일 기온 추이" subtitle="최고기온 · 체감온도">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={heatTrend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" />
              <YAxis tick={{ fontSize: 11, fill: "#ffffff88" }} stroke="#3a3b3c" domain={[28, 36]} />
              <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#ffffffaa" }} />
              <Line type="monotone" dataKey="maxTempC" name="최고기온(℃)" stroke="#0054a3" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="feelsLikeC" name="체감온도(℃)" stroke="#f2731a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-white/35">체감온도 33℃ 이상이 2일 이상 지속되면 주의보 유지 기준에 해당합니다.</p>
      </Card>
    </div>
  )
}
