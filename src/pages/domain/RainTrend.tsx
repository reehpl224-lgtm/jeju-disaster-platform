import { useEffect, useState } from "react"
import { MiniChart } from "../../components/board/PanelParts"
import { fetchOpenMeteo, OPEN_METEO_SITES, type HourlyWeather, type OpenMeteoSite } from "../../data/openMeteoApi"
import { fetchJejuCityRainfall, fetchRiverReferenceRainfall } from "../../data/rainfallApi"
import type { RainfallStation } from "../../types/rainfallApi"

/**
 * 호우 "강우 추이" — 15분 간격 관측 시계열을 받는 곳이 아직 없어서(빈 배열), 받을 수 있는 공개 자료로 채운다:
 * Open-Meteo 시간별 강수(지난 24시간 모델 분석 + 앞으로 24시간 예보, 참고)와 기상청 AWS 현재 실측(제주시 시가지 주변 4곳 · 서귀포시 효돈천 인근 2곳).
 * 제주시·서귀포시를 탭으로 나눠 본다. 기상청 관측이 아니고 15분 간격도 아니므로 제목·각주에 그대로 적는다.
 */
const CITIES: OpenMeteoSite[] = ["jeju", "seogwipo"]
const noteStyle = { fontSize: 10, lineHeight: "15px", color: "var(--foreground-subtle)" } as const

function CityTrend({ site }: { site: OpenMeteoSite }) {
  const [hours, setHours] = useState<HourlyWeather[] | null>(null)
  const [aws, setAws] = useState<RainfallStation[]>([])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetchOpenMeteo(site)
      .then((h) => !cancelled && setHours(h))
      .catch(() => !cancelled && setFailed(true))
    // AWS 지점 — 서귀포시는 효돈천 인근 참고 2곳, 제주시는 시가지 주변 4곳
    if (site === "seogwipo" || site === "jeju")
      (site === "seogwipo" ? fetchRiverReferenceRainfall() : fetchJejuCityRainfall())
        .then((s) => !cancelled && setAws(s))
        .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [site])

  if (failed) return <p className="pempty">강수 자료를 불러오지 못했습니다.</p>
  if (!hours) return <p className="pempty">불러오는 중...</p>

  // 지금 기준 앞뒤 24시간
  const pad = (v: number) => String(v).padStart(2, "0")
  const now = new Date()
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
  const at = Math.max(0, hours.findIndex((h) => h.time >= key))
  const from = Math.max(0, at - 24)
  const win = hours.slice(from, at + 25)
  const nowIdx = at - from // 지금 시각의 자리 — 이 선 뒤쪽이 예보 구간
  const data = win.map((h, i) => ({
    time: `${h.time.slice(8, 10)}일 ${h.time.slice(11, 13)}시`,
    rainfallMm: Number(h.precipitationMm.toFixed(1)),
    cumulativeMm: Number(win.slice(0, i + 1).reduce((n, x) => n + x.precipitationMm, 0).toFixed(1)),
  }))
  if (data.length === 0) return <p className="pempty">강수 자료가 없습니다.</p>
  const real = aws.filter((s) => s.rain60mMm !== null || s.rainDayMm !== null)

  return (
    <>
      <MiniChart data={data} keys={["rainfallMm", "cumulativeMm"]} colors={["#0054a3", "#f2731a"]} names={["시간 강수(mm)", "창 누적(mm)"]} xkey="time" nowX={data[nowIdx]?.time} />
      {real.length > 0 && (
        <ul className="plist">
          {real.map((s) => (
            <li className="row-between" key={s.stnId}>
              <span className="s" style={{ margin: 0, ...noteStyle }}>
                기상청 AWS 실측 · {s.label}
              </span>
              <span className="t" style={{ fontSize: 11 }}>
                시간당 {s.rain60mMm ?? "-"}mm · 일누적 {s.rainDayMm ?? "-"}mm
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="s" style={noteStyle}>
        Open-Meteo 시간별 강수({OPEN_METEO_SITES[site].label}, 지난 24시간 모델 분석 + 앞으로 24시간 예보) — 초록 세로선이 지금이고 파란 음영이 예보 구간입니다. 참고용이며 기상청 관측·15분 간격 자료가 아닙니다. 누적은 이 창(48시간) 합계입니다.
      </p>
    </>
  )
}

export function RainTrend() {
  const [site, setSite] = useState<OpenMeteoSite>("jeju")
  return (
    <>
      <div className="sp-pills" role="tablist" aria-label="시 선택" style={{ marginBottom: 6 }}>
        {CITIES.map((c) => (
          <button key={c} type="button" role="tab" className="sp-pill" aria-selected={site === c} aria-pressed={site === c} onClick={() => setSite(c)}>
            {OPEN_METEO_SITES[c].label}
          </button>
        ))}
      </div>
      <CityTrend key={site} site={site} />
    </>
  )
}
