import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { typhoonReports, typhoonSource } from "../../data/mockTyphoon"

const STATUS_LEVEL: Record<(typeof typhoonReports)[number]["status"], "caution" | "warning" | "alert" | "safe"> = {
  예비특보: "caution",
  태풍주의보: "warning",
  태풍경보: "alert",
  "특보 해제": "safe",
}

export function TyphoonHomePage() {
  const latest = typhoonReports[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">태풍 정보</h1>
        <p className="mt-1 text-sm text-white/50">{typhoonSource.note}</p>
      </div>

      <Card title={latest.name} subtitle={`발표 ${latest.issuedAt}`}>
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge level={STATUS_LEVEL[latest.status]} label={latest.status} solid />
          <p className="text-sm text-white/70">{latest.location}</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">이동 속도</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.speedKmh}km/h</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">중심기압</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.pressureHpa}hPa</p>
          </div>
          <div className="rounded-lg border border-border-subtle p-3 text-center">
            <p className="text-[11px] text-white/40">최대풍속</p>
            <p className="mt-1 text-lg font-bold text-white">{latest.maxWindMs}m/s</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-white/35">관련 레거시 시스템: {typhoonSource.relatedLegacySystem}</p>
      </Card>

      <Card title="발표 이력" subtitle="기상청 발표 시각 역순">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {typhoonReports.map((report) => (
            <li key={report.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={STATUS_LEVEL[report.status]} label={report.status} />
                  <p className="font-medium text-white/85">{report.name}</p>
                </div>
                <p className="mt-1 text-xs text-white/40">{report.location}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {report.speedKmh}km/h · {report.pressureHpa}hPa · {report.maxWindMs}m/s
                </p>
              </div>
              <span className="shrink-0 text-xs text-white/35">{report.issuedAt}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
