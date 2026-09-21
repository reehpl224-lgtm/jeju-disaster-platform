import { useEffect, useState, type ReactNode } from "react"
import { fetchVilageForecast, formatSlotTime, PTY_LABEL, SKY_LABEL, WEATHER_REGIONS } from "../../data/weatherApi"
import type { VilageForecastRegion, VilageForecastResponse, VilageForecastSlot } from "../../types/weather"

/**
 * 기상청 단기예보(getVilageFcst) 실시간 연동 패널 — kma-weather-proxy를 통해 매 조회마다
 * 라이브로 데이터를 받아온다. 다른 GIS 패널(타임라인·특보)과 달리 정적 mock이 아니다.
 */
/** variant="dock"이면 종합/GIS 상황판 우측 패널용 검색 영역(제목·구름영상·지역 선택·기준 시각·조회 버튼)을 위에 붙인다 */
export function VilageForecastPanel({ variant = "card" }: { variant?: "card" | "dock" }) {
  const [region, setRegion] = useState<VilageForecastRegion>("jeju")
  const [reloadKey, setReloadKey] = useState(0)
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
  }, [region, reloadKey])

  const first = data?.slots[0]
  const baseLabel = first
    ? `${first.date.slice(0, 4)}-${first.date.slice(4, 6)}-${first.date.slice(6, 8)} ${first.time.slice(0, 2)}:${first.time.slice(2, 4)}`
    : "-"

  return (
    <div className="flex flex-col gap-2">
      {variant === "dock" && (
        <div className="flex flex-col gap-2 pb-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white">동네 예보</h3>
            <a
              href="https://www.weather.go.kr/w/image/sat/gk2a.do"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.5 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.4 8.6 4.7 4.7 0 0 1 17.5 19h-11z" />
              </svg>
              구름영상
            </a>
          </div>
          <select className="select" disabled aria-label="시도" style={{ height: 36, fontSize: 12 }}>
            <option>제주</option>
          </select>
          <select
            className="select"
            aria-label="시군구"
            value={region}
            onChange={(e) => setRegion(e.target.value as VilageForecastRegion)}
            style={{ height: 36, fontSize: 12 }}
          >
            {WEATHER_REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                제주특별자치도 {r.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <div className="input flex flex-1 items-center justify-between" style={{ height: 36, fontSize: 12 }} aria-label="예보 기준 시각">
              <span>{baseLabel}</span>
              <span className="text-[10px] text-white/30">예보 시작</span>
            </div>
            <button
              type="button"
              aria-label="다시 조회"
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-[#303233] text-white hover:border-accent hover:text-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
            </button>
          </div>
          <p className="pt-1 text-sm font-bold text-white">단기 예보</p>
        </div>
      )}
      {variant !== "dock" && (
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
      )}

      {loading && <p className="py-4 text-center text-xs text-white/30">불러오는 중...</p>}

      {!loading && error && (
        <p className="rounded-lg border border-risk-danger-bg bg-risk-danger-bg/20 p-2.5 text-[11px] text-risk-danger">
          {error}
        </p>
      )}

      {!loading && !error && data && variant === "dock" && <HorizontalForecast slots={data.slots} />}

      {!loading && !error && data && variant !== "dock" && (
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

const DAY_LABEL = ["오늘", "내일", "모레"]

function dayDiff(from: string, to: string) {
  const d = (s: string) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)))
  return Math.round((d(to) - d(from)) / 86400000)
}

/** 하늘상태·강수형태 코드 → 아이콘(맑음은 밤이면 달) */
function weatherIcon(values: VilageForecastSlot["values"], hour: number) {
  const pty = values.PTY
  if (pty && pty !== "0") return pty === "3" ? "❄️" : pty === "2" ? "🌨️" : "🌧️"
  const night = hour >= 19 || hour < 6
  if (values.SKY === "1") return night ? "🌙" : "☀️"
  if (values.SKY === "3") return night ? "☁️" : "⛅"
  if (values.SKY === "4") return "☁️"
  return "-"
}

/** 가로형 단기예보 표 — 시각이 열, 항목이 행. 응답에 있는 항목(하늘상태·기온·강수확률·습도·풍속)만 표시 */
function HorizontalForecast({ slots }: { slots: VilageForecastSlot[] }) {
  const base = slots[0]?.date ?? ""
  const rows: { label: ReactNode; cell: (s: VilageForecastSlot) => ReactNode }[] = [
    { label: "", cell: (s) => <span className="text-lg leading-none">{weatherIcon(s.values, Number(s.time.slice(0, 2)))}</span> },
    { label: <>기온<br />(℃)</>, cell: (s) => (s.values.TMP != null ? `${s.values.TMP}°` : "-") },
    { label: <>강수확률<br />(%)</>, cell: (s) => s.values.POP ?? "-" },
    { label: <>습도<br />(%)</>, cell: (s) => s.values.REH ?? "-" },
    { label: <>바람<br />(m/s)</>, cell: (s) => s.values.WSD ?? "-" },
  ]
  return (
    <div className="overflow-x-auto rounded-lg border border-white/20">
      <table className="w-max min-w-full border-collapse text-center text-xs">
        <thead>
          <tr className="bg-[#435668] text-white">
            <th className="sticky left-0 z-10 w-16 bg-[#435668] px-2 py-2 font-bold">{DAY_LABEL[0]}</th>
            {slots.map((s, i) => {
              const newDay = i > 0 && s.date !== slots[i - 1].date
              const diff = dayDiff(base, s.date)
              return (
                <th key={`${s.date}-${s.time}`} className="min-w-11 px-1.5 py-2 font-bold">
                  {newDay ? DAY_LABEL[diff] ?? `+${diff}일` : `${s.time.slice(0, 2)}시`}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-white/10">
              <th className="sticky left-0 z-10 bg-[#1d1d1d] px-2 py-2.5 text-xs font-bold leading-tight text-white/90">{row.label}</th>
              {slots.map((s) => (
                <td key={`${s.date}-${s.time}`} className="px-1.5 py-2.5 font-semibold text-white/85">
                  {row.cell(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
