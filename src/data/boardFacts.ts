import { useEffect, useState } from "react"
import type { RiskLevel } from "../types/domain"
import { AWS_POSITIONS, fetchHeatSensors, fetchJejuCityRainfall, fetchRiverReferenceRainfall } from "./rainfallApi"
import { fetchTyphoonNow } from "./typhoonApi"
import { fetchOpenMeteo, OPEN_METEO_SITES, upcoming } from "./openMeteoApi"
import { fetchEastAsiaQuakes } from "./usgsQuakeApi"
import { fetchUltraNcst, toWeatherObservation } from "./weatherApi"
import { fetchMarineStations } from "./marineApi"
import { FIRE_HUMIDITY_MAX, FIRE_WIND_MIN } from "../components/ui/HazardLivePanels"

/**
 * 서비스 보드 대시보드의 "실제로 받은 값" — 서비스마다 받을 수 있는 공개 자료가 달라 아는 만큼만 타일에 채운다.
 *  호우·하천: 기상청 AWS 우량(효돈천 인근 참고 2지점) · 태풍: 기상청 태풍 현황 · 산불·대설: Open-Meteo 48시간 예보(참고) ·
 *  지진해일: USGS 최근 1주 지진(참고) · 폭염: 기상청 초단기실황(기온·습도)으로 계산한 체감온도(참고) · 연안: 기상청 해양관측(협재).
 * 값을 못 받았으면(null) 평시 기본 값("-")을 그대로 둔다. 저염분은 보드 지점(한경·대정)과 맞는 공개 자료가 없어 해당 없음.
 */
export interface Facts {
  /** 타일 이름 → 값 */
  tiles?: Record<string, { value: string; sub?: string; tone?: RiskLevel }>
  /** 브리핑 줄 바꿔치기 */
  brief?: Partial<Record<"판단" | "전개" | "대응", string>>
  /** 첫 카드(서비스 상태) 일부 바꿈 — 기상청 특보가 따로 있으면 특보가 우선 */
  status?: { badge?: { label: string; level: RiskLevel }; heading?: string; lines?: string[]; note?: string }
  /** 지도에 찍을 실제 위치(예: 태풍 중심) */
  markers?: { name: string; lat: number; lng: number; level: RiskLevel; value?: string }[]
  /** 지도 위 한 줄 */
  headline?: string
}

const JEJU = { lat: 33.5, lng: 126.53 }
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const rad = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
const hm = (tm: string) => (tm.length >= 12 ? `${tm.slice(8, 10)}:${tm.slice(10, 12)}` : "")
const utcToKst = (s: string) => new Date(new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:00Z`).getTime() + 9 * 3600 * 1000)
const md = (d: Date) => `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`

/** 기상청 여름철 체감온도식(기온·습도 → 체감) — Stull 습구온도 근사. 여름철 식이라 기온 20℃ 이상일 때만 쓴다 */
export function feelsLike(ta: number, rh: number): number | null {
  if (ta < 20) return null
  const tw = ta * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(ta + rh) - Math.atan(rh - 1.676331) + 0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) - 4.686035
  return -0.2442 + 0.55399 * tw + 0.45535 * ta - 0.0022 * tw * tw + 0.00278 * tw * ta + 3.0
}

type FactMarker = NonNullable<Facts["markers"]>[number]

/** 해양관측(기상청 sea_obs) 지점 — 좌표가 응답에 있다. 파고로 색을 낸다(참고 기준: 2m 관심 · 3m 주의 · 5m 경계) */
async function marineMarkers(): Promise<FactMarker[]> {
  const list = await fetchMarineStations().catch(() => [])
  return list
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))
    .map((s) => {
      const w = s.waveHeightM
      const level: RiskLevel = w === null ? "safe" : w >= 5 ? "alert" : w >= 3 ? "warning" : w >= 2 ? "caution" : "safe"
      const parts = [w !== null && `파고 ${w.toFixed(1)}m`, s.windSpeedMs !== null && `풍속 ${s.windSpeedMs}m/s`, s.seaTempC !== null && `수온 ${s.seaTempC}℃`].filter(Boolean)
      return { name: `${s.stnKo} 해양관측 · ${w !== null ? `파고 ${w.toFixed(1)}m` : "관측"}`, lat: s.lat, lng: s.lon, level, value: `${parts.join(" · ")} · 관측 ${hm(s.tm)} · 기상청 해양관측` }
    })
}

/** AWS 우량 지점 — 기상청 호우특보 기준(12시간 누적 110mm 주의보·180mm 경보)을 참고해 색을 낸다 */
function rainMarkers(st: { stnId: string; label: string; tm: string; rain60mMm: number | null; rain12hMm: number | null; rainDayMm: number | null }[]): FactMarker[] {
  return st
    .filter((s) => AWS_POSITIONS[s.stnId] && (s.rain60mMm !== null || s.rainDayMm !== null))
    .map((s) => {
      const p = AWS_POSITIONS[s.stnId]
      const h12 = s.rain12hMm ?? 0
      const level: RiskLevel = h12 >= 180 ? "alert" : h12 >= 110 ? "warning" : h12 >= 60 ? "caution" : "safe"
      return {
        name: `${p.name} 우량 · 시간당 ${s.rain60mMm ?? "-"}mm`,
        lat: p.lat,
        lng: p.lng,
        level,
        value: `일누적 ${s.rainDayMm ?? "-"}mm · 12시간 ${s.rain12hMm ?? "-"}mm · 관측 ${hm(s.tm)} · 기상청 AWS${p.approx ? " · 위치는 지점 주소 기준 근사" : ""}`,
      }
    })
}

/** Open-Meteo 예보 격자 두 곳(제주시·한라산) — 산불·대설의 참고 지점. 실제 관측소가 아니라 예보 격자의 대표 위치다 */
async function gridMarkers(kind: "fire" | "snow"): Promise<FactMarker[]> {
  const out: FactMarker[] = []
  for (const site of ["jeju", "halla"] as const) {
    const hours = upcoming(await fetchOpenMeteo(site).catch(() => []), 48)
    if (hours.length === 0) continue
    const { lat, lng, label } = OPEN_METEO_SITES[site]
    if (kind === "fire") {
      const risky = hours.filter((h) => h.humidityPercent <= FIRE_HUMIDITY_MAX && h.windMs >= FIRE_WIND_MIN).length
      out.push({ name: `${label} 산불 기상조건 · 겹침 ${risky}시간`, lat, lng, level: risky > 0 ? "warning" : "safe", value: `최저 습도 ${Math.min(...hours.map((h) => h.humidityPercent))}% · 최대 풍속 ${Math.max(...hours.map((h) => h.windMs)).toFixed(1)}m/s(48시간) · Open-Meteo 예보 격자(참고)` })
    } else {
      const total = hours.reduce((n, h) => n + h.snowfallCm, 0)
      const minT = Math.min(...hours.map((h) => h.temperatureC))
      out.push({ name: `${label} 적설 예보 · ${total.toFixed(1)}cm`, lat, lng, level: total > 0 ? "warning" : minT <= 0 ? "caution" : "safe", value: `48시간 누적 적설 ${total.toFixed(1)}cm · 최저 기온 ${minT.toFixed(1)}℃ · Open-Meteo 예보 격자(참고)` })
    }
  }
  return out
}

/** 지진 옥외대피장소(행안부, 받아 둔 파일) — 시설 좌표는 실제 값이고, 많아서 약 15km 격자로 묶어 개수로 보여준다 */
async function shelterClusterMarkers(): Promise<FactMarker[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/shelters-jeju.json`, { cache: "no-store" })
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return []
    const file = (await res.json()) as { kinds: { id: string; items: { lat: number | null; lng: number | null }[] }[] }
    const items = file.kinds.filter((k) => k.id === "quake-outdoor" || k.id === "tsunami").flatMap((k) => k.items).filter((i) => i.lat !== null && i.lng !== null) as { lat: number; lng: number }[]
    const cells = new Map<string, { lat: number; lng: number; n: number }>()
    for (const i of items) {
      const key = `${Math.floor(i.lat / 0.15)}:${Math.floor(i.lng / 0.15)}`
      const c = cells.get(key) ?? { lat: 0, lng: 0, n: 0 }
      c.lat += i.lat
      c.lng += i.lng
      c.n++
      cells.set(key, c)
    }
    return [...cells.values()].map((c) => ({ name: `옥외대피장소 ${c.n}곳`, lat: c.lat / c.n, lng: c.lng / c.n, level: "safe" as RiskLevel, value: "행안부 지진 옥외대피장소(받아 둔 파일) — 약 15km 격자로 묶은 평균 위치" }))
  } catch {
    return []
  }
}

async function load(id: string): Promise<Facts | null> {
  switch (id) {
    case "heavy-rain":
    case "river": {
      // 호우는 제주시·서귀포시 지점을 모두 본다(하천은 효돈천이 있는 서귀포시 쪽만)
      const all = id === "river" ? await fetchRiverReferenceRainfall() : (await Promise.all([fetchJejuCityRainfall(), fetchRiverReferenceRainfall()])).flat()
      const st = all.filter((s) => s.rain60mMm !== null || s.rainDayMm !== null)
      if (st.length === 0) return null
      const hour = [...st].sort((a, b) => (b.rain60mMm ?? -1) - (a.rain60mMm ?? -1))[0]
      const day = [...st].sort((a, b) => (b.rainDayMm ?? -1) - (a.rainDayMm ?? -1))[0]
      const name = (l: string) => l.split(" ")[0]
      const rm = id === "river" ? [] : rainMarkers(st)
      if (id === "river") {
        return {
          tiles: { 강우량: { value: `${hour.rain60mMm ?? 0}mm/h`, sub: `AWS ${name(hour.label)} · 일누적 ${hour.rainDayMm ?? "-"}mm` } },
          brief: { 전개: `기상청 AWS(효돈천 인근 ${st.length}곳) 실측 — 수위·레이더는 연계 전` },
        }
      }
      return {
        tiles: {
          "최대 실측 강우": { value: `${hour.rain60mMm ?? 0}mm/h`, sub: `AWS ${name(hour.label)} · 예보 비교는 연계 전` },
          "누적 강우 1위": { value: `${day.rainDayMm ?? 0}mm`, sub: `AWS ${name(day.label)} · 일누적` },
        },
        brief: { 전개: `기상청 AWS ${st.length}곳(제주시·서귀포시) 실측 시간당 최대 ${hour.rain60mMm ?? 0}mm — 예보와 비교는 연계 전` },
        markers: rm,
      }
    }
    case "typhoon": {
      const rows = await fetchTyphoonNow()
      const now = rows.filter((r) => r.ft === "0")
      const marine = await marineMarkers()
      if (now.length === 0) return marine.length ? { markers: marine } : null
      const t = now[0]
      const at = { lat: Number(t.lat), lng: Number(t.lon) }
      const d = Math.round(km(JEJU, at))
      const fc = rows.filter((r) => r.ft !== "0" && r.typ === t.typ).map((r) => ({ r, d: Math.round(km(JEJU, { lat: Number(r.lat), lng: Number(r.lon) })) }))
      const near = fc.sort((a, b) => a.d - b.d)[0]
      return {
        tiles: {
          제주까지: { value: `${d}km`, sub: `이동 ${t.speedKmh}km/h ${t.dir}` },
          "최근접 예상": near ? { value: `${near.d}km`, sub: md(utcToKst(near.r.ftTmUtc)) } : { value: "-", sub: "예측 경로 없음" },
          "최대 풍속": { value: `${t.maxWindMs}m/s` },
          "중심 기압": { value: `${t.pressureHpa}hPa` },
        },
        brief: { 판단: `제${t.typ}호 태풍 발표 · 제주까지 ${d}km${near ? ` · 최근접 ${near.d}km 예상` : ""}` },
        status: { badge: { label: `제${t.typ}호 태풍`, level: "warning" }, heading: `제주 ${d}km 해상`, lines: [`기상청 분석 ${md(utcToKst(t.typTmUtc))}`] },
        markers: [{ name: `제${t.typ}호 태풍 중심 · 제주 ${d}km`, lat: at.lat, lng: at.lng, level: d <= 500 ? "alert" : "warning" }, ...marine],
        headline: `🌀 제${t.typ}호 태풍 · 제주까지 ${d}km${near ? ` · 최근접 ${near.d}km 예상` : ""}`,
      }
    }
    case "wildfire":
    case "snow": {
      const hours = upcoming(await fetchOpenMeteo("jeju"), 48)
      if (hours.length === 0) return null
      const grid = await gridMarkers(id === "wildfire" ? "fire" : "snow")
      if (id === "wildfire") {
        const risky = hours.filter((h) => h.humidityPercent <= FIRE_HUMIDITY_MAX && h.windMs >= FIRE_WIND_MIN).length
        const minH = Math.min(...hours.map((h) => h.humidityPercent))
        const maxW = Math.max(...hours.map((h) => h.windMs))
        return {
          tiles: {
            "건조·강풍 겹침(48h)": { value: `${risky}시간`, sub: "제주시 기준 · Open-Meteo 참고", tone: risky > 0 ? "warning" : undefined },
            "최저 습도(48h)": { value: `${minH}%`, sub: `기준 ${FIRE_HUMIDITY_MAX}% 이하`, tone: minH <= FIRE_HUMIDITY_MAX ? "warning" : undefined },
            "최대 풍속(48h)": { value: `${maxW.toFixed(1)}m/s`, sub: `기준 ${FIRE_WIND_MIN}m/s 이상`, tone: maxW >= FIRE_WIND_MIN ? "warning" : undefined },
          },
          brief: { 판단: risky > 0 ? `참고 지표상 건조·강풍 겹침 ${risky}시간 예상(48시간)` : "참고 지표상 건조·강풍 겹침 없음(48시간)" },
          markers: grid,
        }
      }
      const total = hours.reduce((s, h) => s + h.snowfallCm, 0)
      const depth = Math.max(...hours.map((h) => h.snowDepthM)) * 100
      const minT = Math.min(...hours.map((h) => h.temperatureC))
      return {
        tiles: {
          "48h 누적 적설": { value: `${total.toFixed(1)}cm`, sub: "제주시 기준 · Open-Meteo 참고", tone: total > 0 ? "warning" : undefined },
          "최대 적설깊이": { value: `${depth.toFixed(0)}cm`, sub: "제주시 기준" },
          "최저 기온(48h)": { value: `${minT.toFixed(1)}℃`, sub: "0℃ 이하 시 강조", tone: minT <= 0 ? "warning" : undefined },
        },
        brief: { 판단: total > 0 ? `참고 지표상 48시간 누적 적설 ${total.toFixed(1)}cm 예상` : "참고 지표상 48시간 내 적설 예보 없음" },
        markers: grid,
      }
    }
    case "tsunami": {
      const q = await fetchEastAsiaQuakes()
      const max = [...q].sort((a, b) => b.magnitude - a.magnitude)[0]
      const near = [...q].sort((a, b) => a.distanceKm - b.distanceKm)[0]
      // 지도에는 제주 해안 관측(파고) 지점과 옥외대피장소 묶음을 찍는다(지진 진원은 일본 쪽이라 제주 지도 밖)
      const mk = [...(await marineMarkers()), ...(await shelterClusterMarkers())]
      if (!max || !near) return { tiles: { "최근 1주 지진": { value: "0건", sub: "규모 4.5 이상·동아시아" } }, brief: { 판단: "최근 1주 규모 4.5 이상 지진 없음(참고)" }, markers: mk }
      return {
        tiles: {
          "최근 1주 지진": { value: `${q.length}건`, sub: "규모 4.5 이상·동아시아" },
          "최대 규모(USGS)": { value: `M${max.magnitude.toFixed(1)}`, sub: max.tsunami ? "참고 · 해일 경고 표시" : "참고", tone: max.tsunami ? "warning" : undefined },
          "제주 최근접": { value: `${near.distanceKm.toLocaleString("ko-KR")}km`, sub: "참고" },
        },
        brief: { 판단: `최근 1주 규모 4.5 이상 지진 ${q.length}건 — 제주 ${near.distanceKm.toLocaleString("ko-KR")}km 이상 거리(참고)` },
        markers: mk,
      }
    }
    case "heat": {
      // 체감온도 센서 — 종관 4지점의 기온·습도로 지점별 체감을 계산해 지도에 찍는다
      const sensors = await fetchHeatSensors().catch(() => [])
      const markers = sensors
        .filter((s) => s.tempC !== null)
        .map((s) => {
          const f = s.humidityPercent !== null ? feelsLike(s.tempC as number, s.humidityPercent) : null
          const level: RiskLevel = f === null ? "safe" : f >= 35 ? "alert" : f >= 33 ? "warning" : f >= 31 ? "caution" : "safe"
          return {
            name: `${s.label} 기상관측 · ${f === null ? `기온 ${s.tempC}℃` : `체감 ${f.toFixed(1)}℃`}`,
            lat: s.lat,
            lng: s.lng,
            level,
            value: `기온 ${s.tempC}℃${s.humidityPercent !== null ? ` · 습도 ${s.humidityPercent}%` : ""} · 관측 ${hm(s.tm)} · 체감은 참고 계산`,
          }
        })
      const o = toWeatherObservation(await fetchUltraNcst("jeju"))
      if (!o) return markers.length ? { markers } : null
      const f = feelsLike(o.temperatureC, o.humidityPercent)
      if (f === null) return { tiles: { 체감온도: { value: `기온 ${o.temperatureC}℃`, sub: `초단기실황 ${o.observedAt.slice(11, 16)} · 여름철 체감식 미적용` } } }
      return {
        tiles: {
          체감온도: { value: `${f.toFixed(1)}℃`, sub: `초단기실황 ${o.observedAt.slice(11, 16)}로 계산(참고)`, tone: f >= 33 ? "warning" : undefined },
          "경보(35℃)까지": { value: `${Math.max(0, 35 - f).toFixed(1)}℃`, sub: "남은 격차" },
        },
        brief: { 판단: `체감 ${f.toFixed(1)}℃(참고 계산) — 주의보 기준 지속 여부는 관측 연계 전`, 전개: `체감 35℃ 이상 지속 시 폭염경보로 격상 — 현재 ${Math.max(0, 35 - f).toFixed(1)}℃ 부족(참고 계산)` },
        status: { heading: `체감온도 ${f.toFixed(1)}℃(참고 계산)` },
        markers,
      }
    }
    case "coast": {
      const s = (await fetchMarineStations()).find((x) => x.stnKo === "협재")
      if (!s) return null
      const parts = [s.waveHeightM !== null && `파고 ${s.waveHeightM.toFixed(1)}m`, s.windSpeedMs !== null && `풍속 ${s.windSpeedMs}m/s`, s.seaTempC !== null && `수온 ${s.seaTempC}℃`].filter(Boolean)
      if (parts.length === 0) return null
      return { status: { note: `협재 기상청 부이 ${parts.join(" · ")} · 관측 ${hm(s.tm)}` } }
    }
    default:
      return null
  }
}

/** 여러 서비스의 실제 값을 한꺼번에 — GIS 상황 지도가 모든 서비스의 점을 모을 때 쓴다(서비스 id → 값, 아직 못 받았으면 키 없음·못 받으면 null) */
export function useAllBoardFacts(ids: string[], enabled: boolean): Record<string, Facts | null> {
  const [stored, setStored] = useState<Record<string, Facts | null>>({})
  const key = ids.join(",")
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    for (const id of key.split(",")) {
      load(id)
        .then((f) => !cancelled && setStored((p) => ({ ...p, [id]: f })))
        .catch(() => !cancelled && setStored((p) => ({ ...p, [id]: null })))
    }
    return () => {
      cancelled = true
    }
  }, [key, enabled])
  return stored
}

/** 서비스별 실제 값 — 받는 중이거나 못 받으면 null(평시 기본 값 그대로). 스테이징은 샘플을 쓰므로 부르는 쪽이 건너뛴다 */
export function useBoardFacts(id: string, enabled: boolean): Facts | null {
  // 서비스를 옮겨도 화면 컴포넌트가 그대로라 이전 서비스의 값이 남지 않도록 id와 함께 저장한다
  const [stored, setStored] = useState<{ id: string; facts: Facts | null } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    load(id)
      .then((f) => !cancelled && setStored({ id, facts: f }))
      .catch(() => !cancelled && setStored({ id, facts: null }))
    return () => {
      cancelled = true
    }
  }, [id, enabled])
  return enabled && stored?.id === id ? stored.facts : null
}
