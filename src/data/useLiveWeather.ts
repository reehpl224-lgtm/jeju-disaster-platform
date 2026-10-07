import { useEffect, useState } from "react"
import type { WeatherObservation } from "../types/incident"
import { fetchUltraNcst, toWeatherObservation } from "./weatherApi"

/** 정시 자료라 10분마다만 다시 받는다 — 실패하거나 프록시가 없으면 null(화면은 기존 '관측값 없음' 표시) */
const REFRESH_MS = 10 * 60 * 1000

/** 종합상황 '현재 날씨'용 기상청 초단기실황(제주시 격자). 동네예보처럼 재난 판정에 쓰이지 않는 참고값이라 스테이징에서도 호출한다. */
export function useLiveWeather(): WeatherObservation | null {
  const [obs, setObs] = useState<WeatherObservation | null>(null)
  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchUltraNcst("jeju")
        .then((r) => !cancelled && setObs(toWeatherObservation(r)))
        .catch(() => !cancelled && setObs(null))
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])
  return obs
}
