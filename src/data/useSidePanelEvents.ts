import { useEffect, useMemo, useSyncExternalStore } from "react"
import type { RiskLevel } from "../types/domain"
import type { WarningEntry } from "../types/warningsApi"
import type { TyphoonNowEntry } from "../types/typhoonApi"
import { fetchJejuWarnings } from "./warningsApi"
import { fetchTyphoonNow } from "./typhoonApi"
import { fetchDisasterMessages, type DisasterMsg } from "./disasterMsgApi"
import { buildSampleEvents, type SpEvent } from "./sidePanelSamples"

/**
 * 종합상황 좌측 패널(타임라인·발효중 특보·실시간 특보)이 함께 쓰는 사건 목록.
 * 실데이터 = 기상청 API허브 특보(최근 24시간 발표)와 태풍 현황. **데이터를 받았으면(값이 0건이어도) 그 값 그대로** 보여준다 —
 * 0건이면 "발표 없음"이다(mode "live", events가 비어 있음). **둘 다 못 받았을 때만** 디자인 확인용 샘플을 보여주고
 * (mode "sample") 화면에 "샘플" 표식이 붙는다. 실데이터와 샘플을 섞지 않는다.
 * 재난문자는 행정안전부 긴급재난문자(제주 수신분)를 프록시(/api/disaster-msg)로 받는다 — 못 받으면 그것만 비고(messagesError) 나머지는 그대로다.
 */
export type EventsMode = "loading" | "live" | "sample"

export interface SidePanelEvents {
  mode: EventsMode
  events: SpEvent[]
  /** 특보 API를 못 받았을 때의 메시지(받았으면 null) */
  warningsError: string | null
  /** 재난문자를 못 받았을 때의 메시지(받았으면 null) */
  messagesError: string | null
  /** 마지막으로 성공 수신한 시각 */
  fetchedAt: Date | null
}

interface Snapshot {
  loaded: boolean
  /** 특보·태풍 중 하나라도 응답을 받았는가 */
  anyOk: boolean
  warnings: WarningEntry[]
  typhoons: TyphoonNowEntry[]
  messages: DisasterMsg[]
  warningsError: string | null
  messagesError: string | null
  fetchedAt: Date | null
}

const REFRESH_MS = 10 * 60 * 1000
let snapshot: Snapshot = { loaded: false, anyOk: false, warnings: [], typhoons: [], messages: [], warningsError: null, messagesError: null, fetchedAt: null }
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
        anyOk: w.status === "fulfilled" || t.status === "fulfilled" || m.status === "fulfilled",
        warnings: w.status === "fulfilled" ? w.value.entries : [],
        typhoons: t.status === "fulfilled" ? t.value : [],
        messages: m.status === "fulfilled" ? m.value : [],
        warningsError: w.status === "rejected" ? (w.reason instanceof Error ? w.reason.message : String(w.reason)) : null,
        messagesError: m.status === "rejected" ? (m.reason instanceof Error ? m.reason.message : String(m.reason)) : null,
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

  const live = useMemo(() => {
    const analysis = snap.typhoons.filter((t) => t.ft === "0")
    return [...snap.warnings.map(warningToEvent), ...analysis.map(typhoonToEvent), ...snap.messages.map(messageToEvent)].sort((a, b) => b.at.getTime() - a.at.getTime())
  }, [snap])
  const sample = useMemo(() => buildSampleEvents(), [])

  if (!snap.loaded) return { mode: "loading", events: [], warningsError: null, messagesError: null, fetchedAt: null }
  if (!snap.anyOk) return { mode: "sample", events: sample, warningsError: snap.warningsError, messagesError: snap.messagesError, fetchedAt: snap.fetchedAt }
  return { mode: "live", events: live, warningsError: snap.warningsError, messagesError: snap.messagesError, fetchedAt: snap.fetchedAt }
}
