import type { RiverRunState, RiverTimelinePoint, RiverResourceRequest } from "../types/riverRun"
import { classifyRiverRisk, riverLevelRank, RIVER_LEVELS } from "./riverAlertThresholds"
import { riverResources } from "./mockRiverResources"
import { scopedKey } from "./appEnv"
import * as DB from "./mockDashboard"
import * as RV from "./mockRiver"

/**
 * 하천 시나리오 실행 상태 — 보드·상세창·새로고침·다른 창에서 같은 값을 보게 하는 단일 소스(§2-5).
 * localStorage에 저장하고 BroadcastChannel로 변경을 알린다. 같은 창에서는 subscribe()로 구독자에게 알린다
 * (React는 useSyncExternalStore로 이 스토어를 구독한다 — riverRunHooks.ts).
 *
 * 재시작은 새 runId로 분리한다(§2-6) — 기존 실행의 이력을 지우거나 되감지 않는다. 이 프로토타입은 "현재 활성
 * 실행 1개"만 보관한다(과거 실행들의 별도 아카이브는 1차년도 범위가 아니다 — 과설계 금지 원칙).
 */

const STORAGE_KEY = scopedKey("jeju-ax-river-run")
const CHANNEL_NAME = scopedKey("jeju-ax-river-run")
const HOLD_DOWN_MIN = 30 // §2-3-2: 연안과 동일 30분, 한 단계씩
const ARRIVAL_DELAY_MIN = 15 // 가상 자원 모의 출동→도착 지연(고정값, 재현 가능해야 함)

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function parseSimTime(s: string): Date | null {
  const d = new Date(s.replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? null : d
}

function diffMinutes(a: string, b: string): number {
  const da = parseSimTime(a)
  const db = parseSimTime(b)
  if (!da || !db) return 0
  return (da.getTime() - db.getTime()) / 60000
}

function hhmm(s: string): string {
  const m = s.match(/(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : s
}

function emptyState(): RiverRunState {
  return {
    runId: uid("run"),
    createdAtSim: "-",
    timeline: [],
    playheadIndex: -1,
    playing: false,
    pointState: { 돈내코: undefined, 쇠소깍: undefined },
    pendingDown: { 돈내코: undefined, 쇠소깍: undefined },
    flow: {},
    resourceRequests: [],
    history: [],
    closurePending: false,
    version: 0,
  }
}

function load(): RiverRunState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RiverRunState
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.timeline)) {
      console.warn("[riverRunState] 저장된 실행 상태 형식이 올바르지 않아 무시합니다(초기 상태로 시작).")
      return null
    }
    return parsed
  } catch (e) {
    console.warn("[riverRunState] 저장된 실행 상태를 읽지 못했습니다(초기 상태로 시작):", e)
    return null
  }
}

function persist(next: RiverRunState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (e) {
    console.warn("[riverRunState] 저장 실패:", e)
  }
}

let state: RiverRunState = load() ?? emptyState()
const listeners = new Set<() => void>()
const emptyAlertDispatch = structuredClone(RV.riverAlertDispatch)
const emptyDispatchRequest = structuredClone(RV.riverDispatchRequest)
const emptyClosure = structuredClone(RV.riverClosure)

let channel: BroadcastChannel | null = null
// window가 없는 환경(Node 테스트 등)에서는 만들지 않는다 — BroadcastChannel은 핸들을 열어두므로
// 테스트 프로세스가 종료되지 않는 원인이 된다(실제 브라우저에서는 항상 window가 있다).
try {
  if (typeof window !== "undefined") channel = new BroadcastChannel(CHANNEL_NAME)
  if (channel) channel.onmessage = (event: MessageEvent<{ reset?: boolean }>) => {
    if (event.data?.reset) {
      window.location.reload() // 열린 보드·상세창도 저장값 삭제 후 평시 데이터로 다시 로드
      return
    }
    const next = load()
    if (next && next.version !== state.version) {
      state = next
      projectToMock()
      for (const l of listeners) l()
    }
  }
} catch {
  /* BroadcastChannel 미지원 환경 — 같은 창 안에서만 동작(구독은 여전히 됨) */
}

function commit(mutator: (draft: RiverRunState) => void, broadcast = true) {
  const draft: RiverRunState = structuredClone(state)
  mutator(draft)
  draft.version = state.version + 1
  state = draft
  persist(state)
  projectToMock()
  for (const l of listeners) l()
  if (broadcast) {
    try {
      channel?.postMessage({ v: state.version })
    } catch {
      /* 무시 */
    }
  }
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getRunState(): RiverRunState {
  return state
}

/** 현재 재생 위치의 시나리오 시각(없으면 마지막 값 유지 원칙에 따라 가장 최근 처리 시각) */
export function currentSimTime(): string {
  const p = state.timeline[state.playheadIndex]
  return p?.observedAt ?? state.createdAtSim
}

function worstLevel() {
  const levels = Object.values(state.pointState)
    .filter((v): v is NonNullable<typeof v> => !!v)
    .map((v) => v.level)
  if (levels.length === 0) return "safe" as const
  return levels.reduce((a, b) => (riverLevelRank(b) > riverLevelRank(a) ? b : a))
}

// ------------------------------------------------------------------ 명령(commands)

/** 새 시계열 업로드 — 새 실행으로 시작한다(§2-6: 재시작은 새 runId로 분리, 기존 이력을 지우지 않음) */
export function loadTimeline(points: RiverTimelinePoint[]) {
  const sorted = [...points].sort((a, b) => (a.observedAt < b.observedAt ? -1 : a.observedAt > b.observedAt ? 1 : 0))
  commit((d) => {
    const fresh = emptyState()
    fresh.timeline = sorted
    fresh.createdAtSim = sorted[0]?.observedAt ?? "-"
    // Object.assign만 하면 이전 실행의 선택 필드(endedAtSim·승인 스냅샷 등)가 남아
    // 강제 종료 후 새 파일을 올려도 새 실행이 이미 종료된 것으로 판정된다.
    for (const key of Object.keys(d)) delete (d as unknown as Record<string, unknown>)[key]
    Object.assign(d, fresh)
  })
}

/** 다음 시점으로 진행 — 건너뛴 중간 시각의 예약된 사건(하향 유지시간 도달·모의 도착)도 순서대로 빠짐없이 적용한다 */
export function advance() {
  commit((d) => {
    if (d.playheadIndex + 1 >= d.timeline.length) return
    d.playheadIndex += 1
    const point = d.timeline[d.playheadIndex]
    const simNow = point.observedAt

    if (d.flow.감지 === undefined) d.flow.감지 = hhmm(simNow)
    if (d.flow.확인 === undefined) d.flow.확인 = hhmm(simNow)

    // 이 시점까지의 같은 지점 관측만 반영(직전 값 유지 — 이후 시점은 다음 advance에서 처리)
    const candidate = classifyRiverRisk(point.flowRatioPercent)
    const cur = d.pointState[point.location]
    if (!cur) {
      d.pointState[point.location] = { level: candidate, sinceSim: simNow, flowRatioPercent: point.flowRatioPercent }
    } else if (riverLevelRank(candidate) > riverLevelRank(cur.level)) {
      // 상향은 즉시(안전을 늦추지 않음)
      d.pointState[point.location] = { level: candidate, sinceSim: simNow, flowRatioPercent: point.flowRatioPercent }
    } else if (riverLevelRank(candidate) < riverLevelRank(cur.level)) {
      // 하향은 한 단계씩, 그 단계에 HOLD_DOWN_MIN분 이상 머문 뒤에만(연안과 동일 규칙, §2-3-2)
      const oneStepDown = RIVER_LEVELS[riverLevelRank(cur.level) - 1]
      if (riverLevelRank(candidate) <= riverLevelRank(oneStepDown)) {
        const pending = d.pendingDown[point.location]
        if (!pending || pending.level !== oneStepDown) {
          d.pendingDown[point.location] = { level: oneStepDown, sinceSim: simNow }
        } else if (diffMinutes(simNow, pending.sinceSim) >= HOLD_DOWN_MIN) {
          d.pointState[point.location] = { level: oneStepDown, sinceSim: pending.sinceSim, flowRatioPercent: point.flowRatioPercent }
          d.pendingDown[point.location] = undefined
        }
      }
    } else {
      d.pendingDown[point.location] = undefined
    }
    d.pointState[point.location]!.flowRatioPercent = point.flowRatioPercent // 표시용 최신 입력값은 등급과 무관하게 항상 갱신

    // 모의 출동 중인 자원의 도착 처리(예약된 사건을 시각 순서대로 적용)
    for (const req of d.resourceRequests) {
      if (req.status === "출동 중" && req.approvedAtSim && diffMinutes(simNow, req.approvedAtSim) >= ARRIVAL_DELAY_MIN) {
        req.status = "도착"
        req.arrivedAtSim = simNow
        d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: `${resourceLabel(req.resourceId)} 현장 도착` })
      }
    }

    recomputeClosurePending(d)
  })
}

export function togglePlaying() {
  commit((d) => {
    d.playing = !d.playing
  })
}

/** 경보 발령 승인(/river/alert) — 판단·경보 단계를 함께 완료 처리한다. 승인 시점 등급을 얼려서 기록한다 */
export function approveAlert() {
  commit((d) => {
    const simNow = currentSimTime()
    if (d.flow.판단 === undefined || d.flow.판단 === "승인 대기") d.flow.판단 = hhmm(simNow)
    d.flow.경보 = hhmm(simNow)
    d.alertSnapshot = { level: worstLevel(), atSim: simNow }
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: "경보 발령 승인" })
  })
}

/** 출동 요청 승인(/river/dispatch) — 대응 단계를 시작 처리한다. 승인 시점 등급을 얼려서 기록한다 */
export function approveDispatch() {
  commit((d) => {
    const simNow = currentSimTime()
    d.flow.대응 = hhmm(simNow)
    d.dispatchSnapshot = { level: worstLevel(), atSim: simNow }
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: "출동 요청 승인" })
  })
}

export function requestResource(resourceId: string, qty: number, clientRequestId: string) {
  commit((d) => {
    if (d.resourceRequests.some((r) => r.clientRequestId === clientRequestId)) return // 중복 적용 방지
    const simNow = currentSimTime()
    const req: RiverResourceRequest = { id: uid("req"), resourceId, qty, status: "요청", requestedAtSim: simNow, clientRequestId }
    d.resourceRequests.push(req)
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: `${resourceLabel(resourceId)} ${qty}건 배치 요청` })
  })
}

function availableQty(d: RiverRunState, resourceId: string, excludeRequestId?: string): number {
  const item = riverResources.find((r) => r.id === resourceId)
  if (!item) return 0
  const active = d.resourceRequests
    .filter((r) => r.resourceId === resourceId && r.id !== excludeRequestId)
    .filter((r) => r.status === "요청" || r.status === "출동 중" || r.status === "도착" || r.status === "철수 중")
    .reduce((sum, r) => sum + r.qty, 0)
  return item.capacity - active
}

export function approveResourceRequest(requestId: string): { ok: boolean; reason?: string } {
  let result = { ok: true as boolean, reason: undefined as string | undefined }
  commit((d) => {
    const req = d.resourceRequests.find((r) => r.id === requestId)
    if (!req || req.status !== "요청") {
      result = { ok: false, reason: "이미 처리된 요청입니다." }
      return
    }
    // 승인 시 최신 상태로 재검사(§2-4) — 이 요청 자체는 아직 "요청" 상태라 자기 자신을 제외하고 계산
    if (availableQty(d, req.resourceId, req.id) < req.qty) {
      result = { ok: false, reason: "가용 수량을 초과해 승인할 수 없습니다." }
      return
    }
    const simNow = currentSimTime()
    req.status = "출동 중"
    req.approvedAtSim = simNow
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: `${resourceLabel(req.resourceId)} 배치 승인 · 모의 출동` })
  })
  return result
}

export function cancelResourceRequest(requestId: string) {
  commit((d) => {
    const req = d.resourceRequests.find((r) => r.id === requestId)
    if (!req || req.status === "도착" || req.status === "복귀 완료" || req.status === "취소") return
    req.status = "취소"
    d.history.push({ id: uid("hist"), simTime: hhmm(currentSimTime()), label: `${resourceLabel(req.resourceId)} 요청 취소` })
    recomputeClosurePending(d)
  })
}

export function returnResourceRequest(requestId: string) {
  commit((d) => {
    const req = d.resourceRequests.find((r) => r.id === requestId)
    if (!req || req.status !== "도착") return
    const simNow = currentSimTime()
    req.status = "복귀 완료"
    req.returnedAtSim = simNow
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: `${resourceLabel(req.resourceId)} 복귀 완료` })
    recomputeClosurePending(d)
  })
}

function resourceLabel(resourceId: string): string {
  return riverResources.find((r) => r.id === resourceId)?.label ?? resourceId
}

function recomputeClosurePending(d: RiverRunState) {
  const allSafe = Object.values(d.pointState).every((v) => !v || v.level === "safe")
  const noActiveResource = d.resourceRequests.every((r) => r.status === "복귀 완료" || r.status === "취소")
  d.closurePending = allSafe && noActiveResource && !d.endedAtSim
}

/** 정상 종료 — closurePending이 아니면 막는다(미완료 조치·미복귀 자원이 있으면 종료 불가) */
export function confirmClosure(): { ok: boolean; reason?: string } {
  let result = { ok: true as boolean, reason: undefined as string | undefined }
  commit((d) => {
    if (!d.closurePending) {
      result = { ok: false, reason: "유지시간·조치 완료·자원 복귀 조건을 아직 만족하지 않았습니다." }
      return
    }
    const simNow = currentSimTime()
    d.endedAtSim = simNow
    d.endReason = "정상 종료"
    d.flow.종료 = hhmm(simNow)
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: "정상 종료 확인" })
  })
  return result
}

/** 예외 강제 종료(§2-3-3) — 조건과 무관하게 언제든 가능하다. 이력을 정상 종료와 구분해서 남긴다 */
export function forceCloseRun() {
  commit((d) => {
    const simNow = currentSimTime()
    d.endedAtSim = simNow
    d.endReason = "예외 강제 종료"
    d.flow.종료 = `${hhmm(simNow)}(강제)`
    d.history.push({ id: uid("hist"), simTime: hhmm(simNow), label: "예외 강제 종료" })
  })
}

/** 시나리오 초기화 — 저장값을 지우고 열린 화면을 평시 데이터로 다시 로드한다. */
export function resetRun(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    return false
  }
  try {
    channel?.postMessage({ reset: true })
  } catch {
    /* BroadcastChannel 미지원 환경에서는 현재 창만 다시 로드 */
  }
  window.location.reload()
  return true
}

// ------------------------------------------------------------------ mock*.ts 화면 투영(projectToMock)
// 기존 화면(leaderBriefs·consistency·각 river 페이지)이 읽는 RV.* export에 실행 상태를 반영한다.
// 이 함수가 유일하게 RV.* 값을 바꾼다 — 화면 코드는 실행 상태를 몰라도 된다(scenarios.ts와 같은 설계 원칙).

function resetAndAssign<T extends object>(target: T, next: Partial<T>) {
  for (const k of Object.keys(target)) delete (target as Record<string, unknown>)[k]
  Object.assign(target, next)
}

const STAGE_LABEL: Record<string, string> = { safe: "정상", caution: "관심", warning: "주의", alert: "경계", danger: "심각" }

function projectToMock() {
  if (state.timeline.length === 0) return // 시나리오 미로딩 — 초기화된 평시 mock을 그대로 둔다

  for (const st of RV.riverStatuses) {
    const loc = st.name.includes("쇠소깍") ? "쇠소깍" : "돈내코"
    const p = state.pointState[loc]
    st.level = p?.level ?? "safe"
    st.stage = STAGE_LABEL[st.level]
    st.eta = p && p.level !== "safe" ? "관측 기반 추이 확인 중" : "해당 없음"
    st.updatedAt = state.timeline[state.playheadIndex]?.observedAt ?? st.updatedAt
  }

  // 서비스 카드 집계·지도 마커도 riverStatuses와 같은 등급을 쓴다(consistency.ts가 검사하는 그 규칙)
  const tiers = ["caution", "warning", "alert", "danger"] as const
  const card = DB.serviceStatusCards.find((c) => c.id === "river")
  if (card) {
    for (const t of tiers) card.counts[t] = RV.riverStatuses.filter((s) => s.level === t).length
  }
  for (const st of RV.riverStatuses) {
    const m = DB.riskMarkers.find((mk) => mk.id === st.id)
    if (m) m.level = st.level
  }

  const worst = worstLevel()
  const criteria = RV.riverStageCriteria.find((c) => c.level === worst)
  RV.riverSopStage.level = worst
  RV.riverSopStage.current = `${STAGE_LABEL[worst]} 단계`
  RV.riverSopStage.next = worst === "safe" ? "현재 조치 필요 없음 · 강우·수위 임계값 도달 시 관심 단계로 전환" : (criteria?.action ?? "-")

  resetAndAssign(RV.riverFlowProgress, state.flow)

  if (state.alertSnapshot) {
    const lv = state.alertSnapshot.level
    resetAndAssign(RV.riverAlertDispatch, {
      ...RV.riverAlertDispatch,
      stage: `${STAGE_LABEL[lv]} 단계 경보`,
      title: `${STAGE_LABEL[lv]} 단계 경보 발령`,
      level: lv,
      target: "효돈천 인근 주민·현장 인력",
      targetDetail: "시나리오 실행 중",
      sentAt: state.alertSnapshot.atSim,
      approver: "담당자 승인",
      message: `${STAGE_LABEL[lv]} 단계 경보가 승인·발령되었습니다.`,
    })
  } else {
    resetAndAssign(RV.riverAlertDispatch, emptyAlertDispatch)
  }

  if (state.dispatchSnapshot) {
    const lv = state.dispatchSnapshot.level
    resetAndAssign(RV.riverDispatchRequest, {
      ...RV.riverDispatchRequest,
      target: "효돈천(돈내코·쇠소깍)",
      stage: `${STAGE_LABEL[lv]} 단계 · 출동 승인됨`,
      level: lv,
      eta: "시나리오 실행 중",
      impact: "현장 통제·차단 필요",
      requestedAt: state.dispatchSnapshot.atSim,
      requester: "담당자 승인",
    })
  } else {
    resetAndAssign(RV.riverDispatchRequest, emptyDispatchRequest)
  }

  RV.riverControlRows.splice(
    0,
    RV.riverControlRows.length,
    ...state.resourceRequests
      .filter((r) => r.status !== "취소")
      .map((r) => {
        const item = riverResources.find((x) => x.id === r.resourceId)
        return {
          id: r.id,
          river: "효돈천",
          stage: RV.riverSopStage.current,
          location: item?.location ?? "-",
          gate: "정상 작동" as const,
          dispatch: r.status,
          ack: r.approvedAtSim ? "승인됨" : "승인 대기",
        }
      }),
  )

  RV.riverApprovalHistory.splice(
    0,
    RV.riverApprovalHistory.length,
    ...state.history.map((h) => ({ id: h.id, time: h.simTime, title: h.label })),
  )
  RV.riverControlTimeline.splice(0, RV.riverControlTimeline.length, ...RV.riverApprovalHistory)

  if (state.endedAtSim) {
    const allSafeAtEnd = Object.values(state.pointState).every((v) => !v || v.level === "safe")
    const noActiveResourceAtEnd = state.resourceRequests.every((r) => r.status === "복귀 완료" || r.status === "취소")
    const forced = state.endReason === "예외 강제 종료"
    resetAndAssign(RV.riverClosure, {
      ...RV.riverClosure,
      caseId: state.runId,
      title: `${state.endReason} — 효돈천 시나리오`,
      status: state.endReason ?? "-",
      confirmedBy: "담당자",
      type: "하천범람(시나리오)",
      location: "효돈천(돈내코·쇠소깍)",
      duration: `${state.createdAtSim} ~ ${state.endedAtSim}`,
      closureConditions: [
        `정상 등급 유지시간 충족(30분): ${allSafeAtEnd ? "충족" : forced ? "미충족(강제 종료로 생략됨)" : "충족"}`,
        `모든 조치 완료·자원 복귀 확인: ${noActiveResourceAtEnd ? "확인됨" : forced ? "미확인(강제 종료로 생략됨)" : "확인됨"}`,
        `담당자 종료 확인: ${forced ? "예외 강제 종료로 대체됨" : "확인됨"}`,
      ],
    })
  } else {
    resetAndAssign(RV.riverClosure, emptyClosure)
  }
}

// 로딩 시 저장된 상태가 있으면 화면에 즉시 반영
projectToMock()
