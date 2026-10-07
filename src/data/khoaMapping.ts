import type { khoaLiveObservations } from "./mockAqua"
import type { khoaBuoyMarineConditions } from "./mockKhoaBuoy"
import type { khoaMoseulpoTide } from "./mockRiver"

/** kma-weather-proxy /api/khoa 응답(관측점별 최신값 + 조위 시계열) → 화면이 쓰는 세 배열. 값이 빠진 관측점은 지어내지 않고 뺀다. */
export interface KhoaApiStation {
  code: string
  kind: "tide" | "buoy"
  name: string
  lat?: number
  lng?: number
  latest: {
    observedAt: string
    values: Partial<{
      windDirDeg: number
      windSpeedMs: number
      pressureHpa: number
      waterTempC: number
      salinityPsu: number
      waveHeightM: number
      wavePeriodSec: number
      currentDirDeg: number
      currentSpeedCms: number
    }>
  } | null
  series: { time: string; tideLevelCm: number }[]
}

type Buoy = (typeof khoaBuoyMarineConditions)[number]
type Obs = (typeof khoaLiveObservations)[number]
type Tide = typeof khoaMoseulpoTide

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

export function toKhoaArrays(stations: KhoaApiStation[]): { buoys: Buoy[]; observations: Obs[]; tide: Pick<Tide, "series" | "observedAt"> | null } {
  const buoys: Buoy[] = []
  const observations: Obs[] = []
  for (const s of stations) {
    const v = s.latest?.values
    if (!s.latest || !v) continue
    // lat·lng는 이 배열을 쓰는 화면이 표시하지 않는다 — 응답에 없으면 0으로 둔다
    const base = { id: s.code.toLowerCase(), stationName: s.name, stationCode: s.code, lat: s.lat ?? 0, lng: s.lng ?? 0, observedAt: s.latest.observedAt }
    if (s.kind === "buoy" && isNum(v.windDirDeg) && isNum(v.windSpeedMs) && isNum(v.pressureHpa) && isNum(v.waveHeightM) && isNum(v.wavePeriodSec)) {
      buoys.push({ ...base, windDirDeg: v.windDirDeg, windSpeedMs: v.windSpeedMs, pressureHpa: v.pressureHpa, waveHeightM: v.waveHeightM, wavePeriodSec: v.wavePeriodSec })
    }
    if (isNum(v.waterTempC) && isNum(v.salinityPsu)) {
      observations.push({
        ...base,
        kind: s.kind === "tide" ? "조위관측소" : "해양관측부이",
        seaTempC: v.waterTempC,
        salinityPsu: v.salinityPsu,
        ...(isNum(v.currentDirDeg) && isNum(v.currentSpeedCms) ? { currentDirDeg: v.currentDirDeg, currentSpeedCms: v.currentSpeedCms } : {}),
      })
    }
  }
  const moseulpo = stations.find((s) => s.code === "DT_0023")
  const tide = moseulpo && moseulpo.series.length > 0 && moseulpo.latest ? { series: moseulpo.series, observedAt: moseulpo.latest.observedAt } : null
  return { buoys, observations, tide }
}
