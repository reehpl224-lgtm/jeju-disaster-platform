import { useEffect, useState } from "react"
import { fetchMarineStations } from "../../data/marineApi"
import type { MarineStation } from "../../types/marineApi"

/** 기상청 API허브 해양관측(sea_obs.php) 실시간 파고·수온 패널 — /coast(연안)용. */
export function MarineObservationPanel() {
  const [stations, setStations] = useState<MarineStation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMarineStations()
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

  if (!stations || stations.length === 0) {
    return <p className="py-4 text-center text-xs text-white/40">제주 인근 관측 지점 데이터가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stations.map((s) => (
          <div key={s.stnId} className="rounded-lg border border-border-subtle p-3">
            <p className="text-sm font-semibold text-white/80">{s.stnKo}</p>
            <p className="mt-0.5 text-[11px] text-white/35">지점 {s.stnId}</p>
            <p className="mt-2 text-lg font-bold text-white">{s.waveHeightM !== null ? `파고 ${s.waveHeightM.toFixed(1)}m` : "파고 -"}</p>
            <p className="mt-1 text-xs text-white/40">
              {s.windSpeedMs !== null ? `풍속 ${s.windSpeedMs}m/s` : "풍속 -"} · {s.seaTempC !== null ? `수온 ${s.seaTempC}℃` : "수온 -"}
            </p>
            <p className="mt-1 text-[11px] text-white/35">관측 {s.tm ? `${s.tm.slice(0, 4)}-${s.tm.slice(4, 6)}-${s.tm.slice(6, 8)} ${s.tm.slice(8, 10)}:${s.tm.slice(10, 12)}` : "-"}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/25">
        기상청 API허브(apihub.kma.go.kr) 실연동 — 해양기상부이·파고부이(sea_obs.php). "협재"만 연안 3대
        실증 대상지와 정확히 일치하고, 나머지는 인근 참고 지점입니다.
      </p>
    </div>
  )
}
