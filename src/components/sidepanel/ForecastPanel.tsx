import { useEffect, useMemo, useState } from "react"
import { WEATHER_REGIONS, SKY_LABEL, PTY_LABEL, fetchUltraNcst, fetchVilageForecast, toWeatherObservation } from "../../data/weatherApi"
import { IS_STAGING } from "../../data/appMode"
import { SAMPLE_WEEKLY, buildSampleForecast } from "../../data/sidePanelSamples"
import type { VilageForecastRegion, VilageForecastResponse, VilageForecastSlot } from "../../types/weather"
import type { WeatherObservation } from "../../types/incident"
import { SpLive, SpSample } from "./primitives"
import { WEEKDAY, pad2 } from "./spUtils"

interface Loaded {
  key: string
  forecast: VilageForecastResponse | null
  now: WeatherObservation | null
}

const slotDate = (s: VilageForecastSlot) => new Date(`${s.date.slice(0, 4)}-${s.date.slice(4, 6)}-${s.date.slice(6, 8)}T${s.time.slice(0, 2)}:00:00+09:00`)
const skyIcon = (s?: VilageForecastSlot) => {
  const v = s?.values
  if (!v) return "–"
  if (v.PTY && v.PTY !== "0") return v.PTY === "3" ? "❄️" : v.PTY === "2" ? "🌨️" : "🌧️"
  return v.SKY === "1" ? "☀️" : v.SKY === "3" ? "⛅" : v.SKY === "4" ? "☁️" : "–"
}

/**
 * L3 · 좌측 · 동네예보 — 기상청 단기예보·초단기실황.
 * 표시 규칙(세 환경 레이아웃 동일): 프로토타입·로컬은 받은 값 그대로, 못 받은(null) 부분은 샘플 + "샘플 · 데이터 없음",
 * 스테이징은 받았어도 임의의 값(샘플). 주간 날씨는 단기예보가 닿는 날까지만 실값이고 나머지는 중기예보 미연동이라 샘플 + 데이터 없음.
 */
export function ForecastPanel() {
  const [region, setRegion] = useState<VilageForecastRegion>("jeju")
  const [reload, setReload] = useState(0)
  const [nowMs] = useState(() => Date.now())
  const key = `${region}:${reload}`
  const [res, setRes] = useState<Loaded | null>(null)
  const loading = res?.key !== key

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([fetchVilageForecast(region), fetchUltraNcst(region)]).then(([f, u]) => {
      if (cancelled) return
      setRes({
        key,
        forecast: f.status === "fulfilled" ? f.value : null,
        now: u.status === "fulfilled" ? toWeatherObservation(u.value) : null,
      })
    })
    return () => {
      cancelled = true
    }
  }, [region, key])

  const sampleFc = useMemo(() => buildSampleForecast(), [])
  // 단기예보·현재 관측은 각각 따로 판단한다 — 스테이징이면 항상 샘플, 아니면 못 받은(null) 쪽만 샘플
  const fcSample = IS_STAGING || (!loading && !res?.forecast)
  const obsSample = IS_STAGING || (!loading && !res?.now)
  const fcNoData = !IS_STAGING && fcSample
  const obsNoData = !IS_STAGING && obsSample
  const slots = useMemo(() => (fcSample ? sampleFc.slots : res?.forecast?.slots ?? []), [fcSample, sampleFc, res])
  const nowObs = obsSample ? sampleFc.now : res?.now
  const regionLabel = WEATHER_REGIONS.find((r) => r.key === region)?.label ?? ""
  const baseTime = slots[0] ? `${slots[0].time.slice(0, 2)}:${slots[0].time.slice(2, 4)}` : "-"

  // 단기 예보 — 앞으로의 시간별 예보(프록시는 12시간)를 2시간 간격 6칸으로
  const six = useMemo(() => {
    const t0 = nowMs - 60 * 60 * 1000
    return slots.filter((s) => slotDate(s).getTime() >= t0).filter((_, i) => i % 2 === 0).slice(0, 6)
  }, [slots, nowMs])

  // 주간 날씨 — 단기예보가 닿는 날은 그 값(샘플이면 샘플), 나머지 날은 중기예보 미연동이라 샘플
  const days = useMemo(() => {
    const by = new Map<string, VilageForecastSlot[]>()
    for (const s of slots) by.set(s.date, [...(by.get(s.date) ?? []), s])
    return [...by.entries()].map(([date, list]) => {
      const temps = list.map((s) => Number(s.values.TMP)).filter(Number.isFinite)
      const am = list.filter((s) => Number(s.time.slice(0, 2)) < 12)
      const pm = list.filter((s) => Number(s.time.slice(0, 2)) >= 12)
      const pop = (l: VilageForecastSlot[]) => (l.length ? Math.max(...l.map((s) => Number(s.values.POP ?? 0))) : null)
      const mid = (l: VilageForecastSlot[]) => l[Math.floor(l.length / 2)]
      return { date: new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T12:00:00+09:00`), min: Math.min(...temps), max: Math.max(...temps), am: skyIcon(mid(am)), pm: skyIcon(mid(pm)), popAm: pop(am), popPm: pop(pm), sample: fcSample }
    })
  }, [slots, fcSample])
  const weekly = useMemo(() => {
    const out = [...days]
    const last = days.at(-1)?.date ?? new Date(nowMs)
    SAMPLE_WEEKLY.forEach((w, i) => {
      if (out.length >= 7) return
      out.push({ date: new Date(last.getTime() + (i + 1) * 24 * 60 * 60 * 1000), min: w.min, max: w.max, am: w.am, pm: w.pm, popAm: w.popAm, popPm: w.popPm, sample: true })
    })
    return out
  }, [days, nowMs])
  const lo = Math.min(...weekly.map((d) => d.min), 0)
  const hi = Math.max(...weekly.map((d) => d.max), 1)

  const nowSlot = slots.find((s) => slotDate(s).getTime() >= nowMs - 60 * 60 * 1000)
  const skyText = nowSlot?.values.PTY && nowSlot.values.PTY !== "0" ? PTY_LABEL[nowSlot.values.PTY] : nowSlot?.values.SKY ? SKY_LABEL[nowSlot.values.SKY] : "-"

  // 선 그래프 좌표
  const temps = six.map((s) => Number(s.values.TMP))
  const tMin = Math.min(...temps, 0), tMax = Math.max(...temps, 1)
  const W = 340, H = 100
  const x = (i: number) => (W / six.length) * (i + 0.5)
  const y = (t: number) => 14 + (1 - (t - tMin) / Math.max(1, tMax - tMin)) * 52

  return (
    <div className="sp">
      <div className="sp-fc-top">
        <span className="sp-sub">기상청 단기예보 · 초단기실황</span>
        <a className="btn" href="https://www.weather.go.kr/w/image/sat/gk2a.do" target="_blank" rel="noreferrer">
          <span aria-hidden>☁︎</span> 구름영상
        </a>
      </div>
      <div className="sp-fc-sel">
        <label>
          시도
          <span className="sp-field">
            <select disabled aria-label="시도">
              <option>제주특별자치도</option>
            </select>
          </span>
        </label>
        <label>
          시군구
          <span className="sp-field">
            <select aria-label="시군구" value={region} onChange={(e) => setRegion(e.target.value as VilageForecastRegion)}>
              {WEATHER_REGIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label>
          읍면동
          <span className="sp-field">
            <select disabled aria-label="읍면동" title="읍면동 단위 예보는 준비 중입니다">
              <option>{region === "jeju" ? "이도1동" : "중앙동"}</option>
            </select>
          </span>
        </label>
      </div>
      <div className="sp-row">
        <div className="sp-field" style={{ flex: "1 1 0" }} aria-label="예보 기준 시각">
          <span style={{ flex: "1 1 0" }}>예보 기준 {baseTime}</span>
          <span className="sp-note">예보 시작</span>
        </div>
        <button type="button" className="sp-iconbtn" aria-label="다시 조회" onClick={() => setReload((v) => v + 1)}>
          ⌕
        </button>
      </div>

      {loading && <p className="pempty">불러오는 중...</p>}

      {!loading && (
        <>
          <div className="sp-row">
            <h3 className="sp-h" style={{ margin: 0 }}>
              제주특별자치도 {regionLabel} · 현재
            </h3>
            {obsSample && <SpSample noData={obsNoData} />}
          </div>
          <div className="sp-now">
            <span className="t">{nowObs ? `${Math.round(nowObs.temperatureC)}°` : "-"}</span>
            <div>
              <b>{skyText}</b>
              <small>{nowObs ? `강수 ${nowObs.rainfallMm}mm · 습도 ${nowObs.humidityPercent}% · 풍속 ${nowObs.windSpeedMs}m/s` : "현재 관측값 없음"}</small>
            </div>
          </div>

          <div className="sp-card" style={{ gap: 10 }}>
            <div className="sp-row">
              <b className="sp-h2 sp-spacer">단기 예보 · 6개 시간대</b>
              {fcSample && <SpSample noData={fcNoData} />}
            </div>
            <div className="sp-hours">
              {six.map((s) => (
                <span key={s.date + s.time}>
                  {Number(s.time.slice(0, 2))}시<b>{s.values.TMP ?? "-"}°</b>
                </span>
              ))}
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="기온선과 강수확률 막대" style={{ width: "100%", height: 100 }}>
              {six.map((s, i) => {
                const pop = Number(s.values.POP ?? 0)
                const h = Math.max(3, (pop / 100) * 34)
                return <rect key={`b${i}`} x={x(i) - 7} y={H - h} width={14} height={h} rx={2} fill="#0054a3" />
              })}
              {six.length > 1 && <polyline fill="none" stroke="#8ec21f" strokeWidth={2} points={six.map((s, i) => `${x(i)},${y(Number(s.values.TMP))}`).join(" ")} />}
              {six.map((s, i) => (
                <circle key={`c${i}`} cx={x(i)} cy={y(Number(s.values.TMP))} r={3} fill="#8ec21f" />
              ))}
            </svg>
            <div className="sp-hours">
              {six.map((s) => (
                <span key={`p${s.date}${s.time}`} className="pop">
                  {s.values.POP ?? "-"}%
                </span>
              ))}
            </div>
            <p className="sp-note">기온선(°C) · 파란 막대 = 강수확률</p>
          </div>

          <div className="sp-card" style={{ gap: 12 }}>
            <div className="sp-row">
              <b className="sp-h2 sp-spacer" style={{ fontSize: 13 }}>
                주간 날씨 · 7일
              </b>
              {weekly.every((d) => d.sample) ? <SpSample noData={!IS_STAGING} /> : <SpLive />}
            </div>
            <div className="sp-week sp-week--head">
              <span style={{ textAlign: "left" }}>날짜</span>
              <span>오전·오후</span>
              <span>최저~최고</span>
              <span>기온</span>
              <span>강수<br />오전/오후</span>
            </div>
            {weekly.map((d) => (
              <div className="sp-week" key={d.date.getTime()}>
                <span className="date">
                  {pad2(d.date.getMonth() + 1)}.{pad2(d.date.getDate())}({WEEKDAY[d.date.getDay()]})
                </span>
                <span className="ic">
                  {d.am}
                  {d.pm}
                </span>
                <span className="rng">
                  <i style={{ left: `${((d.min - lo) / (hi - lo)) * 100}%`, right: `${100 - ((d.max - lo) / (hi - lo)) * 100}%`, opacity: d.sample ? 0.45 : 1 }} />
                </span>
                <span className="tmp">
                  {Math.round(d.min)}°/{Math.round(d.max)}°
                </span>
                <span className="pp">
                  <span className={d.popAm !== null && d.popAm >= 30 ? "hi" : undefined}>🌂 {d.popAm ?? "-"}%</span>
                  <br />
                  <span className={d.popPm !== null && d.popPm >= 30 ? "hi" : undefined}>🌂 {d.popPm ?? "-"}%</span>
                </span>
              </div>
            ))}
            <p className="sp-note">
              강수확률 30% 이상은 주황 · 하늘상태 값이 없으면 '-'로 표시
              {weekly.some((d) => d.sample) && (
                <>
                  {" "}
                  · 흐린 막대 {weekly.filter((d) => d.sample).length}일은 {IS_STAGING ? "임의의 값" : "중기예보 미연동"} <SpSample noData={!IS_STAGING} />
                </>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
