import { useEffect, useState } from "react"
import type { DisasterAlert } from "../types/incident"
import type { RainfallStation } from "../types/rainfallApi"
import { IS_STAGING } from "./appMode"
import { fetchJejuCityRainfall, fetchRiverReferenceRainfall } from "./rainfallApi"

/**
 * 우량 임계치 알림 — 요구사항 '통합상황판 우선 확인 내용'(임계치 초과 시 알람). 기상청 AWS 우량(1시간·12시간 누적)이 기준을 넘으면 알림 목록에 올린다.
 * 기준값은 표시용 잠정치(1시간 30/50/70mm = 주의/경계/심각, 12시간 110mm 이상 경계)이며 확정 기준이 오면 아래 표만 고친다.
 * 수위는 센서 연계 전이라 값이 없다 — 스테이징은 값이 없을 때 샘플 알림 2건(우량·수위)을 보여 알림 구성을 확인하게 한다.
 */
const HOUR_STEPS: [number, DisasterAlert["level"]][] = [[70, "danger"], [50, "alert"], [30, "warning"]]
const TWELVE_HOUR_WARNING_MM = 110
const POLL_MS = 60_000

const iso = (tm: string) => `${tm.slice(0, 4)}-${tm.slice(4, 6)}-${tm.slice(6, 8)}T${tm.slice(8, 10)}:${tm.slice(10, 12)}:00`

export function rainfallAlertsOf(stations: RainfallStation[]): DisasterAlert[] {
  const out: DisasterAlert[] = []
  for (const s of stations) {
    const hour = s.rain60mMm
    const step = hour == null ? undefined : HOUR_STEPS.find(([mm]) => hour >= mm)
    let level = step?.[1]
    let message = step ? `1시간 누적 강우 ${hour}mm — 임계치 ${step[0]}mm 이상` : ""
    if (s.rain12hMm != null && s.rain12hMm >= TWELVE_HOUR_WARNING_MM && level !== "danger") {
      level = "alert"
      message = `12시간 누적 강우 ${s.rain12hMm}mm — 임계치 ${TWELVE_HOUR_WARNING_MM}mm 이상`
    }
    if (!level) continue
    out.push({ id: `rain-${s.stnId}`, level, title: `우량 임계치 초과 · ${s.label}`, issuedAt: iso(s.tm), expiresAt: iso(s.tm), target: "기상청 AWS 우량", message, href: "/heavy-rain" })
  }
  return out
}

const SAMPLE_ALERTS: DisasterAlert[] = [
  { id: "sample-rain", level: "alert", title: "우량 임계치 초과 · 서귀포(샘플)", issuedAt: "2026-10-13T09:40:00", expiresAt: "2026-10-13T10:40:00", target: "기상청 AWS 우량 · 샘플", message: "1시간 누적 강우 52mm — 임계치 50mm 이상", href: "/heavy-rain" },
  { id: "sample-level", level: "warning", title: "수위 임계치 초과 · 효돈천 돈내코(샘플)", issuedAt: "2026-10-13T09:35:00", expiresAt: "2026-10-13T10:35:00", target: "하천 수위 센서 · 샘플", message: "수위 1.8m — 주의 기준 1.5m 이상(센서 연계 전 샘플)", href: "/river" },
]

/** 알림 목록용 — 값이 있으면 그 값, 없고 스테이징이면 샘플 */
export function useRainfallAlerts(): DisasterAlert[] {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([])
  useEffect(() => {
    let alive = true
    const load = () =>
      Promise.all([fetchJejuCityRainfall(), fetchRiverReferenceRainfall()])
        .then((r) => alive && setAlerts(rainfallAlertsOf(r.flat())))
        .catch(() => alive && setAlerts([]))
    void load()
    const t = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])
  return alerts.length === 0 && IS_STAGING ? SAMPLE_ALERTS : alerts
}
