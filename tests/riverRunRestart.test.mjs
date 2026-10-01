import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"

const src = new URL("../src/", import.meta.url).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith(src) && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of [".ts", ".tsx"]) {
        try { return next(specifier + extension, context) } catch (error) {
          if (error.code !== "ERR_MODULE_NOT_FOUND") throw error
        }
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith(src) && /\.tsx?$/.test(url)) {
      const source = readFileSync(fileURLToPath(url), "utf8")
      return {
        format: "module", shortCircuit: true,
        source: ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
      }
    }
    return next(url, context)
  },
})

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
}

const { advance, advanceTick, approveAlert, approveDispatch, forceCloseRun, getRunState, loadTimeline, resetRun, togglePlaying } = await import(
  "../src/data/riverRunState.ts"
)
const { riverFlowRatioAnalysis } = await import("../src/data/riverFlowRatioAnalysis.ts")
const { deriveRiverScenarioObservation, deriveRiverScenarioWeather } = await import("../src/data/riverScenarioObservations.ts")
const { riverAlertDispatch, riverClosure, riverDispatchRequest, riverStatuses } = await import("../src/data/mockRiver.ts")
const points = [
  { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 70 },
  { location: "돈내코", observedAt: "2026-09-30 09:30", flowRatioPercent: 80 },
]

test("강제 종료 뒤 같은 시계열을 다시 업로드하면 새 실행으로 진행된다", () => {
  loadTimeline(points)
  advance()
  approveAlert()
  approveDispatch()
  const oldRunId = getRunState().runId
  forceCloseRun()
  assert.equal(getRunState().endReason, "예외 강제 종료")
  assert.equal(riverClosure.caseId, oldRunId)

  loadTimeline(points)
  const restarted = getRunState()
  assert.notEqual(restarted.runId, oldRunId)
  assert.equal(restarted.endedAtSim, undefined)
  assert.equal(restarted.endReason, undefined)
  assert.equal(restarted.alertSnapshot, undefined)
  assert.equal(restarted.dispatchSnapshot, undefined)
  assert.equal(restarted.playheadIndex, -1)
  assert.deepEqual(restarted.history, [])
  assert.equal(riverAlertDispatch.sentAt, "-")
  assert.equal(riverDispatchRequest.requestedAt, "-")
  assert.equal(riverClosure.caseId, "-")

  advance()
  assert.equal(getRunState().playheadIndex, 0)
  assert.equal(getRunState().pointState.돈내코.flowRatioPercent, 70)
  assert.equal(getRunState().endedAtSim, undefined)

  let reloadCount = 0
  globalThis.window = { location: { reload: () => { reloadCount += 1 } } }
  assert.equal(resetRun(), true)
  assert.equal(stored.has("jeju-ax-river-run"), false)
  assert.equal(reloadCount, 1)
})

test("상황 분석 Q% 추이는 현재 시점까지만 표시하고 지점별 직전 관측을 유지한다", () => {
  const timeline = [
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 20 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 30 },
    { location: "돈내코", observedAt: "2026-09-30 09:30", flowRatioPercent: 80 },
    { location: "쇠소깍", observedAt: "2026-09-30 10:00", flowRatioPercent: 90 },
  ]
  const { series, latest } = riverFlowRatioAnalysis({ timeline, playheadIndex: 2 })
  assert.deepEqual(series.map(({ donnaeko, soesokkak }) => [donnaeko, soesokkak]), [[20, 30], [80, 30]])
  assert.equal(latest.돈내코.observedAt, "2026-09-30 09:30")
  assert.equal(latest.쇠소깍.observedAt, "2026-09-30 09:00")
  assert.equal(series.some((row) => row.observedAt === "2026-09-30 10:00"), false)
})

test("같은 관측시각의 돈내코·쇠소깍 행은 다음 시점 1회로 함께 반영된다", () => {
  loadTimeline([
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 12 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 15 },
    { location: "돈내코", observedAt: "2026-09-30 09:10", flowRatioPercent: 28 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:10", flowRatioPercent: 35 },
  ])
  advance()
  assert.equal(getRunState().playheadIndex, 1) // 두 행을 한 묶음으로 처리 → 묶음의 마지막 행까지 이동
  assert.equal(getRunState().pointState.돈내코.flowRatioPercent, 12)
  assert.equal(getRunState().pointState.쇠소깍.flowRatioPercent, 15)

  advance()
  assert.equal(getRunState().playheadIndex, 3)
  assert.equal(getRunState().pointState.돈내코.flowRatioPercent, 28)
  assert.equal(getRunState().pointState.쇠소깍.flowRatioPercent, 35)
  assert.equal(getRunState().pointState.돈내코.level, "caution")
  assert.equal(getRunState().pointState.쇠소깍.level, "caution")
})

test("advance()는 관측 묶음과 등급 전환을 우측 타임라인 이력으로 남기고, 마지막 시점에서 자동 재생을 정지한다", () => {
  loadTimeline([
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 12 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 15 },
    { location: "돈내코", observedAt: "2026-09-30 09:10", flowRatioPercent: 78 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:10", flowRatioPercent: 85 },
  ])
  advance()
  assert.equal(getRunState().history.at(-1).label, "관측 돈내코 12%(정상) · 쇠소깍 15%(정상)")

  advance()
  assert.equal(getRunState().history.at(-1).label, "관측 돈내코 78%(정상→경계) · 쇠소깍 85%(정상→경계)")
  assert.equal(getRunState().playheadIndex, 3)
  assert.equal(getRunState().playing, false) // 마지막 시점 도달 — 자동 재생 상태였다면 정리되어야 한다(§7-2)
})

test("advanceTick()은 경계·심각에 처음 도달했는데 경보 승인 전이면 자동 재생을 일시정지한다", () => {
  loadTimeline([
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 12 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 15 },
    { location: "돈내코", observedAt: "2026-09-30 09:10", flowRatioPercent: 78 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:10", flowRatioPercent: 85 },
    { location: "돈내코", observedAt: "2026-09-30 09:20", flowRatioPercent: 80 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:20", flowRatioPercent: 88 },
    { location: "돈내코", observedAt: "2026-09-30 09:30", flowRatioPercent: 82 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:30", flowRatioPercent: 90 },
  ])
  togglePlaying() // playing: false -> true, 자동 재생 시작
  advanceTick() // 09:00 정상 — 정지 사유 없음
  assert.equal(getRunState().playing, true)

  advanceTick() // 09:10 경계 진입, 경보 미승인 — 자동 정지되어야 한다
  assert.equal(getRunState().playheadIndex, 3)
  assert.equal(getRunState().playing, false)

  togglePlaying() // 사용자가 확인 후 다시 재생
  approveAlert()
  advanceTick() // 09:20 경계 유지, 이미 경보 승인됨 — 더 이상 자동 정지하지 않는다(마지막 시점도 아님)
  assert.equal(getRunState().playheadIndex, 5)
  assert.equal(getRunState().playing, true)

  advanceTick() // 09:30이 마지막 시점 — advance() 자체가 정지시킨다
  assert.equal(getRunState().playheadIndex, 7)
  assert.equal(getRunState().playing, false)
})

test("Q% 시나리오의 모의 강우·레이더·포화도는 결정적으로 함께 변하고 실제 수위(m)를 만들지 않는다", () => {
  const run = {
    runId: "derived-test",
    createdAtSim: "2026-09-30 09:00",
    timeline: [
      { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 10 },
      { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 12 },
      { location: "돈내코", observedAt: "2026-09-30 09:15", flowRatioPercent: 75 },
      { location: "쇠소깍", observedAt: "2026-09-30 09:15", flowRatioPercent: 40 },
    ],
    playheadIndex: 3,
    playing: false,
    pointState: { 돈내코: undefined, 쇠소깍: undefined },
    pendingDown: { 돈내코: undefined, 쇠소깍: undefined },
    flow: {},
    resourceRequests: [],
    history: [],
    closurePending: false,
    version: 0,
  }

  const observation = deriveRiverScenarioObservation(run)
  assert.equal(observation.currentLevel, "alert")
  assert.equal(observation.leadLocation, "돈내코")
  assert.equal(observation.flowRatioPercent, 75)
  assert.equal(observation.rainfallHourlyMm, 15)
  assert.equal(observation.rainfallDayMm, 3.8)
  assert.equal(observation.radarLabel, "강한 강우대")
  assert.equal(observation.saturationPercent, 76)

  const weather = deriveRiverScenarioWeather(run)
  assert.equal(weather.tm, "202609300915")
  assert.equal(weather.rain60mMm, observation.rainfallHourlyMm)
  assert.equal(weather.rainDayMm, observation.rainfallDayMm)

  const repeated = deriveRiverScenarioObservation(run)
  assert.deepEqual(repeated, observation)
})

test("riverStatuses의 eta·updatedAt은 지점별 관측 유무·하향 대기를 정확히 구분한다(staging-river-dashboard-review-2026-10-01 §3)", () => {
  // 돈내코만 입력된 시계열 — 쇠소깍은 이 실행 내내 관측이 없다("정상"과 구분돼야 함)
  loadTimeline([{ location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 10 }])
  advance()
  const soesokkakNoInput = riverStatuses.find((s) => s.id === "soesokkak")
  assert.equal(soesokkakNoInput.eta, "시나리오 미입력")

  // 돈내코=정상 관측, 쇠소깍=경계 관측 — 둘 다 관측은 있지만 등급이 달라 문구도 달라야 한다
  loadTimeline([
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 10 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 70 },
  ])
  advance()
  const donnaeko = riverStatuses.find((s) => s.id === "donnaeko")
  const soesokkak = riverStatuses.find((s) => s.id === "soesokkak")
  assert.equal(donnaeko.eta, "해당 없음")
  assert.equal(donnaeko.updatedAt, "2026-09-30 09:00")
  assert.equal(soesokkak.eta, "관측 기반 추이 확인 중")
  assert.equal(soesokkak.updatedAt, "2026-09-30 09:00")

  // 쇠소깍이 경계 -> 관심으로 급락 — 한 단계씩만 하향하므로 "주의" 하향 대기 문구가 떠야 한다
  loadTimeline([
    { location: "돈내코", observedAt: "2026-09-30 09:00", flowRatioPercent: 10 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:00", flowRatioPercent: 70 },
    { location: "돈내코", observedAt: "2026-09-30 09:10", flowRatioPercent: 10 },
    { location: "쇠소깍", observedAt: "2026-09-30 09:10", flowRatioPercent: 40 },
  ])
  advance()
  advance()
  const soesokkakPending = riverStatuses.find((s) => s.id === "soesokkak")
  assert.match(soesokkakPending.eta, /주의 하향 대기 중/)
  assert.equal(soesokkakPending.updatedAt, "2026-09-30 09:10") // 공통 배치 시각이 아니라 그 지점의 마지막 관측시각
})
