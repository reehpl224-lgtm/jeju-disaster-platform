import { useEffect, useState } from "react"
import { fetchRiverReferenceRainfall } from "../../data/rainfallApi"
import type { RainfallStation } from "../../types/rainfallApi"

function formatTm(tm: string) {
  if (!tm || tm.length < 12) return "-"
  return `${tm.slice(4, 6)}/${tm.slice(6, 8)} ${tm.slice(8, 10)}:${tm.slice(10, 12)}`
}

/** 기상청 API허브 방재기상관측(AWS) 매분자료 실시간 연동 패널 — /river(하천범람)용. */
export function RainfallObservationPanel() {
  const [stations, setStations] = useState<RainfallStation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchRiverReferenceRainfall()
      .then((res) => {
        if (!cancelled) setStations(res)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="py-4 text-center text-xs text-white/30">불러오는 중...</p>

  if (error) {
    return (
      <p className="rounded-lg border border-risk-danger-bg bg-risk-danger-bg/20 p-2.5 text-[11px] text-risk-danger">{error}</p>
    )
  }

  if (!stations || stations.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stations.map((s) => (
          <div key={s.stnId} className="rounded-lg border border-border-subtle p-3">
            <p className="text-sm font-semibold text-white/80">{s.label}</p>
            <p className="mt-0.5 text-[11px] text-white/35">지점 {s.stnId}</p>
            <p className="mt-2 text-lg font-bold text-white">
              시간당 {s.rain60mMm !== null ? `${s.rain60mMm}mm` : "-"}
              <span className="text-sm font-normal text-white/40"> · 일누적 {s.rainDayMm !== null ? `${s.rainDayMm}mm` : "-"}</span>
            </p>
            <p className="mt-1 text-xs text-white/40">
              {s.tempC !== null ? `기온 ${s.tempC}℃` : "기온 -"} · {s.humidityPercent !== null ? `습도 ${s.humidityPercent}%` : "습도 -"}
            </p>
            <p className="mt-1 text-[11px] text-white/35">관측 {formatTm(s.tm)}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/25">
        기상청 API허브(apihub.kma.go.kr) 실연동(방재기상관측 AWS 매분자료) — 효돈천(돈내코·쇠소깍)과
        정확히 같은 지점은 없어 가장 가까운 저지대 지점을 참고용으로 표시합니다.
      </p>
    </div>
  )
}
