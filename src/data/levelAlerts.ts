import type { DisasterAlert } from "../types/incident"

/**
 * 수위 임계치 알람 — 요구사항 '통합상황판 우선 확인 내용'(실시간 강우·수위 정보, 임계치 초과 시 알람)의 수위 쪽.
 * 수위 원천(제주시 하천 모니터링·자동 침수 경보 시스템)은 섬엔지니어링 협의 후 10월 중순 수령 예정이라, 값과 기준은 모두 임의 샘플이다.
 * 기준(관심·주의·경계·심각 m)은 표시용 잠정치이고 지점마다 다르다 — 실제 기준과 값이 오면 LEVEL_SAMPLE만 교체한다.
 * 스테이징은 샘플로 알림을 보여주고, 프로토타입은 수위 값이 없어 알림을 만들지 않는다(우량 알림은 기상청 실측으로 별도).
 */
export type LevelStage = "관심" | "주의" | "경계" | "심각"
export interface LevelPoint {
  id: string
  /** 값을 주는 레거시 시스템 id(mockHeavyRain.ts legacySystems) */
  system: "ls-river-mon" | "ls-flood-warn"
  /** 하천명 또는 센서 번호 */
  group: string
  place: string
  /** 지도 표시용 근사 위치(임의) */
  lat: number
  lng: number
  levelM: number
  /** "YYYY-MM-DDTHH:mm:ss" */
  at: string
  /** 단계별 수위 기준(m, 이상) */
  steps: Record<LevelStage, number>
}

export const LEVEL_SAMPLE: LevelPoint[] = [
  { id: "lv-hancheon", system: "ls-river-mon", group: "한천", place: "용연", lat: 33.5139, lng: 126.5106, levelM: 1.12, at: "2026-10-13T09:40:00", steps: { 관심: 0.6, 주의: 1.0, 경계: 1.5, 심각: 2.0 } },
  { id: "lv-sanjicheon", system: "ls-river-mon", group: "산지천", place: "동문교", lat: 33.5128, lng: 126.529, levelM: 0.48, at: "2026-10-13T09:40:00", steps: { 관심: 0.6, 주의: 1.0, 경계: 1.5, 심각: 2.0 } },
  { id: "lv-hwabukcheon", system: "ls-river-mon", group: "화북천", place: "화북교", lat: 33.5258, lng: 126.5775, levelM: 0.35, at: "2026-10-13T09:40:00", steps: { 관심: 0.5, 주의: 0.9, 경계: 1.3, 심각: 1.8 } },
  { id: "lv-j014", system: "ls-flood-warn", group: "침수센서 J-014", place: "제주시 한천 인근", lat: 33.509, lng: 126.5135, levelM: 0.12, at: "2026-10-13T09:40:00", steps: { 관심: 0.15, 주의: 0.3, 경계: 0.45, 심각: 0.6 } },
  { id: "lv-j037", system: "ls-flood-warn", group: "침수센서 J-037", place: "제주시 건입동", lat: 33.519, lng: 126.5385, levelM: 0.47, at: "2026-10-13T09:40:00", steps: { 관심: 0.15, 주의: 0.3, 경계: 0.45, 심각: 0.6 } },
  { id: "lv-j052", system: "ls-flood-warn", group: "침수센서 J-052", place: "제주시 화북", lat: 33.5245, lng: 126.575, levelM: 0.05, at: "2026-10-13T09:40:00", steps: { 관심: 0.15, 주의: 0.3, 경계: 0.45, 심각: 0.6 } },
]

const ORDER: LevelStage[] = ["심각", "경계", "주의", "관심"]
const RISK: Record<LevelStage, DisasterAlert["level"]> = { 관심: "caution", 주의: "warning", 경계: "alert", 심각: "danger" }
const pad = (n: number) => String(n).padStart(2, "0")
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

/** 수위가 넘은 가장 높은 단계 — 기준 미만이면 null. 기준값과 같으면 넘은 것으로 본다 */
export const levelStageOf = (p: LevelPoint): LevelStage | null => ORDER.find((s) => p.levelM >= p.steps[s]) ?? null

/** 알림은 '주의' 이상만 만든다(관심은 표에서만 보인다) */
export function levelAlertsOf(points: LevelPoint[]): DisasterAlert[] {
  const out: DisasterAlert[] = []
  for (const p of points) {
    const stage = levelStageOf(p)
    if (!stage || stage === "관심") continue
    const end = new Date(p.at)
    end.setHours(end.getHours() + 1)
    out.push({
      id: `level-${p.id}`,
      level: RISK[stage],
      title: `수위 임계치 초과 · ${p.group} ${p.place}(샘플)`,
      issuedAt: p.at,
      expiresAt: local(end),
      target: `${p.system === "ls-river-mon" ? "하천 모니터링시스템" : "자동 침수 경보 시스템"} · 샘플`,
      message: `수위 ${p.levelM.toFixed(2)}m — ${stage} 기준 ${p.steps[stage].toFixed(2)}m 이상(레거시 수위 연계 전 임의 값)`,
      href: p.system === "ls-river-mon" ? "/river" : "/heavy-rain",
    })
  }
  return out
}
