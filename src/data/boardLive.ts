import { useEffect, useState } from "react"
import type { WarningEntry } from "../types/warningsApi"
import { fetchJejuWarnings } from "./warningsApi"
import { parseKst } from "./useSidePanelEvents"
import type { RiskMarker } from "../types/domain"
import { bd, type BoardService, type BoardStateId, type DashLeft, type RightPanel } from "./boardTypes"
import type { Facts } from "./boardFacts"
import type { CardWarnings } from "./serviceCardCounts"

/**
 * 서비스 보드의 실데이터 겹치기 — 기상청 특보(최근 24시간 발표분)가 이 서비스 코드로 있으면 평시 기본 상태 위에 그 값을 얹는다.
 * 사건 기록(경보 발송·출동 등)은 아직 받는 곳이 없어서 특보에서 알 수 있는 것(발표 종류·지역·시각)만 채우고 나머지는 그대로 둔다.
 * wrn_met_data는 "발효 중" 플래그가 없어 "발표"로 쓴다(지금 발효 중이라 단정하지 않음).
 */
export interface WarnGroup {
  /** "호우주의보" */
  label: string
  level: "warning" | "alert"
  regions: string[]
  /** 가장 최근 발표 시각 */
  at: Date
}
export type ServiceWarnings = { status: "idle" | "loading" | "failed" } | { status: "ready"; groups: WarnGroup[] }

const CACHE_MS = 60 * 1000
let cache: { at: number; entries: WarningEntry[] } | null = null
let inflight: Promise<WarningEntry[]> | null = null
async function entries(): Promise<WarningEntry[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.entries
  inflight ??= fetchJejuWarnings()
    .then((r) => {
      cache = { at: Date.now(), entries: r.entries }
      return r.entries
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function groupWarnings(list: WarningEntry[], codes: string[]): WarnGroup[] {
  const map = new Map<string, WarnGroup>()
  // lvl 1=주의보 · 2=경보만 쓴다(그 밖의 값은 프록시가 이름을 못 붙인 항목 — "호우3"처럼 보이므로 제외)
  for (const e of list.filter((x) => codes.includes(x.wrn) && (x.lvl === "1" || x.lvl === "2"))) {
    const label = `${e.wrnLabel}${e.lvlLabel}`
    const at = parseKst(e.tmFc)
    const g = map.get(label) ?? { label, level: e.lvl === "2" ? "alert" : "warning", regions: [], at }
    if (!g.regions.includes(e.regionLabel)) g.regions.push(e.regionLabel)
    if (at > g.at) g.at = at
    map.set(label, g)
  }
  return [...map.values()].sort((a, b) => b.at.getTime() - a.at.getTime())
}

/** 카드와 서비스 보드가 같은 캐시를 사용하며 1분마다 다시 집계한다. */
export function useWarningEntries(enabled = true): CardWarnings {
  const [stored, setStored] = useState<CardWarnings>({ status: "loading" })
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const refresh = () => {
      void entries()
        .then((list) => !cancelled && setStored({ status: "ready", entries: list }))
        .catch(() => !cancelled && setStored({ status: "failed" }))
    }
    refresh()
    const timer = setInterval(refresh, CACHE_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled])
  return stored
}

/** codes가 없으면(기상청 외 기관 특보 서비스) 받지 않는다 */
export function useServiceWarnings(codes: string[] | undefined): ServiceWarnings {
  const warnings = useWarningEntries(!!codes?.length)
  if (!codes?.length) return { status: "idle" }
  return warnings.status === "ready" ? { status: "ready", groups: groupWarnings(warnings.entries, codes) } : warnings
}

const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
const elapsed = (from: Date) => {
  const min = Math.max(0, Math.round((Date.now() - from.getTime()) / 60000))
  return min < 60 ? `${min}분` : `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ""}`
}

/** 받은 값(타일·브리핑·서비스 상태)을 평시 기본 값 위에 얹는다. 기상청 특보가 따로 있으면 서비스 상태는 특보가 우선 */
function withFacts(d: DashLeft, f: Facts, hasWarn: boolean): DashLeft {
  return {
    ...d,
    status: f.status && !hasWarn ? { ...d.status, ...f.status, rows: d.status.rows, live: true } : d.status,
    tiles: d.tiles.map((t) => (f.tiles?.[t.label] ? { ...t, ...f.tiles[t.label], live: true } : t)),
    brief: d.brief.map(([k, v]) => [k, f.brief?.[k as "판단" | "전개" | "대응"] ?? v] as [string, string]),
  }
}

/** 실제 값이 있으면 평시 기본 상태 위에 얹은 좌·우 패널을 돌려준다(없으면 null — 평시 그대로) */
export function liveOverlay(s: BoardService, w: ServiceWarnings, facts: Facts | null, state: BoardStateId = "calm"): { dash: DashLeft; right: RightPanel } | null {
  const hasWarn = w.status === "ready" && w.groups.length > 0
  if (!hasWarn && !facts) return null
  // 스테이징은 고른 샘플 상태가 바탕이다 — 그 위에 받은 값만 덮어쓴다(평시는 프로토타입과 같이 통째로 실제 값)
  const sampleState = state === "detect" || state === "progress"
  const baseDash = sampleState ? s.dash[state] : s.dash.calm
  const baseRight = s.right[state]
  const calmDash = facts ? withFacts(baseDash, facts, hasWarn) : baseDash
  if (!hasWarn || w.status !== "ready") return { dash: calmDash, right: baseRight }
  if (state === "closed") return { dash: calmDash, right: baseRight }
  const top0 = w.groups[0]
  const names0 = w.groups.map((g) => `${g.label} · ${g.regions.join("·")}`).join(" / ")
  if (sampleState) {
    // 샘플 상태 + 실제 특보: 상태 카드 배지·특보 배너·조치 기록 맨 위에 실제 특보를 얹고 나머지(할 일·조치)는 샘플 그대로
    return {
      dash: { ...calmDash, status: { ...calmDash.status, badge: bd(top0.label, top0.level), live: true }, brief: calmDash.brief },
      right: {
        ...baseRight,
        trigger: { name: `${names0} 발표`, advice: baseRight.trigger?.advice ?? s.right.detect.trigger?.advice ?? "", live: true },
        log: [...w.groups.map((g) => ({ time: hm(g.at), tag: "감지" as const, text: `기상청 발표(실시간) · ${g.label} — ${g.regions.join("·")}` })), ...baseRight.log],
      },
    }
  }

  const top = w.groups[0]
  const names = w.groups.map((g) => `${g.label} · ${g.regions.join("·")}`).join(" / ")
  const level = w.groups.some((g) => g.level === "alert") ? ("alert" as const) : ("warning" as const)
  const calmRight = s.right.calm
  const sample = s.right.detect.trigger

  const dash: DashLeft = {
    ...calmDash,
    status: {
      ...calmDash.status,
      badge: bd(top.label, top.level),
      heading: `기상청 ${top.label} 발표`,
      lines: [`${names} · 발표 ${hm(top.at)}`, "관측·사건 기록 연계 전 — 특보 발표만 반영"],
    },
    brief: [["판단", `기상청 ${names} 발표`], ...calmDash.brief.filter(([k]) => k !== "판단")],
  }
  const right: RightPanel = {
    ...calmRight,
    head: bd(`특보 발표 후 ${elapsed(top.at)}`, level),
    doing: { badge: bd("0건", "offline"), items: [], empty: "조치 기록(경보 발송·출동·문자 발송)을 받는 곳이 아직 연결 전이라 표시할 조치가 없습니다. 연결되면 이곳에 진행 중 조치가 나옵니다." },
    trigger: { name: `${names} 발표`, advice: sample?.advice ?? "" },
    todo: {
      badge: bd("1건 대기", "warning"),
      items: [
        {
          tag: "확인",
          title: `기상청 ${top.label} 발표 확인 — 대응 필요 여부 판단`,
          detail: `${top.regions.join("·")} · 발표 ${hm(top.at)} · 사건 기록·관측 연계 전`,
          actions: [{ label: "확인", kind: "ok" }],
          link: { label: "근거 보기 →", route: "analysis" },
        },
      ],
    },
    log: w.groups.map((g) => ({ time: hm(g.at), tag: "감지" as const, text: `기상청 발표 · ${g.label} — ${g.regions.join("·")}` })),
  }
  return { dash, right }
}

// 시청 위치 — 특보 발표 지역을 지도에 한 점으로 표시할 때 쓴다(특보가 구역 단위라 정확한 좌표가 없다)
const CITY_HALL: Record<string, { lat: number; lng: number }> = { 제주시: { lat: 33.4996, lng: 126.5312 }, 서귀포시: { lat: 33.2541, lng: 126.5601 } }

/** 특보가 발표된 시(제주시·서귀포시)를 지도 마커로 — 이 서비스의 지도 분야(domain)에 속하게 한다 */
export function warningMarkers(w: ServiceWarnings, domain: RiskMarker["domain"]): RiskMarker[] {
  if (w.status !== "ready") return []
  const byRegion = new Map<string, { label: string; level: "warning" | "alert" }>()
  for (const g of w.groups)
    for (const r of g.regions) {
      const prev = byRegion.get(r)
      if (!prev || (g.level === "alert" && prev.level !== "alert")) byRegion.set(r, { label: g.label, level: g.level })
    }
  return [...byRegion.entries()]
    .filter(([r]) => CITY_HALL[r])
    .map(([r, v]) => ({ id: `warn-${domain}-${r}`, name: `${r} · ${v.label}`, x: 0, y: 0, level: v.level, domain, lat: CITY_HALL[r].lat, lng: CITY_HALL[r].lng, value: "기상청 특보 발표 지역" }))
}

/** 지도 위 한 줄 — 특보가 있으면 그 내용 */
export function warningHeadline(w: ServiceWarnings): string | null {
  if (w.status !== "ready" || w.groups.length === 0) return null
  const g = w.groups[0]
  return `⚠ 기상청 ${g.label} 발표 · ${g.regions.join("·")} ${hm(g.at)}${w.groups.length > 1 ? ` 외 ${w.groups.length - 1}건` : ""}`
}
