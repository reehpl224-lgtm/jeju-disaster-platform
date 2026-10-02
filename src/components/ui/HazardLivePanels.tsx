import { useEffect, useState } from "react"
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { fetchOpenMeteo, OPEN_METEO_SITES, upcoming, type HourlyWeather, type OpenMeteoSite } from "../../data/openMeteoApi"
import { fetchEastAsiaQuakes, type QuakeEvent } from "../../data/usgsQuakeApi"

/** 산불 참고 기준 — 공식 산불위험지수가 아니라 건조·강풍이 겹치는 시간을 눈으로 보기 위한 임의 기준 */
export const FIRE_HUMIDITY_MAX = 35
export const FIRE_WIND_MIN = 7

function useAsync<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true })
  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((e: Error) => !cancelled && setState({ data: null, error: e.message, loading: false }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load는 호출 쪽에서 안정적인 함수만 넘긴다
  }, [])
  return state
}

const Note = ({ children }: { children: string }) => <p className="py-4 text-center text-xs text-white/40">{children}</p>
const ErrorBox = ({ message }: { message: string }) => (
  <p className="rounded-lg border border-risk-danger-bg bg-risk-danger-bg/20 p-2.5 text-[11px] text-risk-danger">{message}</p>
)
const tick = { fontSize: 10, fill: "#ffffff88" }
const tooltipStyle = { background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 11 }
const hourLabel = (t: string) => t.slice(5, 13).replace("T", " ") + "시"

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{k}</p>
      <p className={`text-sm font-bold ${warn ? "text-risk-warning" : "text-white/85"}`}>{v}</p>
    </div>
  )
}

/** 산불 참고 — 앞으로 48시간 습도·풍속 예보와 건조·강풍이 겹치는 시간 */
export function FireWeatherPanel({ site = "jeju" }: { site?: OpenMeteoSite }) {
  const { data, error, loading } = useAsync<HourlyWeather[]>(() => fetchOpenMeteo(site))
  if (loading) return <Note>불러오는 중...</Note>
  if (error) return <ErrorBox message={error} />
  const hours = upcoming(data ?? [], 48)
  if (hours.length === 0) return <Note>예보 데이터가 없습니다.</Note>
  const risky = hours.filter((h) => h.humidityPercent <= FIRE_HUMIDITY_MAX && h.windMs >= FIRE_WIND_MIN)
  const minHum = Math.min(...hours.map((h) => h.humidityPercent))
  const maxWind = Math.max(...hours.map((h) => h.windMs))
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat k="최저 습도(48h)" v={`${minHum}%`} warn={minHum <= FIRE_HUMIDITY_MAX} />
        <Stat k="최대 풍속(48h)" v={`${maxWind.toFixed(1)}m/s`} warn={maxWind >= FIRE_WIND_MIN} />
        <Stat k="건조·강풍 겹침" v={`${risky.length}시간`} warn={risky.length > 0} />
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="time" tickFormatter={hourLabel} tick={tick} stroke="#3a3b3c" interval={11} />
            <YAxis yAxisId="h" domain={[0, 100]} tick={tick} stroke="#3a3b3c" />
            <YAxis yAxisId="w" orientation="right" tick={tick} stroke="#3a3b3c" />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(t) => hourLabel(String(t))} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#ffffffaa" }} />
            <ReferenceLine yAxisId="h" y={FIRE_HUMIDITY_MAX} stroke="#f2731a" strokeDasharray="4 4" />
            <Line yAxisId="h" type="monotone" dataKey="humidityPercent" name="습도(%)" stroke="#0054a3" strokeWidth={2} dot={false} />
            <Line yAxisId="w" type="monotone" dataKey="windMs" name="풍속(m/s)" stroke="#8ec21f" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-white/35">
        {OPEN_METEO_SITES[site].label} · Open-Meteo 예보(참고) — 습도 {FIRE_HUMIDITY_MAX}% 이하·풍속 {FIRE_WIND_MIN}m/s 이상을 겹침으로 셉니다. 산림청 산불위험예보가 아닙니다.
      </p>
    </div>
  )
}

/** 대설 참고 — 앞으로 48시간 적설·기온 예보 */
export function SnowForecastPanel({ site = "jeju" }: { site?: OpenMeteoSite }) {
  const { data, error, loading } = useAsync<HourlyWeather[]>(() => fetchOpenMeteo(site))
  if (loading) return <Note>불러오는 중...</Note>
  if (error) return <ErrorBox message={error} />
  const hours = upcoming(data ?? [], 48)
  if (hours.length === 0) return <Note>예보 데이터가 없습니다.</Note>
  const total = hours.reduce((s, h) => s + h.snowfallCm, 0)
  const minTemp = Math.min(...hours.map((h) => h.temperatureC))
  const maxDepth = Math.max(...hours.map((h) => h.snowDepthM)) * 100
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat k="48h 누적 적설" v={`${total.toFixed(1)}cm`} warn={total > 0} />
        <Stat k="최대 적설깊이" v={`${maxDepth.toFixed(0)}cm`} warn={maxDepth > 0} />
        <Stat k="최저 기온(48h)" v={`${minTemp.toFixed(1)}℃`} warn={minTemp <= 0} />
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hours} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
            <XAxis dataKey="time" tickFormatter={hourLabel} tick={tick} stroke="#3a3b3c" interval={11} />
            <YAxis yAxisId="s" tick={tick} stroke="#3a3b3c" />
            <YAxis yAxisId="t" orientation="right" tick={tick} stroke="#3a3b3c" />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(t) => hourLabel(String(t))} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#ffffffaa" }} />
            <ReferenceLine yAxisId="t" y={0} stroke="#ffffff55" strokeDasharray="4 4" />
            <Bar yAxisId="s" dataKey="snowfallCm" name="적설(cm/h)" fill="#0054a3" />
            <Line yAxisId="t" type="monotone" dataKey="temperatureC" name="기온(℃)" stroke="#f2731a" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-white/35">
        {OPEN_METEO_SITES[site].label} · Open-Meteo 예보(참고) — 기상청 대설 특보·관측이 아닙니다.
      </p>
    </div>
  )
}

const quakeTime = (ms: number) => {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 지진해일 참고 — 최근 1주 동아시아·서태평양 규모 4.5 이상 지진(제주까지 거리 포함) */
export function QuakePanel({ limit = 8 }: { limit?: number }) {
  const { data, error, loading } = useAsync<QuakeEvent[]>(fetchEastAsiaQuakes)
  if (loading) return <Note>불러오는 중...</Note>
  if (error) return <ErrorBox message={error} />
  const rows = (data ?? []).slice(0, limit)
  if (rows.length === 0) return <Note>최근 1주 동아시아 규모 4.5 이상 지진이 없습니다.</Note>
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle p-2.5 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-white/80">{q.place}</p>
              <p className="text-white/40">
                {quakeTime(q.time)} · 깊이 {Math.round(q.depthKm)}km · 제주까지 {q.distanceKm.toLocaleString()}km
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {q.tsunami && <span className="rounded-full border border-risk-warning px-2 py-0.5 text-[10px] font-bold text-risk-warning">해일 경고</span>}
              <span className={`text-sm font-bold ${q.magnitude >= 6 ? "text-risk-danger" : q.magnitude >= 5.5 ? "text-risk-warning" : "text-white/80"}`}>M{q.magnitude.toFixed(1)}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-white/35">USGS 최근 1주 · 동아시아·서태평양(참고) — 기상청 지진통보가 아니며 지진해일 판단 근거가 아닙니다.</p>
    </div>
  )
}
