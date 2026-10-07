import { useEffect, useMemo, useSyncExternalStore } from "react"
import type { RiskLevel } from "../types/domain"
import type { WarningEntry } from "../types/warningsApi"
import type { TyphoonNowEntry } from "../types/typhoonApi"
import { fetchJejuWarnings } from "./warningsApi"
import { fetchTyphoonNow } from "./typhoonApi"
import { fetchDisasterMessages, type DisasterMsg } from "./disasterMsgApi"
import { buildSampleEvents, type SpEvent } from "./sidePanelSamples"
import { IS_STAGING } from "./appMode"

/**
 * 종합상황 좌측 패널(타임라인·발효중 특보·실시간 특보)이 함께 쓰는 사건 목록 — 출처 셋: 기상청 특보(최근 24시간 발표) · 태풍 현황 ·
 * 긴급재난문자(제주 수신분, 받아 둔 스냅샷 scripts/fetch-disaster-msgs.mjs).
 *
 * 표시 규칙(2026-10-07 사용자 결정 — 세 환경 레이아웃은 같고 값만 다르다):
 *  - 프로토타입·로컬: 출처마다 **데이터를 받았으면 그 값 그대로**(0건이면 0건). **못 받은(null) 출처만** 그 출처의 샘플로 채우고
 *    사건 카드에 "샘플 · 데이터 없음"을 붙인다(nullSources에 이름이 담긴다). 실데이터와 샘플은 출처 단위로만 바뀐다.
 *  - 스테이징(vite --mode staging): 데이터를 받았어도 **임의의 값(샘플) 전체**를 보여준다(mode "staging"). 못 받은 출처는 nullSources로 알린다.
 */
export type EventsMode = "loading" | "live" | "staging"

export interface SidePanelEvents {
  mode: EventsMode
  events: SpEvent[]
  /** 데이터를 못 받은(null) 출처 이름 — 프로토타입에선 그 출처가 샘플로 채워져 있다 */
  nullSources: string[]
  /** 재난문자 파일을 받아 둔 시각(ISO) — 스냅샷 기준일 표시용 */
  messagesAsOf: string | null
  /** 마지막으로 성공 수신한 시각 */
  fetchedAt: Date | null
}

interface Snapshot {
  loaded: boolean
  warningsOk: boolean
  typhoonOk: boolean
  messagesOk: boolean
  warnings: WarningEntry[]
  typhoons: TyphoonNowEntry[]
  messages: DisasterMsg[]
  messagesAsOf: string | null
  fetchedAt: Date | null
}

const REFRESH_MS = 10 * 60 * 1000
let snapshot: Snapshot = { loaded: false, warningsOk: false, typhoonOk: false, messagesOk: false, warnings: [], typhoons: [], messages: [], messagesAsOf: null, fetchedAt: null }
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
let loading: Promise<void> | null = null

function load(): Promise<void> {
  if (loading) return loading
  loading = Promise.allSettled([fetchJejuWarnings(), fetchTyphoonNow(), fetchDisasterMessages()])
    .then(([w, t, m]) => {
      snapshot = {
        loaded: true,
        warningsOk: w.status === "fulfilled",
        typhoonOk: t.status === "fulfilled",
        messagesOk: m.status === "fulfilled",
        warnings: w.status === "fulfilled" ? w.value.entries : [],
        typhoons: t.status === "fulfilled" ? t.value : [],
        messages: m.status === "fulfilled" ? m.value.messages : [],
        messagesAsOf: m.status === "fulfilled" ? m.value.fetchedAt || null : null,
        fetchedAt: w.status === "fulfilled" || t.status === "fulfilled" ? new Date() : snapshot.fetchedAt,
      }
      listeners.forEach((fn) => fn())
    })
    .finally(() => {
      loading = null
    })
  return loading
}

/** KST "YYYYMMDDHHmm" → Date */
export function parseKst(tm: string): Date {
  return new Date(`${tm.slice(0, 4)}-${tm.slice(4, 6)}-${tm.slice(6, 8)}T${tm.slice(8, 10)}:${tm.slice(10, 12)}:00+09:00`)
}
const parseUtc = (tm: string) => new Date(`${tm.slice(0, 4)}-${tm.slice(4, 6)}-${tm.slice(6, 8)}T${tm.slice(8, 10)}:${tm.slice(10, 12)}:00Z`)

const WEATHER_ICON: Record<string, string> = { 강풍: "💨", 호우: "☔", 풍랑: "🌊", 폭염: "🔆", 건조: "🔥", 한파: "🥶", 대설: "❄️", 태풍: "🌀", 안개: "🌫️", 황사: "🌪️", 폭풍해일: "🌊", 지진해일: "🌊" }

export function warningToEvent(e: WarningEntry): SpEvent {
  const level: RiskLevel = e.lvl === "2" ? "alert" : "warning"
  return {
    id: `w-${e.regId}-${e.wrn}-${e.tmFc}`,
    source: "warnings",
    category: "weather",
    icon: WEATHER_ICON[e.wrnLabel] ?? "☔",
    level,
    status: "발령",
    title: `${e.wrnLabel}${e.lvlLabel}`,
    detail: `${e.regionLabel} · 기상청 발표`,
    at: parseKst(e.tmFc),
    // 발효 시각이 있으면 간트 막대의 시작으로 쓴다(끝은 발표에 없어 '미정')
    until: undefined,
    meta: e.tmEf ? [{ label: "발효", value: `${e.tmEf.slice(8, 10)}:${e.tmEf.slice(10, 12)}` }] : undefined,
    sample: false,
  }
}

/** 안전안내=관심 · 긴급재난=주의 · 위급재난=경계(디자인 4색에 맞춘 환산) */
export function messageToEvent(m: DisasterMsg): SpEvent {
  const level: RiskLevel = m.step === "위급재난" ? "alert" : m.step === "긴급재난" ? "warning" : "caution"
  const text = m.text.length > 90 ? `${m.text.slice(0, 90)}…` : m.text
  // 여러 시도에 한꺼번에 보낸 문자는 "제주 포함 N개 시도"로 줄여 보인다
  const regions = m.region.split(",").map((r) => r.trim()).filter(Boolean)
  const region = regions.length > 1 ? `제주 포함 ${regions.length}개 시도` : m.region
  return {
    id: `m-${m.id}`,
    source: "messages",
    category: "message",
    icon: "📩",
    level,
    status: "발령",
    title: `재난문자${m.step ? ` · ${m.step}` : ""}`,
    detail: `${region ? `${region} · ` : ""}${text}`,
    at: new Date(m.at),
    sample: false,
  }
}

export function typhoonToEvent(t: TyphoonNowEntry): SpEvent {
  return {
    id: `t-${t.year}-${t.typ}-${t.typTmUtc}`,
    source: "typhoon",
    category: "disaster",
    icon: "🌀",
    level: "caution",
    status: "발령",
    title: `제${Number(t.typ)}호 태풍`,
    detail: `위도 ${t.lat}°N · 경도 ${t.lon}°E 부근`,
    at: parseUtc(t.typTmUtc),
    meta: [
      { label: "이동", value: `${t.speedKmh}km/h` },
      { label: "중심기압", value: `${t.pressureHpa}hPa` },
      { label: "최대풍속", value: `${t.maxWindMs}m/s` },
    ],
    sample: false,
  }
}

export function useSidePanelEvents(): SidePanelEvents {
  const snap = useSyncExternalStore(subscribe, () => snapshot)
  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const sample = useMemo(() => buildSampleEvents(), [])
  const real = useMemo(() => {
    const analysis = snap.typhoons.filter((t) => t.ft === "0")
    return { warnings: snap.warnings.map(warningToEvent), typhoon: analysis.map(typhoonToEvent), messages: snap.messages.map(messageToEvent) }
  }, [snap])

  const nullSources = snap.loaded ? ([!snap.warningsOk && "기상청 특보", !snap.typhoonOk && "태풍 현황", !snap.messagesOk && "재난문자"].filter(Boolean) as string[]) : []
  const base = { nullSources, fetchedAt: snap.fetchedAt, messagesAsOf: snap.messagesAsOf }

  // 스테이징: 받는 중에도, 데이터가 있어도 항상 샘플 전체
  if (IS_STAGING) return { mode: "staging", events: sample, ...base }
  if (!snap.loaded) return { mode: "loading", events: [], ...base }
  // 프로토타입·로컬: 출처마다 받았으면 그 값, 못 받았으면(null) 그 출처의 샘플
  const pick = (src: "warnings" | "typhoon" | "messages", ok: boolean) => (ok ? real[src === "typhoon" ? "typhoon" : src === "messages" ? "messages" : "warnings"] : sample.filter((e) => e.source === src))
  const events = [...pick("warnings", snap.warningsOk), ...pick("typhoon", snap.typhoonOk), ...pick("messages", snap.messagesOk)].sort((a, b) => b.at.getTime() - a.at.getTime())
  return { mode: "live", events, ...base }
}
