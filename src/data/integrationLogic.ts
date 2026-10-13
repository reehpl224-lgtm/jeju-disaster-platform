import type { PilotBatch } from "./pilotBatch/generate"
import { classifyRiverRisk } from "./riverAlertThresholds"

/**
 * 연계 오류 대응·원본↔표출 일치성 검증 — 요구사항 '연계 오류 대응'·'원본·표출 데이터 일치성 검증'.
 * (1) 지금 받은 데이터를 자동으로 점검해(수신 여부·원본 값과 화면 판정 대조·ID 중복) 결과를 Check로 만들고,
 * (2) 오류가 있으면 오류 건으로 접수해 유형별로 분류하고 접수 → 수정 중 → 재검증 → 완료로 처리하며,
 * (3) 완료는 같은 점검을 다시 돌려 정상일 때만 된다. 저장소와 무관한 순수 계산만 둔다.
 */
export type IssueType = "수신 실패" | "일부 수신 실패" | "값 불일치" | "누락·중복" | "형식 오류"
/** 현재 수위와 이력 마지막 값의 허용 차이(m) — 센서 반올림·갱신 시차를 감안한다 */
export const STAGE_TOLERANCE_M = 0.02
const LV: Record<string, string> = { safe: "정상", caution: "관심", warning: "주의", alert: "경계", danger: "심각" }
export const ISSUE_TYPES: IssueType[] = ["수신 실패", "일부 수신 실패", "값 불일치", "누락·중복", "형식 오류"]
export type IssueStatus = "접수" | "수정 중" | "재검증" | "완료"

export interface Check {
  id: string
  system: string
  label: string
  ok: boolean
  type: IssueType
  /** 원본(받은 값) · 표출(화면이 보여 주는 값) — 값 비교 점검에만 있다 */
  raw?: string
  shown?: string
  detail: string
}

export interface IssueEvent {
  at: string
  status: IssueStatus
  by: string
  note?: string
}
export interface Issue {
  id: string
  /** 자동 점검에서 접수했으면 그 점검 ID, 사람이 직접 접수했으면 없음 */
  checkId?: string
  system: string
  type: IssueType
  detail: string
  status: IssueStatus
  createdAt: string
  events: IssueEvent[]
  lastCheck?: { at: string; ok: boolean; text: string }
}

export interface CheckInput {
  /** 사이드패널 출처 중 못 받은 것 */
  nullSources: string[]
  /** 사이드패널 출처 수신 완료 여부 */
  sourcesLoaded: boolean
  cctv: { phase: "loading" | "ready" | "partial" | "failed" | "unconfigured"; receivedFeeds: number }
  /** 실증사 배치 — 없으면(연계 전) 값 비교 점검은 하지 않는다 */
  batch: PilotBatch | null
  /** 공통 이벤트 ID들 */
  eventIds: string[]
}

export function buildChecks(i: CheckInput): Check[] {
  const out: Check[] = []
  if (i.sourcesLoaded) {
    for (const name of ["기상청 특보", "태풍 현황", "재난문자"]) {
      const bad = i.nullSources.includes(name)
      out.push({ id: `recv:${name}`, system: name, label: `${name} 수신`, ok: !bad, type: "수신 실패", detail: bad ? "응답을 받지 못했습니다 — 프록시·원천 기관 응답을 확인하세요." : "정상 수신" })
    }
  }
  if (i.cctv.phase !== "loading") {
    const ok = i.cctv.phase === "ready"
    const type: IssueType = i.cctv.phase === "partial" ? "일부 수신 실패" : "수신 실패"
    const detail = ok ? "3/3종 수신" : i.cctv.phase === "partial" ? `${i.cctv.receivedFeeds}/3종만 수신` : i.cctv.phase === "unconfigured" ? "조회용 프록시 주소가 설정되지 않음" : "목록을 받지 못함"
    out.push({ id: "recv:CCTV", system: "제주시 CCTV(공공데이터포털)", label: "CCTV 목록 수신", ok, type, detail })
  }
  if (i.batch) {
    for (const p of i.batch.river.points) {
      const derived = classifyRiverRisk(p.flowRatioPercent)
      out.push({
        id: `value:river-level:${p.id}`, system: "하천범람 실증사", label: `${p.name} 위험 등급`, ok: derived === p.level, type: "값 불일치",
        raw: `${LV[p.level] ?? p.level} (유량비 ${p.flowRatioPercent}%)`, shown: LV[derived] ?? derived, detail: derived === p.level ? "원본 등급과 화면 판정 일치" : "원본 등급과 유량비로 계산한 화면 판정이 다릅니다.",
      })
      const last = p.history[p.history.length - 1]
      if (last) {
        const same = Math.abs(last.levelM - p.levelM) <= STAGE_TOLERANCE_M + 1e-9
        out.push({
          id: `value:river-stage:${p.id}`, system: "하천범람 실증사", label: `${p.name} 현재 수위`, ok: same, type: "값 불일치",
          raw: `${p.levelM} m`, shown: `${last.levelM} m (최근 이력)`, detail: same ? `현재값과 이력 마지막 값 일치(허용 ±${STAGE_TOLERANCE_M}m)` : `현재 수위와 이력의 마지막 값이 ${STAGE_TOLERANCE_M}m 넘게 다릅니다.`,
        })
      }
    }
  }
  const dup = i.eventIds.length - new Set(i.eventIds).size
  if (i.eventIds.length > 0) out.push({ id: "dup:event-id", system: "공통 이벤트", label: "이벤트 ID 중복", ok: dup === 0, type: "누락·중복", detail: dup === 0 ? `${i.eventIds.length}건 모두 고유` : `중복 ID ${dup}건` })
  return out
}

export const NEXT_ISSUE: Record<IssueStatus, IssueStatus[]> = { 접수: ["수정 중"], "수정 중": ["재검증"], 재검증: ["완료", "수정 중"], 완료: [] }
const uid = (n: number) => `E${n + 1}-${Math.random().toString(36).slice(2, 6)}`

/** 오류 접수 — 같은 점검으로 이미 처리 중인 건이 있으면 새로 만들지 않는다 */
export function registerIssue(list: Issue[], e: { checkId?: string; system: string; type: IssueType; detail: string }, by: string, now: Date): Issue[] {
  if (e.checkId && list.some((x) => x.checkId === e.checkId && x.status !== "완료")) return list
  const issue: Issue = { id: uid(list.length), ...e, status: "접수", createdAt: now.toISOString(), events: [{ at: now.toISOString(), status: "접수", by }] }
  return [...list, issue]
}

/** 같은 점검(또는 사람의 확인)을 다시 한 결과를 남긴다 */
export function recheckIssue(list: Issue[], id: string, result: { ok: boolean; text: string }, now: Date): Issue[] {
  return list.map((x) => (x.id === id ? { ...x, lastCheck: { at: now.toISOString(), ...result } } : x))
}

/** 상태를 한 단계 옮긴다 — 완료는 재검증이 정상이었을 때만, 재검증으로 가면 이전 재검증 결과는 지운다 */
export function advanceIssue(list: Issue[], id: string, to: IssueStatus, by: string, now: Date, note?: string): Issue[] {
  const x = list.find((i) => i.id === id)
  if (!x || !NEXT_ISSUE[x.status].includes(to)) return list
  if (to === "완료" && !x.lastCheck?.ok) return list
  const next: Issue = { ...x, status: to, events: [...x.events, { at: now.toISOString(), status: to, by, note: note?.trim() || undefined }], lastCheck: to === "재검증" ? undefined : x.lastCheck }
  return list.map((i) => (i.id === id ? next : i))
}
