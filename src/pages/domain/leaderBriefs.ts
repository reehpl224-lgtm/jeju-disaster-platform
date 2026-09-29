import type { RiskLevel } from "../../types/domain"
import { riskStyles } from "../../components/ui/riskStyles"
import { dutyContacts } from "../../data/mockContacts"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import * as HR from "../../data/mockHeavyRain"
import * as TY from "../../data/mockTyphoon"
import * as HT from "../../data/mockHeat"
import * as RV from "../../data/mockRiver"
import * as AQ from "../../data/mockAqua"
import * as CO from "../../data/mockCoast"

/**
 * 서비스별 "팀장 브리핑" — 제주 재난안전과 팀장(확인→승인→지시→결재를 하는 사람) 관점의 대시보드 요약.
 * 근거: 「제주 재난안전과 팀장 사용자 시나리오」(2026-09-23). 6개 서비스가 같은 순서로 답한다:
 *   ① 지금 어떤 상황인가  ② 내가 결재·지시할 것이 있는가  ③ 왜 그렇게 판단했나  ④ 앞으로 어떻게 되나  ⑤ 누가 무엇을 하고 있나
 * 값은 전부 각 서비스 mock 데이터에서 계산한다 — 서비스 상황을 사용자 시나리오로 바꾸면 이 요약도 같이 바뀐다
 * (예: 결재 항목은 "발령된 경보가 있을 때만" 생긴다). 여기에 수치·문구를 새로 만들어 넣지 말 것.
 * 보드 패널(LeaderBoardBrief)과 상세 대시보드(LeaderDetailBrief)가 이 한 곳을 같이 쓴다.
 *
 * isEmpty(DataModeContext) — "데이터 있음/없음" 표시 모드 전환(2026-09-29). 서비스 차례대로 연동 중:
 * 하천범람(riverBrief)부터 시나리오 진행중 데이터(*Incident)와 평시 데이터를 오가도록 연동했다.
 * 나머지 5개는 아직 미연동 — 인자는 받되 무시한다(호출부 시그니처 통일용, `_isEmpty`).
 */

export type BriefRole = "승인" | "지시" | "확인" | "결재"

export interface BriefTask {
  role: BriefRole
  title: string
  detail?: string
  status: string
  level: RiskLevel
  /** 동작(승인·발송 등)을 하는 상세 화면 */
  to: string
}

export interface LeaderBrief {
  title: string
  lines: string[]
  level: RiskLevel
  badge: string
  kpis: { k: string; v: string | number; d?: string; over?: boolean }[]
  tasks: BriefTask[]
  /** tasks가 비었을 때 보여줄 문구 */
  idle: string
  evidence: { k: string; v: string }[]
  outlook: string[]
  response: { k: string; v: string }[]
}

const RANK: RiskLevel[] = ["safe", "caution", "warning", "alert", "danger"]
const worstOf = (levels: RiskLevel[]): RiskLevel =>
  levels.reduce<RiskLevel>((w, l) => (RANK.indexOf(l) > RANK.indexOf(w) ? l : w), "safe")
const levelLabel = (l: RiskLevel) => riskStyles[l].label

const contactOf = (domain: "aqua" | "coast" | "river" | "general") =>
  dutyContacts.find((c) => c.domain === domain) ?? dutyContacts.find((c) => c.domain === "general")
const contactRow = (domain: "aqua" | "coast" | "river" | "general") => {
  const c = contactOf(domain)
  return { k: "담당 주무관", v: c ? `${c.name} · ${c.phone}` : "담당자 미지정" }
}

/** 채널별 발송 결과를 한 줄로 */
const channelLine = (d: { channels: { name: string; rate: string }[] }) => d.channels.map((c) => `${c.name} ${c.rate}`).join(" · ")

/** 발송 결과 → 팀장 결재 항목(발령이 실제로 있었을 때만) */
function dispatchTask(
  d: { stage: string; title: string; target: string; sentAt: string; approver: string; channels: unknown[]; totalFail: number },
  to: string,
): BriefTask[] {
  if (!d.sentAt || d.sentAt === "-") return []
  return [
    {
      role: "승인",
      title: d.title,
      detail: `${d.stage} · ${d.target} · ${d.channels.length}개 채널 · 승인 ${d.approver}`,
      status: d.totalFail > 0 ? `재발송 검토 ${d.totalFail.toLocaleString()}건` : "발송 완료",
      level: d.totalFail > 0 ? "warning" : "safe",
      to,
    },
  ]
}

// ------------------------------------------------------------------ 호우
export function heavyRainBrief(_isEmpty?: boolean): LeaderBrief {
  const f = HR.heavyRainAiForecast
  const ad = HR.heavyRainAlertDispatch
  const stations = HR.weatherStations
  const maxObs = Math.max(...f.stations.map((s) => s.observedMm))
  const over = maxObs > f.forecastMm
  const hot = stations.filter((s) => RANK.indexOf(s.status) >= RANK.indexOf("warning"))
  const top = HR.heavyRainTopStations[0]
  const latestBroadcast = HR.broadcastLog[0]
  const linked = HR.legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
  return {
    title: over ? `예보 ${f.forecastMm}mm/h 대비 실측 초과` : `실측 강우가 예보(${f.forecastMm}mm/h) 범위 내`,
    lines: [`감지 ${f.detectedAt} · 경보·주의 관측소 ${hot.length}/${stations.length}`, ...(ad.sentAt !== "-" ? [`${ad.title} ${ad.sentAt} 발령`] : [])],
    level: worstOf(stations.map((s) => s.status)),
    badge: over ? "AI 조기경고" : "예보 범위 내",
    kpis: [
      { k: "최대 실측 강우", v: `${maxObs}mm/h`, d: `예보 ${f.forecastMm}mm/h`, over },
      { k: "경보·주의 관측소", v: `${hot.length}/${stations.length}`, over: hot.length > 0 },
      { k: "누적 강우 1위", v: `${top.cumulativeMm}mm`, d: top.stationName },
      { k: "자동통보", v: `${HR.broadcastLog.length}건`, d: latestBroadcast ? `최근 ${latestBroadcast.time}` : undefined },
    ],
    tasks: [
      ...(over
        ? [{ role: "확인" as const, title: "자동침수경보 발령 여부 판단", detail: f.confirmNote, status: "확인 필요", level: "warning" as RiskLevel, to: "/heavy-rain/analysis" }]
        : []),
      ...dispatchTask(ad, "/heavy-rain/alert"),
      ...(hot.length > 0
        ? [
            {
              role: "지시" as const,
              title: "취약지점 현장 예찰",
              detail: `누적 강우 1위 ${top.stationName} ${top.cumulativeMm}mm · 담당 ${contactOf("general")?.name ?? "-"}`,
              status: "지시 권고",
              level: "caution" as RiskLevel,
              to: "/heavy-rain/analysis",
            },
          ]
        : []),
      ...(latestBroadcast
        ? [{ role: "확인" as const, title: "재해문자전광판·자동음성 송출 확인", detail: `${latestBroadcast.channel} — ${latestBroadcast.message}`, status: `최근 ${latestBroadcast.time}`, level: "info" as RiskLevel, to: "/heavy-rain/alert" }]
        : []),
    ],
    idle: "결재·지시 대기 없음 — 평시 감시 중",
    evidence: [
      { k: "우량계 실측", v: f.stations.map((s) => `${s.name} ${s.observedMm}mm/h`).join(" · ") },
      { k: "예보 대비", v: `+${maxObs - f.forecastMm}mm/h (${Math.round(((maxObs - f.forecastMm) / f.forecastMm) * 100)}% 초과)` },
      { k: "침수센서", v: stations.filter((s) => s.type === "침수센서").map((s) => `${s.name.replace(/ 침수센서/, "")} ${s.value}`).join(" · ") },
    ],
    outlook: [f.aiNote],
    response: [
      contactRow("general"),
      { k: "경보 발송 결과", v: channelLine(ad) },
      { k: "레거시 연계", v: `연계 진행중 ${linked}/${HR.legacySystems.length}개 시스템` },
    ],
  }
}

// ------------------------------------------------------------------ 태풍
export function typhoonBrief(_isEmpty?: boolean): LeaderBrief {
  const cur = TY.typhoonReports[0]
  const trk = TY.typhoonForecastTrack
  const d = TY.typhoonAlertDispatch
  const nearest = trk.reduce((a, b) => (b.distanceFromJejuKm < a.distanceFromJejuKm ? b : a))
  const level: RiskLevel = cur.status === "태풍경보" ? "alert" : cur.status === "태풍주의보" ? "warning" : "caution"
  const buoy = khoaBuoyMarineConditions[0]
  return {
    title: `${cur.name} · ${cur.status}`,
    lines: [cur.location, `기상청 발표 ${cur.issuedAt}`],
    level,
    badge: cur.status,
    kpis: [
      { k: "제주까지", v: `${trk[0].distanceFromJejuKm}km`, d: `이동 ${cur.speedKmh}km/h` },
      { k: "최근접 예상", v: `${nearest.distanceFromJejuKm}km`, d: nearest.time.slice(5), over: true },
      { k: "최대 풍속", v: `${cur.maxWindMs}m/s` },
      { k: "중심 기압", v: `${cur.pressureHpa}hPa` },
    ],
    tasks: [
      ...dispatchTask(d, "/typhoon/alert"),
      {
        role: "지시",
        title: "대응반 소집·시설물 고정 등 대비태세 점검",
        detail: `최근접 ${nearest.distanceFromJejuKm}km (${nearest.time.slice(5)}) · 담당 ${contactOf("general")?.name ?? "-"}`,
        status: "지시 권고",
        level: "caution",
        to: "/typhoon/analysis",
      },
      { role: "확인", title: "민방위경보시스템 연계 확인", detail: TY.typhoonSource.relatedLegacySystem, status: "병행 조치 확인", level: "info", to: "/typhoon/alert" },
      { role: "확인", title: "기상청 자료 수신 상태", detail: TY.typhoonClosure.report.lesson, status: "수신 점검", level: "caution", to: "/typhoon/closure" },
    ],
    idle: "결재·지시 대기 없음",
    evidence: [
      { k: "기상청 발표", v: `${TY.typhoonReports.length}회 · 최근 ${cur.status}` },
      { k: "이동·세력", v: `${cur.speedKmh}km/h · ${cur.pressureHpa}hPa · ${cur.maxWindMs}m/s` },
      { k: "관측 체계", v: TY.typhoonSource.note },
    ],
    outlook: trk.map((p) => `${p.time.slice(5)} · 제주까지 ${p.distanceFromJejuKm}km · ${p.maxWindMs}m/s — ${p.note}`),
    response: [
      contactRow("general"),
      { k: "대비 안내 발송", v: channelLine(d) },
      ...(buoy ? [{ k: `해양관측 ${buoy.stationName}`, v: `파고 ${buoy.waveHeightM}m · 풍속 ${buoy.windSpeedMs}m/s` }] : []),
    ],
  }
}

// ------------------------------------------------------------------ 폭염
// 기상청 폭염특보 기준(HT.heatLevelInfo.criteria): 체감 33℃ 이상 2일 이상 = 주의보, 35℃ 이상 = 경보
const HEAT_WATCH_C = 33
const HEAT_WARNING_C = 35
export function heatBrief(_isEmpty?: boolean): LeaderBrief {
  const li = HT.heatLevelInfo
  const d = HT.heatAlertDispatch
  const shelters = HT.heatShelters
  const capacity = shelters.reduce((sum, s) => sum + s.capacity, 0)
  let days = 0
  for (let i = HT.heatTrend.length - 1; i >= 0 && HT.heatTrend[i].feelsLikeC >= HEAT_WATCH_C; i--) days++
  const gap = +(HEAT_WARNING_C - li.feelsLikeC).toFixed(1)
  const first = HT.heatTrend[0]
  const last = HT.heatTrend[HT.heatTrend.length - 1]
  return {
    title: li.label,
    lines: [`체감온도 ${li.feelsLikeC}℃ · ${li.updatedAt} 기준`, li.criteria],
    level: li.level,
    badge: li.label,
    kpis: [
      { k: "체감온도", v: `${li.feelsLikeC}℃`, over: li.feelsLikeC >= HEAT_WATCH_C },
      { k: "주의보 기준 지속", v: `${days}일`, d: `체감 ${HEAT_WATCH_C}℃ 이상 연속` },
      { k: "경보(35℃)까지", v: gap > 0 ? `${gap}℃` : "도달", d: gap > 0 ? "남은 격차" : undefined, over: gap <= 0 },
      { k: "무더위쉼터", v: `${shelters.length}개소`, d: `수용 ${capacity}명` },
    ],
    tasks: [
      ...dispatchTask(d, "/heat/alert"),
      {
        role: "확인",
        title: `폭염경보(${HEAT_WARNING_C}℃) 격상 판단`,
        detail: `체감 ${li.feelsLikeC}℃ · ${days}일 지속 — ${gap > 0 ? `경보 기준까지 ${gap}℃` : "경보 기준 도달"}`,
        status: gap > 0 ? "추이 관찰" : "격상 검토 필요",
        level: gap > 0 ? "caution" : "alert",
        to: "/heat/analysis",
      },
      {
        role: "지시",
        title: "무더위쉼터 운영·그늘길 안내 점검",
        detail: `쉼터 ${shelters.length}개소 · 그늘길 ${HT.heatRouteTips.filter((r) => r.kind === "cool").length}곳 · 담당 ${contactOf("general")?.name ?? "-"}`,
        status: "지시 권고",
        level: "caution",
        to: "/heat/alert",
      },
      { role: "결재", title: "해제 조건 확인", detail: HT.heatClosure.closureConditions[0], status: "해제 전 확인", level: "info", to: "/heat/closure" },
    ],
    idle: "결재·지시 대기 없음",
    evidence: [
      { k: "체감온도 추이", v: `${first.date} ${first.feelsLikeC}℃ → ${last.date} ${last.feelsLikeC}℃` },
      { k: "최근 최고기온", v: `${last.date} ${last.maxTempC}℃` },
      { k: "판단 기준", v: li.criteria },
    ],
    outlook: [`체감 ${HEAT_WARNING_C}℃ 이상 지속 시 폭염경보로 격상 — 현재 ${gap > 0 ? `${gap}℃ 부족` : "기준 도달"}`],
    response: [contactRow("general"), { k: "안내 발송 결과", v: channelLine(d) }, { k: "쉼터 운영", v: `${shelters.length}개소 · 수용 ${capacity}명` }],
  }
}

// ------------------------------------------------------------------ 하천범람
export function riverBrief(isEmpty = false): LeaderBrief {
  const st = isEmpty ? RV.riverStatuses : RV.riverStatusesIncident
  const worst = [...st].sort((a, b) => RANK.indexOf(b.level) - RANK.indexOf(a.level))[0]
  const rb = isEmpty ? RV.riverRiskBasis : RV.riverRiskBasisIncident
  const sr = isEmpty ? RV.riverSuddenRainAlert : RV.riverSuddenRainAlertIncident
  const wl = isEmpty ? RV.riverWaterLevelAiForecast : RV.riverWaterLevelAiForecastIncident
  const dr = RV.riverDispatchRequest // 출동요청은 이 시나리오 시점(19:26)엔 아직 발생 전 — 두 모드 동일
  const d = RV.riverAlertDispatch // 경보발송도 경계 승인(20:10) 전이라 두 모드 동일
  const tc = RV.riverTideCorrelation // 실측 조위 참고 데이터 — 시나리오와 무관하게 유지
  const sopStage = isEmpty ? RV.riverSopStage : RV.riverSopStageIncident
  const controlRows = isEmpty ? RV.riverControlRows : RV.riverControlRowsIncident
  const jointAgencies = isEmpty ? RV.riverJointAgencies : RV.riverJointAgenciesIncident
  const propagation = isEmpty ? RV.riverPropagation : RV.riverPropagationIncident
  const approvalHistory = isEmpty ? RV.riverApprovalHistory : RV.riverApprovalHistoryIncident
  const calm = worst.level === "safe"
  const gateBad = controlRows.some((r) => r.gate !== "정상 작동")
  return {
    title: `${worst.name} ${worst.stage}`,
    lines: [...st.map((s) => `${s.name} — 범람 도달 ${s.eta} · 갱신 ${s.updatedAt}`), `${sopStage.current} — ${sopStage.next}`],
    level: worst.level,
    badge: worst.stage,
    kpis: [
      { k: "수위", v: rb.waterLevel.value, d: rb.waterLevel.detail, over: !calm },
      { k: "강우량", v: rb.rainfall.value, d: rb.rainfall.detail, over: !calm },
      { k: "레이더", v: rb.radar.value, d: rb.radar.detail },
      { k: "토양 포화도", v: rb.saturation.value, d: rb.saturation.detail },
    ],
    tasks: [
      ...(calm
        ? []
        : [{ role: "승인" as const, title: `${worst.name} 단계 상향·경보 발령`, detail: sopStage.next, status: worst.stage, level: worst.level, to: "/river/alert" }]),
      ...(sr.level !== "safe"
        ? [{ role: "확인" as const, title: "돌발 강우 감지 — 단계 상향 판단", detail: sr.confirmNote, status: sr.label, level: sr.level, to: "/river/analysis" }]
        : []),
      ...dispatchTask(d, "/river/alert"),
      ...(RV.riverControlFailures.length > 0 || gateBad
        ? [{ role: "지시" as const, title: "현장 통제·차단기 조치", detail: RV.riverControlFailures[0]?.title ?? "차단기 이상", status: `조치 실패 ${RV.riverControlFailures.length}건`, level: "danger" as RiskLevel, to: "/river/control" }]
        : []),
      ...(dr.level !== "safe"
        ? [{ role: "승인" as const, title: `출동 요청 — ${dr.target}`, detail: `도달 예상 ${dr.eta} · ${dr.impact}`, status: dr.stage.replace("⚠ ", ""), level: dr.level, to: "/river/dispatch" }]
        : []),
    ],
    idle: `결재·지시 대기 없음 — ${sopStage.next}`,
    evidence: [
      { k: "수위", v: `6시간 전 ${wl.sixHourAgoM}m → 현재 ${wl.currentM}m · ${wl.status}` },
      { k: "돌발 강우", v: `예보 ${sr.forecastMm}mm → 실측 ${sr.observedMm}mm · ${sr.label}` },
      { k: "토양 포화도", v: `${rb.saturation.value} (${rb.saturation.grade})` },
      { k: "데이터 신뢰도", v: RV.riverDataConfidence.overall },
    ],
    outlook: [wl.trendNote, `조위 참고 — 다음 만조 ${tc.nextHighTide} (${tc.location})`, sr.trendNote],
    response: [
      contactRow("river"),
      { k: "공동 대응 기관", v: jointAgencies.map((j) => `${j.agency.replace(/ \(.*\)/, "")} ${j.status}`).join(" · ") },
      { k: "전파 현황", v: propagation.map((p) => `${p.channel} ${p.status}`).join(" · ") },
      { k: "최근 승인 이력", v: approvalHistory[approvalHistory.length - 1]?.title ?? "-" },
    ],
  }
}

// ------------------------------------------------------------------ 저염분 고수온
export function aquaBrief(_isEmpty?: boolean): LeaderBrief {
  const s = AQ.aquaSummary
  const rs = AQ.aquaRiskState
  const rsp = AQ.aquaResponseState
  const ad = AQ.aquaAlertDraft
  const steps = ad.approvalSteps
  const stepsDone = steps.filter((x) => x.owner !== "-").length
  const undone = AQ.aquaChecklist.filter((c) => c.status !== "완료")
  const issues = AQ.aquaDataIssues
  const stage = AQ.aquaStages.find((x) => x.status === "진행 중")
  return {
    title: rs.level,
    lines: [rs.headline, `신뢰도 ${rs.confidence}% · 갱신 ${rs.updatedAt}`],
    level: rs.riskLevel,
    badge: rs.level,
    kpis: [
      { k: "활성 위험", v: `${s.activeRisk.count}건`, d: s.activeRisk.detail, over: s.activeRisk.count > 0 },
      { k: "승인 대기", v: `${s.pendingApproval.count}건`, d: s.pendingApproval.detail, over: s.pendingApproval.count > 0 },
      { k: "영향 양식장", v: `${s.affectedFarms.count}개소`, d: rs.affectedFarmDelta },
      { k: "데이터 품질", v: `${s.dataQuality.percent}%`, d: s.dataQuality.detail },
    ],
    tasks: [
      {
        role: "결재",
        title: `${ad.riskType} ${ad.grade} 경보 — 결재`,
        detail: `${ad.effectiveAt} · ${steps.map((x) => x.stage).join("→")}`,
        status: `결재 ${stepsDone}/${steps.length}단계`,
        level: stepsDone < steps.length ? "caution" : "safe",
        to: "/aqua/alerts",
      },
      ...(undone.length > 0
        ? [
            {
              role: "지시" as const,
              title: "e-SOP 미완료 조치 확인",
              detail: undone.map((c) => `${c.label}(${c.owner})`).join(" · "),
              status: `미완료 ${undone.length}/${AQ.aquaChecklist.length}건`,
              level: "warning" as RiskLevel,
              to: "/aqua/response",
            },
          ]
        : []),
      ...(issues.length > 0
        ? [{ role: "확인" as const, title: "데이터 수집 이상 조치", detail: issues.map((i) => i.title).join(" · "), status: `이상 ${issues.length}건`, level: "warning" as RiskLevel, to: "/aqua/data" }]
        : []),
    ],
    idle: "결재·지시 대기 없음",
    evidence: [
      { k: "염분", v: rsp.salinity },
      { k: "수온", v: rsp.temperature },
      { k: "위성 일치", v: `${ad.satelliteMatch} · 현장 편차 ${ad.fieldDelta}` },
      { k: "모델 신뢰도", v: AQ.aquaModelConfidence.map((m) => `${m.name} ${m.percent}%`).join(" · ") },
    ],
    outlook: [
      `저염분수 도달 ${rs.lowSalinity.eta} — ${rs.lowSalinity.time} · ${rs.lowSalinity.location}`,
      `고수온 ${rs.highTemp.eta} — ${rs.highTemp.location}`,
    ],
    response: [
      contactRow("aqua"),
      { k: "e-SOP 단계", v: stage ? `${stage.step}단계 ${stage.label} (${rsp.grade})` : rsp.grade },
      { k: "조치 체크리스트", v: `완료 ${AQ.aquaChecklist.length - undone.length}/${AQ.aquaChecklist.length}건` },
      { k: "기관 현황", v: AQ.aquaAgencyRows.map((a) => `${a.agency.replace(/^제주(특별자치도|시|시 )?/, "").trim()} ${a.execute}`).join(" · ") },
    ],
  }
}

// ------------------------------------------------------------------ 연안 안전관리
export function coastBrief(isEmpty = false): LeaderBrief {
  const s = isEmpty ? CO.coastSummary : CO.coastSummaryIncident
  const events = isEmpty ? CO.coastEvents : CO.coastEventsIncident
  const pending = events.filter((e) => e.status === "미확인")
  const dp = CO.coastDispatch // 아직 관심 단계라 출동요청 전 — 두 모드 동일
  const level = worstOf(events.map((e) => e.level))
  const lead = events[0]
  const d = isEmpty ? CO.coastEventDetail : CO.coastEventDetailIncident
  const aiInsights = isEmpty ? CO.coastAiInsights : CO.coastAiInsightsIncident
  const fieldAlerts = isEmpty ? CO.coastFieldAlerts : CO.coastFieldAlertsIncident
  const buoy = khoaBuoyMarineConditions[0]
  return {
    title: lead ? `${lead.type} — ${lead.location}` : s.activeEvents.detail,
    lines: [s.targetArea, `미확인 ${s.unconfirmedEvents.count}건 · ${s.coordination.detail}`],
    level,
    badge: events.length > 0 ? levelLabel(level) : "평시",
    kpis: [
      { k: "진행 중 이벤트", v: `${s.activeEvents.count}건`, d: s.activeEvents.detail, over: s.activeEvents.count > 0 },
      { k: "미확인", v: `${s.unconfirmedEvents.count}건`, d: s.unconfirmedEvents.detail, over: s.unconfirmedEvents.count > 0 },
      { k: "기관 공조", v: `${s.coordination.count}건`, d: s.coordination.detail },
      { k: "스마트폴", v: `정상 ${s.equipment.normal} · 오류 ${s.equipment.error}`, d: s.equipment.detail, over: s.equipment.error > 0 },
    ],
    tasks: [
      ...pending.map((e) => ({ role: "승인" as const, title: `${e.type} · ${e.location}`, detail: `${e.time} · ${e.source} — 대외 경보 발령 승인`, status: "승인 대기", level: e.level, to: "/coast/alerts" })),
      ...(dp.request.status.startsWith("요청 없음")
        ? []
        : [{ role: "지시" as const, title: "해경·소방 출동 요청", detail: `${dp.request.agency} · ${dp.request.eta}`, status: dp.request.status, level: dp.summary.level as RiskLevel, to: "/coast/dispatch" }]),
      ...(s.equipment.error > 0
        ? [{ role: "확인" as const, title: "스마트폴 장비 오류 조치", detail: s.equipment.detail, status: `오류 ${s.equipment.error}기`, level: "warning" as RiskLevel, to: "/coast/monitoring" }]
        : []),
    ],
    idle: "결재·지시 대기 없음 — 평시 감시 중",
    evidence: [
      { k: "이안류 위험", v: d.ripCurrentRisk.value },
      { k: "영상 탐지", v: d.detection.class },
      ...(buoy ? [{ k: `해양관측 ${buoy.stationName}`, v: `파고 ${buoy.waveHeightM}m · 풍속 ${buoy.windSpeedMs}m/s` }] : []),
      { k: "AI 판단", v: aiInsights.length > 0 ? aiInsights.map((a) => a.title).join(" · ") : "위험 신호 없음" },
    ],
    outlook: [dp.aiReason, dp.fallback],
    response: [
      contactRow("coast"),
      { k: "기관 공조", v: CO.coastAgencyStatuses.map((a) => `${a.agency} ${a.status}`).join(" · ") },
      { k: "AIoT 스마트폴", v: `정상 ${CO.coastSafetyAssets.filter((a) => a.status === "정상").length}/${CO.coastSafetyAssets.length}기` },
      { k: "현장 경보", v: `${fieldAlerts.length}건` },
    ],
  }
}
