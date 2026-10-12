import { useEffect, useState } from "react"
import { Kv, MiniChart } from "../../components/board/PanelParts"
import { useServiceWarnings } from "../../data/boardLive"
import { feelsLike } from "../../data/boardFacts"
import { fetchOpenMeteo, type HourlyWeather } from "../../data/openMeteoApi"
import { fetchUltraNcst, toWeatherObservation } from "../../data/weatherApi"

/**
 * 폭염 "최근 5일 기온" — 일별 최고기온·체감온도 관측 이력을 받는 곳이 아직 없어서(빈 배열), 받을 수 있는 공개 자료로 채운다:
 * Open-Meteo 시간별 기온·습도(지난 5일 모델 분석 + 앞으로 2일 예보, 참고)에서 하루 최고기온을 뽑고, 기상청 여름철 체감식(기온 20℃ 이상)으로
 * 체감온도를 계산한다. 기상청 관측이 아니므로 제목·각주에 그대로 적는다. 오늘은 초록 세로선, 이후는 파란 음영(예보)이다.
 */
const noteStyle = { fontSize: 10, lineHeight: "15px", color: "var(--foreground-subtle)" } as const

export function HeatTrend() {
  const [hours, setHours] = useState<HourlyWeather[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetchOpenMeteo("jeju")
      .then((h) => !cancelled && setHours(h))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [])
  if (failed) return <p className="pempty">기온 자료를 불러오지 못했습니다.</p>
  if (!hours) return <p className="pempty">불러오는 중...</p>

  const byDay = new Map<string, { maxTempC: number; feelsLikeC: number | null }>()
  for (const h of hours) {
    const day = h.time.slice(0, 10)
    const f = feelsLike(h.temperatureC, h.humidityPercent)
    const prev = byDay.get(day)
    byDay.set(day, {
      maxTempC: Math.max(prev?.maxTempC ?? -99, h.temperatureC),
      feelsLikeC: f === null ? (prev?.feelsLikeC ?? null) : Math.max(prev?.feelsLikeC ?? -99, f),
    })
  }
  const pad = (v: number) => String(v).padStart(2, "0")
  const now = new Date()
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const data = [...byDay.entries()].map(([day, v]) => ({
    date: `${day.slice(5, 7)}/${day.slice(8, 10)}`,
    maxTempC: Number(v.maxTempC.toFixed(1)),
    feelsLikeC: v.feelsLikeC === null ? null : Number(v.feelsLikeC.toFixed(1)),
    day,
  }))
  if (data.length === 0) return <p className="pempty">기온 자료가 없습니다.</p>
  const todayLabel = data.find((d) => d.day === today)?.date

  return (
    <>
      <MiniChart
        data={data}
        keys={["maxTempC", "feelsLikeC"]}
        colors={["#f9cd00", "#f2731a"]}
        names={["최고기온(℃)", "체감온도(℃)"]}
        xkey="date"
        refLine={{ y: 33, label: "주의보 33℃" }}
        nowX={todayLabel}
        yMin={14}
        yMax={45}
        showDots
      />
      <p className="s" style={noteStyle}>
        Open-Meteo 시간별 기온·습도(제주시, 지난 5일 모델 분석 + 앞으로 2일 예보)로 계산한 참고값입니다. 체감온도는 기상청 여름철 체감식(기온 20℃ 이상일 때만)이며 기상청 관측이 아닙니다. 초록 세로선이 오늘, 파란 음영이 예보 구간입니다.
      </p>
    </>
  )
}

/**
 * 폭염 "현재 특보 · 체감온도" — 관측 기록(mock)이 비어 있을 때 실제 값으로 채운다:
 * 기상청 폭염 특보(H·K, 최근 24시간 발표분)와 초단기실황 기온·습도로 계산한 체감온도(기상청 여름철 체감식, 기온 20℃ 이상일 때만, 참고).
 */
export function HeatNow() {
  const warn = useServiceWarnings(["H", "K"])
  const [feels, setFeels] = useState<{ v: string; at: string } | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    fetchUltraNcst("jeju")
      .then((r) => {
        const o = toWeatherObservation(r)
        if (cancelled) return
        if (!o) return setFeels(null)
        const f = feelsLike(o.temperatureC, o.humidityPercent)
        setFeels({ v: f === null ? `기온 ${o.temperatureC}℃(체감식 미적용)` : `${f.toFixed(1)}℃(참고 계산)`, at: o.observedAt.slice(11, 16) })
      })
      .catch(() => !cancelled && setFeels(null))
    return () => {
      cancelled = true
    }
  }, [])
  const spec = warn.status === "ready" ? (warn.groups.length ? warn.groups.map((g) => `${g.label}(${g.regions.join("·")})`).join(" · ") : "특보 없음") : warn.status === "failed" ? "조회 실패" : "불러오는 중"
  return (
    <>
      <Kv items={[{ k: "현재 특보", v: spec }, { k: "체감온도", v: feels === undefined ? "불러오는 중" : feels ? feels.v : "-" }]} />
      <p className="s" style={noteStyle}>
        특보는 기상청 최근 24시간 발표분(발효 중이라 단정하지 않음) · 체감온도는 초단기실황 {feels ? `${feels.at} ` : ""}기온·습도로 계산한 참고값입니다.
      </p>
    </>
  )
}
