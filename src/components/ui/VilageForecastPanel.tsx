import { useEffect, useState } from "react"
import { fetchVilageForecast, formatSlotTime, PTY_LABEL, SKY_LABEL, WEATHER_REGIONS } from "../../data/weatherApi"
import type { VilageForecastRegion, VilageForecastResponse } from "../../types/weather"

/**
 * 기상청 단기예보(getVilageFcst) 실시간 연동 패널 — kma-weather-proxy를 통해 매 조회마다
 * 라이브로 데이터를 받아온다. 다른 GIS 패널(타임라인·특보)과 달리 정적 mock이 아니다.
 */
export function VilageForecastPanel() {
  const [region, setRegion] = useState<VilageForecastRegion>("jeju")
  const [data, setData] = useState<VilageForecastResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchVilageForecast(region)
      .then((res) => {
        if (!cancelled) setData(res)
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
  }, [region])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {WEATHER_REGIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRegion(r.key)}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                r.key === region ? "bg-accent text-black" : "bg-inset text-white/50 hover:text-white/80"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-white/30">기상청 단기예보 실시간</span>
      </div>

      {loading && <p className="py-4 text-center text-xs text-white/30">불러오는 중...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-risk-danger-bg bg-risk-danger-bg/20 p-2.5 text-[11px] text-risk-danger">
          {error}
        </p>
      )}

      {!loading && !error && data && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-[11px]">
            <thead>
              <tr className="border-b border-border-subtle text-white/40">
                <th className="py-1 text-left font-medium">시각</th>
                <th className="py-1 text-right font-medium">기온</th>
                <th className="py-1 text-right font-medium">강수확률</th>
                <th className="py-1 text-right font-medium">하늘상태</th>
                <th className="py-1 text-right font-medium">풍속</th>
              </tr>
            </thead>
            <tbody>
              {data.slots.map((slot) => {
                const pty = slot.values.PTY && slot.values.PTY !== "0" ? PTY_LABEL[slot.values.PTY] : null
                return (
                  <tr key={`${slot.date}-${slot.time}`} className="border-b border-border-subtle/50">
                    <td className="py-1 text-white/70">{formatSlotTime(slot.date, slot.time)}</td>
                    <td className="py-1 text-right text-white/80">{slot.values.TMP ?? "-"}℃</td>
                    <td className="py-1 text-right text-white/80">{slot.values.POP ?? "-"}%</td>
                    <td className="py-1 text-right text-white/80">
                      {pty ?? (slot.values.SKY ? SKY_LABEL[slot.values.SKY] ?? slot.values.SKY : "-")}
                    </td>
                    <td className="py-1 text-right text-white/80">{slot.values.WSD ? `${slot.values.WSD}m/s` : "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
