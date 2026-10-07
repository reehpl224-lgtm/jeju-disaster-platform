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
import { HAZARDS, type HazardId } from "../../data/mockHazards"
import { FLOW_STEPS, type FlowProgress } from "../../types/flow"

/**
 * 서비스별 "팀장 브리핑" — 제주 재난안전과 팀장(확인→승인→지시→결재를 하는 사람) 관점의 대시보드 요약.
 * 근거: 「제주 재난안전과 팀장 사용자 시나리오」(2026-09-23). 6개 서비스가 같은 순서로 답한다:
 *   ① 지금 어떤 상황인가  ② 내가 결재·지시할 것이 있는가  ③ 왜 그렇게 판단했나  ④ 앞으로 어떻게 되나  ⑤ 누가 무엇을 하고 있나
 * 값은 전부 각 서비스 mock 데이터에서 계산한다 — 서비스 상황을 사용자 시나리오로 바꾸면 이 요약도 같이 바뀐다
 * (예: 결재 항목은 "발령된 경보가 있을 때만" 생긴다). 여기에 수치·문구를 새로 만들어 넣지 말 것.
 * 보드 패널(LeaderBoardBrief)과 상세 대시보드(LeaderDetailBrief)가 이 한 곳을 같이 쓴다.
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

export interface FlowStepView {
  step: string
  state: "done" | "current" | "todo" | "skip"
  note: string
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
  /** 3대 실증서비스만 — 감지→확인→판단→경보→대응→종료 진행 */
  flow?: { active: boolean; steps: FlowStepView[] }
}

/** 서비스 mock의 FlowProgress를 화면용 단계 목록으로 — 시각이면 완료, "보류"면 건너뜀, 그 밖의 문구는 지금 이 단계 */
export function flowView(p: FlowProgress): { active: boolean; steps: FlowStepView[] } {
  const steps: FlowStepView[] = FLOW_STEPS.map((step) => {
    const v = p[step]
    if (!v) return { step, state: "todo", note: "" }
    if (v === "보류") return { step, state: "skip", note: "보류" }
    return /^\d{1,2}:\d{2}/.test(v) ? { step, state: "done", note: v } : { step, state: "current", note: v }
  })
  const active = steps.some((s) => s.state !== "todo")
  // 진행 중인 단계를 따로 적지 않았다면, 마지막 완료 단계 다음을 "다음 단계"로 표시한다
  if (active && !steps.some((s) => s.state === "current")) {
    const next = steps.find((s, i) => s.state === "todo" && steps.slice(0, i).some((x) => x.state === "done"))
    if (next) next.state = "current"
  }
  return { active, steps }
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
export function heavyRainBrief(): LeaderBrief {
  const f = HR.heavyRainAiForecast
  const ad = HR.heavyRainAlertDispatch
  const stations = HR.weatherStations
  const hasObs = f.stations.length > 0
  const maxObs = hasObs ? Math.max(...f.stations.map((s) => s.observedMm)) : 0
  const over = hasObs && f.forecastMm > 0 && maxObs > f.forecastMm
  const hot = stations.filter((s) => RANK.indexOf(s.status) >= RANK.indexOf("warning"))
  const top = HR.heavyRainTopStations[0]
  const latestBroadcast = HR.broadcastLog[0]
  const linked = HR.legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
  return {
    title: over ? `예보 ${f.forecastMm}mm/h 대비 실측 초과` : hasObs ? `실측 강우가 예보(${f.forecastMm}mm/h) 범위 내` : "감지된 돌발 강우 없음",
    lines: [hasObs ? `감지 ${f.detectedAt} · 경보·주의 관측소 ${hot.length}/${stations.length}` : "관측소 데이터 없음 — 평시 감시 중", ...(ad.sentAt !== "-" ? [`${ad.title} ${ad.sentAt} 발령`] : [])],
    level: worstOf(stations.map((s) => s.status)),
    badge: over ? "AI 조기경고" : hasObs ? "예보 범위 내" : "평시",
    kpis: [
      { k: "최대 실측 강우", v: hasObs ? `${maxObs}mm/h` : "-", d: f.forecastMm > 0 ? `예보 ${f.forecastMm}mm/h` : undefined, over },
      { k: "경보·주의 관측소", v: `${hot.length}/${stations.length}`, over: hot.length > 0 },
      { k: "누적 강우 1위", v: top ? `${top.cumulativeMm}mm` : "-", d: top?.stationName },
      { k: "자동통보", v: `${HR.broadcastLog.length}건`, d: latestBroadcast ? `최근 ${latestBroadcast.time}` : undefined },
    ],
    tasks: [
      ...(over
        ? [{ role: "확인" as const, title: "자동침수경보 발령 여부 판단", detail: f.confirmNote, status: "확인 필요", level: "warning" as RiskLevel, to: "/heavy-rain/analysis" }]
        : []),
      ...dispatchTask(ad, "/heavy-rain/alert"),
      ...(hot.length > 0 && top
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
    evidence: hasObs
      ? [
          { k: "우량계 실측", v: f.stations.map((s) => `${s.name} ${s.observedMm}mm/h`).join(" · ") },
          ...(f.forecastMm > 0 ? [{ k: "예보 대비", v: `${maxObs - f.forecastMm >= 0 ? "+" : ""}${maxObs - f.forecastMm}mm/h (${Math.round(((maxObs - f.forecastMm) / f.forecastMm) * 100)}%)` }] : []),
          { k: "침수센서", v: stations.filter((s) => s.type === "침수센서").map((s) => `${s.name.replace(/ 침수센서/, "")} ${s.value}`).join(" · ") || "-" },
        ]
      : [{ k: "우량계 실측", v: "관측 데이터 없음" }],
    outlook: [f.aiNote],
    response: [
      contactRow("general"),
      { k: "경보 발송 결과", v: ad.sentAt !== "-" ? channelLine(ad) : "발송 없음" },
      { k: "레거시 연계", v: `연계 진행중 ${linked}/${HR.legacySystems.length}개 시스템` },
    ],
  }
}

// ------------------------------------------------------------------ 산불·지진해일·대설
const HAZARD_EVIDENCE: Record<HazardId, string> = {
  wildfire: "기상청 건조·강풍 특보 · Open-Meteo 습도·풍속 예보(참고)",
  tsunami: "기상청 지진해일·해일 특보 · USGS 최근 지진(참고)",
  snow: "기상청 대설·한파 특보 · Open-Meteo 적설·기온 예보(참고)",
}

/** 자체 관측·시나리오 데이터가 없는 추가 재난 유형 — 평시 브리핑. 경보를 발령하면 결재 항목이 생긴다 */
export function hazardBrief(id: HazardId): LeaderBrief {
  const h = HAZARDS[id]
  const ad = h.dispatch
  const linked = h.legacy.filter((s) => s.linkStatus === "연계 진행중").length
  return {
    title: `${h.title} — 감지된 위험 없음`,
    lines: ["자체 관측 데이터 없음 — 기상청 특보와 공개 예보를 참고해 평시 감시 중", ...(ad.sentAt !== "-" ? [`${ad.title} ${ad.sentAt} 발령`] : [])],
    level: "safe",
    badge: "평시",
    kpis: [
      { k: "발령 경보", v: ad.sentAt !== "-" ? ad.stage : "없음" },
      { k: "레거시 연계", v: `${linked}/${h.legacy.length}`, d: "연계 진행중 기준" },
    ],
    tasks: dispatchTask(ad, `${h.path}/alert`),
    idle: "결재·지시 대기 없음 — 평시 감시 중",
    evidence: [{ k: "참고 지표", v: HAZARD_EVIDENCE[id] }],
    outlook: [h.subtitle],
    response: [
      contactRow("general"),
      { k: "경보 발송 결과", v: ad.sentAt !== "-" ? channelLine(ad) : "발송 없음" },
      { k: "레거시 연계", v: `연계 진행중 ${linked}/${h.legacy.length}개 시스템` },
    ],
  }
}

// ------------------------------------------------------------------ 태풍
export function typhoonBrief(): LeaderBrief {
  const cur = TY.typhoonReports[0]
  const trk = TY.typhoonForecastTrack
  const d = TY.typhoonAlertDispatch
  const buoy = khoaBuoyMarineConditions[0]
  if (!cur) {
    return {
      title: "발표 중인 태풍 없음",
      lines: ["기상청 발표 태풍 정보가 없습니다 — 평시 감시 중", TY.typhoonSource.note],
      level: "safe",
      badge: "평시",
      kpis: [
        { k: "제주까지", v: "-" },
        { k: "최근접 예상", v: "-" },
        { k: "최대 풍속", v: "-" },
        { k: "중심 기압", v: "-" },
      ],
      tasks: dispatchTask(d, "/typhoon/alert"),
      idle: "결재·지시 대기 없음 — 발표 중인 태풍 없음",
      evidence: [{ k: "관측 체계", v: TY.typhoonSource.note }],
      outlook: ["예상 경로 없음 — 기상청이 태풍을 발표하면 제주 접근 경로가 표시됩니다."],
      response: [contactRow("general"), { k: "대비 안내 발송", v: d.sentAt !== "-" ? channelLine(d) : "발송 없음" }],
    }
  }
  const nearest = trk.length > 0 ? trk.reduce((a, b) => (b.distanceFromJejuKm < a.distanceFromJejuKm ? b : a)) : undefined
  const level: RiskLevel = cur.status === "태풍경보" ? "alert" : cur.status === "태풍주의보" ? "warning" : "caution"
  return {
    title: `${cur.name} · ${cur.status}`,
    lines: [cur.location, `기상청 발표 ${cur.issuedAt}`],
    level,
    badge: cur.status,
    kpis: [
      { k: "제주까지", v: trk[0] ? `${trk[0].distanceFromJejuKm}km` : "-", d: `이동 ${cur.speedKmh}km/h` },
      { k: "최근접 예상", v: nearest ? `${nearest.distanceFromJejuKm}km` : "-", d: nearest?.time.slice(5), over: !!nearest },
      { k: "최대 풍속", v: `${cur.maxWindMs}m/s` },
      { k: "중심 기압", v: `${cur.pressureHpa}hPa` },
    ],
    tasks: [
      ...dispatchTask(d, "/typhoon/alert"),
      {
        role: "지시",
        title: "대응반 소집·시설물 고정 등 대비태세 점검",
        detail: `${nearest ? `최근접 ${nearest.distanceFromJejuKm}km (${nearest.time.slice(5)}) · ` : ""}담당 ${contactOf("general")?.name ?? "-"}`,
        status: "지시 권고",
        level: "caution",
        to: "/typhoon/analysis",
      },
      { role: "확인", title: "민방위경보시스템 연계 확인", detail: TY.typhoonSource.relatedLegacySystem, status: "병행 조치 확인", level: "info", to: "/typhoon/alert" },
    ],
    idle: "결재·지시 대기 없음",
    evidence: [
      { k: "기상청 발표", v: `${TY.typhoonReports.length}회 · 최근 ${cur.status}` },
      { k: "이동·세력", v: `${cur.speedKmh}km/h · ${cur.pressureHpa}hPa · ${cur.maxWindMs}m/s` },
      { k: "관측 체계", v: TY.typhoonSource.note },
    ],
    outlook: trk.length > 0 ? trk.map((p) => `${p.time.slice(5)} · 제주까지 ${p.distanceFromJejuKm}km · ${p.maxWindMs}m/s — ${p.note}`) : ["예상 경로 없음"],
    response: [
      contactRow("general"),
      { k: "대비 안내 발송", v: d.sentAt !== "-" ? channelLine(d) : "발송 없음" },
      ...(buoy ? [{ k: `해양관측 ${buoy.stationName}`, v: `파고 ${buoy.waveHeightM}m · 풍속 ${buoy.windSpeedMs}m/s` }] : []),
    ],
  }
}

// ------------------------------------------------------------------ 폭염
// 기상청 폭염특보 기준(HT.heatLevelInfo.criteria): 체감 33℃ 이상 2일 이상 = 주의보, 35℃ 이상 = 경보
const HEAT_WATCH_C = 33
const HEAT_WARNING_C = 35
export function heatBrief(): LeaderBrief {
  const li = HT.heatLevelInfo
  const d = HT.heatAlertDispatch
  const shelters = HT.heatShelters
  const capacity = shelters.reduce((sum, s) => sum + (s.capacity ?? 0), 0)
  const noCapacity = shelters.filter((s) => s.capacity === null).length
  const feels = li.feelsLikeC
  let days = 0
  for (let i = HT.heatTrend.length - 1; i >= 0 && HT.heatTrend[i].feelsLikeC >= HEAT_WATCH_C; i--) days++
  const gap = feels === null ? null : +(HEAT_WARNING_C - feels).toFixed(1)
  const first = HT.heatTrend[0]
  const last = HT.heatTrend[HT.heatTrend.length - 1]
  return {
    title: li.label,
    lines: [feels === null ? "체감온도 관측값 없음" : `체감온도 ${feels}℃ · ${li.updatedAt} 기준`, li.criteria],
    level: li.level,
    badge: li.label,
    kpis: [
      { k: "체감온도", v: feels === null ? "-" : `${feels}℃`, over: feels !== null && feels >= HEAT_WATCH_C },
      { k: "주의보 기준 지속", v: feels === null ? "-" : `${days}일`, d: `체감 ${HEAT_WATCH_C}℃ 이상 연속` },
      { k: "경보(35℃)까지", v: gap === null ? "-" : gap > 0 ? `${gap}℃` : "도달", d: gap !== null && gap > 0 ? "남은 격차" : undefined, over: gap !== null && gap <= 0 },
      { k: "무더위쉼터", v: `${shelters.length}개소`, d: shelters.length > 0 ? `수용 ${capacity.toLocaleString()}명${noCapacity > 0 ? ` (정원 미등록 ${noCapacity}곳 제외)` : ""}` : undefined },
    ],
    tasks: [
      ...dispatchTask(d, "/heat/alert"),
      ...(feels === null
        ? []
        : [
            {
              role: "확인" as const,
              title: `폭염경보(${HEAT_WARNING_C}℃) 격상 판단`,
              detail: `체감 ${feels}℃ · ${days}일 지속 — ${gap !== null && gap > 0 ? `경보 기준까지 ${gap}℃` : "경보 기준 도달"}`,
              status: gap !== null && gap > 0 ? "추이 관찰" : "격상 검토 필요",
              level: (gap !== null && gap > 0 ? "caution" : "alert") as RiskLevel,
              to: "/heat/analysis",
            },
          ]),
      ...(shelters.length > 0
        ? [
            {
              role: "지시" as const,
              title: "무더위쉼터 운영·그늘길 안내 점검",
              detail: `쉼터 ${shelters.length}개소 · 그늘길 ${HT.heatRouteTips.filter((r) => r.kind === "cool").length}곳 · 담당 ${contactOf("general")?.name ?? "-"}`,
              status: "지시 권고",
              level: "caution" as RiskLevel,
              to: "/heat/alert",
            },
          ]
        : []),
      ...(HT.heatClosure.closureConditions.length > 0
        ? [{ role: "결재" as const, title: "해제 조건 확인", detail: HT.heatClosure.closureConditions[0], status: "해제 전 확인", level: "info" as RiskLevel, to: "/heat/closure" }]
        : []),
    ],
    idle: "결재·지시 대기 없음",
    evidence:
      first && last
        ? [
            { k: "체감온도 추이", v: `${first.date} ${first.feelsLikeC}℃ → ${last.date} ${last.feelsLikeC}℃` },
            { k: "최근 최고기온", v: `${last.date} ${last.maxTempC}℃` },
            { k: "판단 기준", v: li.criteria },
          ]
        : [{ k: "판단 기준", v: li.criteria }],
    outlook: [`체감 ${HEAT_WARNING_C}℃ 이상 지속 시 폭염경보로 격상 — ${gap === null ? "관측값 없음" : gap > 0 ? `현재 ${gap}℃ 부족` : "기준 도달"}`],
    response: [contactRow("general"), { k: "안내 발송 결과", v: d.sentAt !== "-" ? channelLine(d) : "발송 없음" }, { k: "쉼터 운영", v: shelters.length > 0 ? `${shelters.length}개소 · 수용 ${capacity}명` : "등록된 쉼터 없음" }],
  }
}

// ------------------------------------------------------------------ 하천범람
export function riverBrief(): LeaderBrief {
  const st = RV.riverStatuses
  const worst = [...st].sort((a, b) => RANK.indexOf(b.level) - RANK.indexOf(a.level))[0]
  const rb = RV.riverRiskBasis
  const sr = RV.riverSuddenRainAlert
  const wl = RV.riverWaterLevelAiForecast
  const dr = RV.riverDispatchRequest
  const d = RV.riverAlertDispatch
  const tc = RV.riverTideCorrelation
  const calm = worst.level === "safe"
  const gateBad = RV.riverControlRows.some((r) => r.gate !== "정상 작동")
  const judge = RV.riverFlowProgress.판단
  const judgePending = !!judge && !/^\d{1,2}:\d{2}/.test(judge) && judge !== "보류"
  return {
    title: `${worst.name} ${worst.stage}`,
    lines: [...st.map((s) => `${s.name} — 범람 도달 ${s.eta} · 갱신 ${s.updatedAt}`), `${RV.riverSopStage.current} — ${RV.riverSopStage.next}`],
    level: worst.level,
    badge: worst.stage,
    kpis: [
      { k: "수위", v: rb.waterLevel.value, d: rb.waterLevel.detail, over: !calm },
      { k: "강우량", v: rb.rainfall.value, d: rb.rainfall.detail, over: !calm },
      { k: "레이더", v: rb.radar.value, d: rb.radar.detail },
      { k: "토양 포화도", v: rb.saturation.value, d: rb.saturation.detail },
    ],
    tasks: [
      // 판단 단계가 "승인 대기" 같은 문구면 팀장 승인이 아직 안 난 것 — 이미 승인한 뒤(시각 기록)라면 다음 단계 상향 여부만 지켜본다
      ...(calm
        ? []
        : judgePending
          ? [{ role: "승인" as const, title: `${worst.name} 단계 상향·경보 발령`, detail: RV.riverSopStage.next, status: worst.stage, level: worst.level, to: "/river/alert" }]
          : [{ role: "확인" as const, title: `${worst.name} 다음 단계 상향 여부`, detail: RV.riverSopStage.next, status: worst.stage, level: worst.level, to: "/river/analysis" }]),
      ...(sr.level !== "safe"
        ? [{ role: "확인" as const, title: judgePending ? "돌발 강우 감지 — 단계 상향 판단" : "돌발 강우 추이 확인", detail: sr.confirmNote, status: sr.label, level: sr.level, to: "/river/analysis" }]
        : []),
      ...dispatchTask(d, "/river/alert"),
      ...(RV.riverControlFailures.length > 0 || gateBad
        ? [{ role: "지시" as const, title: "현장 통제·차단기 조치", detail: RV.riverControlFailures[0]?.title ?? "차단기 이상", status: `조치 실패 ${RV.riverControlFailures.length}건`, level: "danger" as RiskLevel, to: "/river/control" }]
        : []),
      ...(dr.level !== "safe"
        ? [{ role: "승인" as const, title: `출동 요청 — ${dr.target}`, detail: `도달 예상 ${dr.eta} · ${dr.impact}`, status: dr.stage.replace("⚠ ", ""), level: dr.level, to: "/river/dispatch" }]
        : []),
    ],
    idle: `결재·지시 대기 없음 — ${RV.riverSopStage.next}`,
    evidence: [
      { k: "영향 예상", v: `${RV.riverImpact.area} · ${RV.riverImpact.population}` },
      {
        k: "수위",
        v: wl.currentM === null ? "관측값 없음" : `6시간 전 ${wl.sixHourAgoM ?? "-"}m → 현재 ${wl.currentM}m · ${wl.status}`,
      },
      { k: "돌발 강우", v: `예보 ${sr.forecastMm}mm → 실측 ${sr.observedMm}mm · ${sr.label}` },
      { k: "토양 포화도", v: `${rb.saturation.value} (${rb.saturation.grade})` },
      { k: "데이터 신뢰도", v: RV.riverDataConfidence.overall },
    ],
    outlook: [wl.trendNote, `조위 참고 — 다음 만조 ${tc.nextHighTide} (${tc.location})`, sr.trendNote],
    response: [
      contactRow("river"),
      { k: "공동 대응 기관", v: RV.riverJointAgencies.map((j) => `${j.agency.replace(/ \(.*\)/, "")} ${j.status}`).join(" · ") },
      { k: "전파 현황", v: RV.riverPropagation.map((p) => `${p.channel} ${p.status}`).join(" · ") },
      { k: "최근 승인 이력", v: RV.riverApprovalHistory[RV.riverApprovalHistory.length - 1]?.title ?? "-" },
    ],
    flow: flowView(RV.riverFlowProgress),
  }
}

// ------------------------------------------------------------------ 저염분 고수온
export function aquaBrief(): LeaderBrief {
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
    flow: flowView(AQ.aquaFlowProgress),
  }
}

// ------------------------------------------------------------------ 연안 안전관리
export function coastBrief(): LeaderBrief {
  const s = CO.coastSummary
  const events = CO.coastEvents
  const pending = events.filter((e) => e.status === "미확인")
  const dp = CO.coastDispatch
  const level = worstOf(events.map((e) => e.level))
  const lead = events[0]
  const d = CO.coastEventDetail
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
        : [
            {
              // 출동 요청이 초안이라 팀장 승인을 기다리는 중이면 "승인", 이미 나간 요청을 챙기는 것이면 "지시"
              role: (dp.request.status.includes("승인 대기") ? "승인" : "지시") as BriefRole,
              title: "해경·소방 출동 요청",
              detail: `${dp.request.agency} · 도착 예상 ${dp.request.eta}`,
              status: dp.request.status,
              level: dp.summary.level as RiskLevel,
              to: "/coast/dispatch",
            },
          ]),
      ...(s.equipment.error > 0
        ? [{ role: "확인" as const, title: "스마트폴 장비 오류 조치", detail: s.equipment.detail, status: `오류 ${s.equipment.error}기`, level: "warning" as RiskLevel, to: "/coast/monitoring" }]
        : []),
    ],
    idle: "결재·지시 대기 없음 — 평시 감시 중",
    evidence: [
      { k: "이안류 위험", v: d.ripCurrentRisk.value },
      { k: "영상 탐지", v: d.detection.class },
      ...(buoy ? [{ k: `해양관측 ${buoy.stationName}`, v: `파고 ${buoy.waveHeightM}m · 풍속 ${buoy.windSpeedMs}m/s` }] : []),
      { k: "AI 판단", v: CO.coastAiInsights.length > 0 ? CO.coastAiInsights.map((a) => a.title).join(" · ") : "위험 신호 없음" },
    ],
    outlook: [dp.aiReason, dp.fallback],
    response: [
      contactRow("coast"),
      { k: "기관 공조", v: CO.coastAgencyStatuses.map((a) => `${a.agency} ${a.status}`).join(" · ") },
      { k: "AIoT 스마트폴", v: `정상 ${CO.coastSafetyAssets.filter((a) => a.status === "정상").length}/${CO.coastSafetyAssets.length}기` },
      { k: "현장 경보", v: `${CO.coastFieldAlerts.length}건` },
    ],
    flow: flowView(CO.coastFlowProgress),
  }
}
