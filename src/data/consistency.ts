/**
 * 화면 간 상태·수치 일치 검사 — 같은 사실을 여러 화면(서비스 카드·지도 마커·대시보드 시계열·상세 화면·팀장 브리핑·통합 결재함)이
 * 각자 들고 있는 값이 서로 어긋나지 않는지 본다. 어긋남은 "표시 텍스트는 경계인데 배지는 심각" 같은 오류로 이어져
 * 과거에 여러 번 고쳤다(AGENTS.md §4). 시나리오를 새로 쓰거나 mock 값을 바꾼 뒤 개발 서버 콘솔(또는
 * `window.__jejuConsistency()`)에서 확인한다. 앱 동작에는 영향이 없고 개발 모드에서만 실행된다.
 */
import type { RiskLevel } from "../types/domain"
import { aquaBrief, coastBrief, heatBrief, heavyRainBrief, riverBrief, typhoonBrief } from "../pages/domain/leaderBriefs"
import { AQUA_NAV } from "../pages/aqua/aquaNav"
import { COAST_NAV } from "../pages/coast/coastNav"
import { HEAT_NAV } from "../pages/heat/heatNav"
import { HEAVY_RAIN_NAV } from "../pages/heavyrain/heavyRainNav"
import { RIVER_NAV } from "../pages/river/riverNav"
import { TYPHOON_NAV } from "../pages/typhoon/typhoonNav"
import * as AQ from "./mockAqua"
import * as CO from "./mockCoast"
import * as DB from "./mockDashboard"
import * as HR from "./mockHeavyRain"
import * as HT from "./mockHeat"
import * as RV from "./mockRiver"
import { riverResources } from "./mockRiverResources"
import { getRunState } from "./riverRunState"
import * as TY from "./mockTyphoon"
import { ACTIVE_SCENARIO_ID } from "./scenarios"

export interface ConsistencyIssue {
  area: string
  message: string
}

const RANK: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
const worst = (levels: RiskLevel[]): RiskLevel => levels.reduce<RiskLevel>((w, l) => (RANK.indexOf(l) > RANK.indexOf(w) ? l : w), "safe")
const count = (levels: RiskLevel[], l: RiskLevel) => levels.filter((x) => x === l).length
const num = (s: string) => parseFloat(s.replace(/[^\d.]/g, ""))

export function checkConsistency(): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  const eq = (area: string, what: string, a: unknown, b: unknown) => {
    if (a !== b) issues.push({ area, message: `${what}: ${String(a)} ≠ ${String(b)}` })
  }
  const card = (id: string) => DB.serviceStatusCards.find((c) => c.id === id)?.counts
  const marker = (id: string) => DB.riskMarkers.find((m) => m.id === id)
  const tiers = ["caution", "warning", "alert", "danger"] as const

  // 1. 서비스 카드 집계 ↔ 각 서비스 원본
  const cardVsLevels = (area: string, id: string, levels: RiskLevel[]) => {
    const c = card(id)
    if (!c) {
      issues.push({ area, message: "서비스 카드 없음" })
      return
    }
    for (const t of tiers) eq(area, `카드 ${t} 건수`, c[t] ?? 0, count(levels, t))
  }
  cardVsLevels("하천", "river", RV.riverStatuses.map((s) => s.level))
  cardVsLevels("연안", "coast", CO.coastEvents.map((e) => e.level))
  cardVsLevels("호우", "heavy-rain", HR.weatherStations.map((s) => s.status))
  cardVsLevels("저염분", "aqua", AQ.aquaFarms.map((f) => f.level))
  const ty0 = TY.typhoonReports[0]
  const tyLevel: RiskLevel = !ty0 ? "safe" : ty0.status === "태풍경보" ? "alert" : ty0.status === "태풍주의보" ? "warning" : "caution"
  cardVsLevels("태풍", "typhoon", [tyLevel])
  cardVsLevels("폭염", "heat", [HT.heatLevelInfo.level])

  // 2. 지도 마커 ↔ 원본 (확정 대상지 마커: 하천 2곳·연안 협재. 시나리오가 다른 마커를 추가하면 여기에 검사를 더한다)
  for (const s of RV.riverStatuses) eq("하천", `마커 ${s.id} 등급`, marker(s.id)?.level, s.level)
  eq("연안", "협재 마커 등급", marker("hyeopjae")?.level, worst(CO.coastEvents.map((e) => e.level)))
  const yongsu = AQ.aquaFarms.length > 0 ? worst(AQ.aquaFarms.map((f) => f.level)) : "safe"
  eq("저염분", "한경 용수 마커는 양식장 최고 등급을 넘지 않음", RANK.indexOf(marker("hangyeong-yongsu")?.level ?? "safe") <= RANK.indexOf(yongsu), true)

  // 3. 하천 수위 — 대시보드 시계열·센서·상세 근거·조위 차트가 같은 값 (시계열이 있을 때만)
  if (DB.timeSeries.length >= 2 && DB.sixHourSeries.length > 0) {
    const six = DB.sixHourSeries[DB.sixHourSeries.length - 1]
    const firstPredicted = RV.riverTideCorrelation.series.findIndex((p) => p.predicted)
    eq("하천", "돈내코 수위: 시계열 = 6시간 그래프", DB.timeSeries[0].value, six.돈내코수위)
    eq("하천", "돈내코 수위: 시계열 = 위험 판단 근거", DB.timeSeries[0].value, num(RV.riverRiskBasis.waterLevel.value))
    eq("하천", "돈내코 수위: 시계열 = 수위 조기경보", DB.timeSeries[0].value, RV.riverWaterLevelAiForecast.currentM)
    eq("하천", "돈내코 수위: 시계열 = 지도 센서 목록", DB.timeSeries[0].value, num(DB.dashboardSensors.find((s) => s.id === "sn1")?.value ?? ""))
    eq("하천", "돈내코 수위: 시계열 = 센서 교차검증", DB.timeSeries[0].value, num(RV.riverSensorCheck[0].value))
    eq("하천", "쇠소깍 수위: 시계열 = 6시간 그래프", DB.timeSeries[1].value, six.쇠소깍수위)
    eq("하천", "쇠소깍 수위: 시계열 = 센서 교차검증", DB.timeSeries[1].value, num(RV.riverSensorCheck[1].value))
    eq("하천", "쇠소깍 수위: 시계열 = 지도 센서 목록", DB.timeSeries[1].value, num(DB.dashboardSensors.find((s) => s.id === "sn2")?.value ?? ""))
    // 조위 차트는 관측(마지막 predicted=false) 값이 현재 수위여야 한다
    eq("하천", "쇠소깍 수위: 시계열 = 조위 차트의 마지막 관측값", DB.timeSeries[1].value, RV.riverTideCorrelation.series[firstPredicted - 1]?.waterLevelM)
  }
  eq("하천", "단계 문구 ↔ 등급", RV.riverStatuses.every((s) => (s.level === "safe") === s.stage.includes("정상")), true)
  eq("하천", "경보 발령 여부 ↔ 발송 시각", RV.riverAlertDispatch.level !== "safe", RV.riverAlertDispatch.sentAt !== "-")

  // 3-1. 하천 시나리오 실행 중(riverRunState)에는 "정상 복귀 후 종료 대기"처럼 등급은 safe인데 흐름 이력은
  // 남아있는 상태가 정상이라 아래의 단순 등가 검사를 적용하지 않는다(2026-09-30, Codex 재검토 근거).
  const riverRun = getRunState()
  if (riverRun.timeline.length === 0) {
    eq("하천", "흐름 진행 ↔ 상태(평시면 비어 있어야)", Object.keys(RV.riverFlowProgress).length > 0, RV.riverStatuses.some((s) => s.level !== "safe"))
  } else {
    eq("하천 시나리오", "종료 기록 ↔ 흐름 종료 단계", !!riverRun.endedAtSim, !!RV.riverFlowProgress.종료)
    const overCapacity = riverResources.some((r) => {
      const active = riverRun.resourceRequests
        .filter((req) => req.resourceId === r.id && (req.status === "요청" || req.status === "출동 중" || req.status === "도착" || req.status === "철수 중"))
        .reduce((sum, req) => sum + req.qty, 0)
      return active > r.capacity
    })
    eq("하천 시나리오", "가상 자원 배치가 가용 수량을 넘지 않음", overCapacity, false)
  }

  // 4. 연안
  eq("연안", "진행 중 이벤트 건수", CO.coastSummary.activeEvents.count, CO.coastEvents.length)
  eq("연안", "미확인 건수", CO.coastSummary.unconfirmedEvents.count, CO.coastEvents.filter((e) => e.status === "미확인").length)
  eq("연안", "장비 정상 기수", CO.coastSummary.equipment.normal, CO.coastSafetyAssets.filter((a) => a.status === "정상").length)
  eq("연안", "이벤트 상세 등급 ↔ 최고 이벤트 등급", CO.coastEventDetail.level, worst(CO.coastEvents.map((e) => e.level)))
  eq("연안", "흐름 진행 ↔ 이벤트(없으면 비어 있어야)", Object.keys(CO.coastFlowProgress).length > 0, CO.coastEvents.length > 0)

  // 5. 저염분
  eq("저염분", "영향 양식장: 요약 = 집계", AQ.aquaSummary.affectedFarms.count, AQ.aquaFarmTotals.total)
  eq("저염분", "영향 양식장: 집계 = 목록", AQ.aquaFarmTotals.total, AQ.aquaFarms.length)
  eq("저염분", "영향 양식장: 예측 화면 = 집계", AQ.aquaRiskState.affectedFarmCount, AQ.aquaFarmTotals.total)

  // 6. 팀장 브리핑 ↔ 통합 결재함 — 링크가 실제 화면 경로인지, 결재 항목이 원본과 맞는지
  const known = new Set<string>()
  for (const nav of [AQUA_NAV, COAST_NAV, HEAT_NAV, HEAVY_RAIN_NAV, RIVER_NAV, TYPHOON_NAV] as { to: string; also?: string[] }[][]) {
    for (const item of nav) {
      known.add(item.to)
      for (const a of item.also ?? []) known.add(a)
    }
  }
  const briefs = { 호우: heavyRainBrief(), 태풍: typhoonBrief(), 폭염: heatBrief(), 하천: riverBrief(), 저염분: aquaBrief(), 연안: coastBrief() }
  for (const [name, b] of Object.entries(briefs)) {
    for (const t of b.tasks) if (!known.has(t.to)) issues.push({ area: `브리핑·${name}`, message: `링크가 메뉴에 없음: ${t.to}` })
    if (b.tasks.length === 0 && !b.idle) issues.push({ area: `브리핑·${name}`, message: "대기 항목이 없는데 안내 문구도 없음" })
  }
  eq("브리핑", "하천 브리핑 등급 = 최고 하천 등급", briefs.하천.level, worst(RV.riverStatuses.map((s) => s.level)))
  // 연안 승인 항목 = 미확인 이벤트(대외 경보) + 팀장 승인을 기다리는 출동 요청
  eq(
    "브리핑",
    "연안 브리핑 승인 항목 = 미확인 이벤트 + 승인 대기 출동 요청",
    briefs.연안.tasks.filter((t) => t.role === "승인").length,
    CO.coastEvents.filter((e) => e.status === "미확인").length + (CO.coastDispatch.request.status.includes("승인 대기") ? 1 : 0),
  )
  eq("브리핑", "저염분 브리핑 등급 = 예측 화면 등급", briefs.저염분.level, AQ.aquaRiskState.riskLevel)

  return issues
}

/** 개발 서버에서만 — 콘솔에 결과를 남기고 window.__jejuConsistency()로 다시 실행할 수 있게 한다 */
export function reportConsistency() {
  const run = () => {
    const issues = checkConsistency()
    const tag = `[일치 검사 · 시나리오 ${ACTIVE_SCENARIO_ID}]`
    if (issues.length === 0) console.info(`${tag} 어긋남 없음`)
    else console.warn(`${tag} 어긋남 ${issues.length}건`, issues)
    return issues
  }
  ;(window as unknown as { __jejuConsistency: () => ConsistencyIssue[] }).__jejuConsistency = run
  run()
}
