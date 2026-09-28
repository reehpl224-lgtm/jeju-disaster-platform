/**
 * 시나리오 시계 — mock 데이터의 "현재 상황" 시각을 실제 현재 시각에 맞춘다(2026-09-28 사용자 요청).
 *
 * 서비스마다 더미 시나리오를 작성한 날짜가 달라(9/7·9/8·9/22 등) 화면마다 기준 시각이 제각각이었다.
 * 데이터 값(위험 단계·수치)은 그대로 두고 **시각만** 옮긴다: 모듈마다 "작성 당시의 지금"(ANCHOR)을
 * 정해 두고, 그 모듈의 모든 시나리오 시각을 (실제 현재 − ANCHOR)만큼 평행이동한다. 그래서 ANCHOR 시각은
 * 지금이 되고, 사건 간 간격(예: 23분 전 감지, 3일 뒤 도달 예상, 7일 전 종료된 지난 사례)은 유지된다.
 * 사용자 시나리오가 바뀌어 데이터를 새로 쓸 땐 아래 ANCHOR만 그 시나리오의 "지금"으로 바꾸면 된다.
 *
 * 표기 규칙 — 시나리오 시각은 하이픈(2026-09-22 09:15)으로 쓰고 이동 대상이 된다. 실제로 일어난 사실의
 * 날짜(회의일, API 확인일 등)는 점(2026.09.09)으로 써서 이동하지 않게 한다. 실측 스냅샷 객체(KHOA)는
 * SKIP으로 통째로 제외한다.
 *
 * main.tsx에서 App보다 먼저 import해야 한다 — 다른 모듈이 import 시점에 값을 복사해 가기 전에 옮기기 위함.
 */
import * as Aqua from "./mockAqua"
import * as Cctv from "./mockCctv"
import * as Coast from "./mockCoast"
import * as Dashboard from "./mockDashboard"
import * as Heat from "./mockHeat"
import * as HeavyRain from "./mockHeavyRain"
import * as Incidents from "./mockIncidents"
import * as Monitoring from "./mockMonitoring"
import * as Propagation from "./mockPropagation"
import * as Reports from "./mockReports"
import * as River from "./mockRiver"
import * as Typhoon from "./mockTyphoon"

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const MINUTE = 60 * 1000

/** 모듈별 "작성 당시의 지금"(KST) — 이 시각이 실제 현재 시각으로 옮겨진다 */
const MODULES: { name: string; mod: Record<string, unknown>; anchor: string; skip?: string[] }[] = [
  { name: "mockAqua", mod: Aqua, anchor: "2026-09-22 09:15", skip: ["khoaLiveObservations"] },
  { name: "mockRiver", mod: River, anchor: "2026-09-22 09:15", skip: ["khoaMoseulpoTide"] },
  { name: "mockCoast", mod: Coast, anchor: "2026-09-22 09:15" },
  { name: "mockDashboard", mod: Dashboard, anchor: "2026-09-22 09:15" },
  { name: "mockHeavyRain", mod: HeavyRain, anchor: "2026-09-08 14:33" },
  { name: "mockTyphoon", mod: Typhoon, anchor: "2026-09-08 14:05" },
  { name: "mockHeat", mod: Heat, anchor: "2026-09-08 14:00" },
  { name: "mockCctv", mod: Cctv, anchor: "2026-09-08 14:33" },
  { name: "mockPropagation", mod: Propagation, anchor: "2026-09-08 14:35" },
  { name: "mockIncidents", mod: Incidents, anchor: "2026-09-07 17:00" },
  { name: "mockReports", mod: Reports, anchor: "2026-09-04 23:59" },
  { name: "mockMonitoring", mod: Monitoring, anchor: "2026-09-04 09:42" },
]

const pad = (n: number) => String(n).padStart(2, "0")

/** "YYYY-MM-DD HH:MM" (KST) → epoch ms */
function kstMs(date: string, time = "00:00", sec = "00"): number {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, mi] = time.split(":").map(Number)
  return Date.UTC(y, mo - 1, d, h, mi, Number(sec)) - KST_OFFSET_MS
}

/** epoch ms → KST 구성요소 */
function kstParts(ms: number) {
  const t = new Date(ms + KST_OFFSET_MS)
  return {
    date: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    md: `${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    hm: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`,
    s: pad(t.getUTCSeconds()),
  }
}

// ISO(2026-09-07T15:22:00+09:00) | 날짜+시각(2026-09-22 09:15[:07]) | 날짜(2026-09-22) | 시각(09:15[:07])
const STAMP =
  /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?(\+09:00)?|(\d{4}-\d{2}-\d{2}) ((?:[01]\d|2[0-3]):[0-5]\d)(?::([0-5]\d))?|(\d{4}-\d{2}-\d{2})(?![\d.])|(?<![\d:.])((?:[01]\d|2[0-3]):[0-5]\d)(?::([0-5]\d))?(?![\d:])/g

/** 문자열 안의 시나리오 시각을 deltaMs만큼 옮긴다. anchorDate는 날짜 없는 "HH:MM"이 속한 날 */
function shiftText(text: string, deltaMs: number, anchorDate: string): string {
  // 연도 없는 "MM-DD"(폭염 추이 등)는 값 전체가 그 형식일 때만 날짜로 본다
  if (/^\d{2}-\d{2}$/.test(text)) {
    return kstParts(kstMs(`${anchorDate.slice(0, 4)}-${text}`) + deltaMs).md
  }
  return text.replace(STAMP, (m, isoD, isoT, isoS, isoZ, dtD, dtT, dtS, dOnly, tOnly, tS) => {
    if (isoD) {
      const p = kstParts(kstMs(isoD, isoT, isoS ?? "00") + deltaMs)
      return `${p.date}T${p.hm}${isoS !== undefined ? `:${p.s}` : ""}${isoZ ?? ""}`
    }
    if (dtD) {
      const p = kstParts(kstMs(dtD, dtT, dtS ?? "00") + deltaMs)
      return `${p.date} ${p.hm}${dtS !== undefined ? `:${p.s}` : ""}`
    }
    if (dOnly) return kstParts(kstMs(dOnly) + deltaMs).date
    if (tOnly) {
      const p = kstParts(kstMs(anchorDate, tOnly, tS ?? "00") + deltaMs)
      return `${p.hm}${tS !== undefined ? `:${p.s}` : ""}`
    }
    return m
  })
}

/** 앵커 → 지금 이동량. 5분 단위로 내림해 시각이 깔끔하고, 가장 최근 사건이 현재보다 미래가 되지 않게 한다 */
function deltaFor(anchor: string, now: number): number {
  const [d, t] = anchor.split(" ")
  const raw = now - kstMs(d, t)
  return Math.floor(raw / (5 * MINUTE)) * 5 * MINUTE
}

function walk(value: unknown, deltaMs: number, anchorDate: string, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return shiftText(value, deltaMs, anchorDate)
  if (value === null || typeof value !== "object" || seen.has(value)) return value
  seen.add(value)
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = walk(value[i], deltaMs, anchorDate, seen)
  } else {
    const obj = value as Record<string, unknown>
    for (const key of Object.keys(obj)) obj[key] = walk(obj[key], deltaMs, anchorDate, seen)
  }
  return value
}

const NOW = Date.now()
const seen = new WeakSet<object>()
const deltas: Record<string, { deltaMs: number; anchorDate: string }> = {}

for (const { name, mod, anchor, skip = [] } of MODULES) {
  const deltaMs = deltaFor(anchor, NOW)
  const anchorDate = anchor.split(" ")[0]
  deltas[name] = { deltaMs, anchorDate }
  for (const [exportName, value] of Object.entries(mod)) {
    if (skip.includes(exportName) || typeof value !== "object" || value === null) continue
    walk(value, deltaMs, anchorDate, seen)
  }
}

/**
 * 문자열(primitive)로 export된 시나리오 시각은 제자리에서 바꿀 수 없어, 쓰는 쪽에서 이 함수로 옮긴다.
 * 예: scenarioTime("mockMonitoring", monitoringLastSyncedAt)
 */
export function scenarioTime(moduleName: string, text: string): string {
  const d = deltas[moduleName]
  return d ? shiftText(text, d.deltaMs, d.anchorDate) : text
}

/** 날짜 비교용 "오늘" — 예전 코드가 고정 날짜를 기준일로 쓰던 곳(이력 기간 필터 등)에서 쓴다 */
export const SCENARIO_NOW = new Date(NOW)
