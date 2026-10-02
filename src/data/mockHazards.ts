import type { HeavyRainAlertDispatch, HeavyRainClosure, LegacySystemStatus } from "../types/heavyRain"
import { legacySystems as heavyRainLegacySystems } from "./mockHeavyRain"

/**
 * 산불·지진해일·대설 — 호우·태풍처럼 "레거시/외부 시스템 상황 뷰"로 구성한 추가 재난 유형(화면목록 S1-03_03·04·06).
 * 호우·태풍·폭염과 같은 틀(보드 + 상세 5화면)을 한 정의로 만든다. 자체 관측망·시나리오 데이터가 아직 없어
 * 경보·종료 양식은 비워 두고(평시), 값은 기상청 특보·Open-Meteo 예보·USGS 지진 같은 실시간 공개 데이터로만 채운다.
 * 연계 대상·방식이 조사되지 않은 레거시는 "미연계 — 조사 전"으로만 적는다(연계 완료로 과장하지 않음).
 */
export type HazardId = "wildfire" | "tsunami" | "snow"
export const HAZARD_IDS: HazardId[] = ["wildfire", "tsunami", "snow"]

export interface HazardDef {
  id: HazardId
  title: string
  icon: string
  /** 경로 접두사·서비스 카드 id와 같다 */
  path: string
  /** 보드 지도 상단 한 줄 */
  headline: string
  /** 상세 대시보드 소제목 */
  subtitle: string
  /** 기상청 특보 종류 코드(wrn_met_data) */
  wrnCodes: string[]
  wrnTitle: string
  /** 실시간 참고 데이터 종류 */
  live: "fire" | "quake" | "snow"
  legacy: LegacySystemStatus[]
  dispatch: HeavyRainAlertDispatch
  closure: HeavyRainClosure
}

const emptyDispatch = (): HeavyRainAlertDispatch => ({
  stage: "발령 없음",
  level: "safe",
  title: "현재 발령된 경보 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  approver: "-",
  message: "현재 발령된 경보가 없습니다.",
  channels: [
    { id: "hc-1", name: "문자(CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "hc-2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "hc-3", name: "재해문자전광판", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-", unit: "개소" },
  ],
  totalFail: 0,
})

const emptyClosure = (): HeavyRainClosure => ({
  caseId: "-",
  title: "종료된 사건 없음",
  status: "-",
  confirmedBy: "-",
  type: "-",
  location: "-",
  duration: "-",
  durationDetail: "-",
  agencies: "-",
  agencyDetail: "-",
  aiSummary: [],
  observed: [],
  closureConditions: [],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
})

const legacyOf = (id: string): LegacySystemStatus[] => heavyRainLegacySystems.filter((s) => s.id === id)

export const HAZARDS: Record<HazardId, HazardDef> = {
  wildfire: {
    id: "wildfire",
    title: "산불",
    icon: "🔥",
    path: "/wildfire",
    headline: "🔥 산불 — 평시 · 건조·강풍 특보와 습도·풍속 예보로 감시",
    subtitle: "산불 정보는 아직 연계 전이라, 기상청 건조·강풍 특보와 습도·풍속 예보를 참고 지표로 보여줍니다",
    wrnCodes: ["D", "W"],
    wrnTitle: "실시간 건조·강풍 특보",
    live: "fire",
    legacy: [
      {
        id: "wf-forest",
        name: "산불 정보(산림청 산불상황·산불위험예보)",
        operator: "산림청 · 제주특별자치도",
        linkStatus: "미연계",
        note: "연계 대상·방식 조사 전 — 화면목록 S1-03_03 '산불정보'",
      },
    ],
    dispatch: emptyDispatch(),
    closure: emptyClosure(),
  },
  tsunami: {
    id: "tsunami",
    title: "지진해일",
    icon: "🛟",
    path: "/tsunami",
    headline: "🛟 지진해일 — 평시 · 기상청 지진해일·해일 특보와 최근 지진으로 감시",
    subtitle: "민방위경보·대피소는 아직 연계 전이라, 기상청 지진해일 특보와 최근 지진 발생 현황을 참고 지표로 보여줍니다",
    wrnCodes: ["N", "O"],
    wrnTitle: "실시간 지진해일·해일 특보",
    live: "quake",
    legacy: legacyOf("ls-5"),
    dispatch: emptyDispatch(),
    closure: emptyClosure(),
  },
  snow: {
    id: "snow",
    title: "대설",
    icon: "❄️",
    path: "/snow",
    headline: "❄️ 대설 — 평시 · 기상청 대설·한파 특보와 적설·기온 예보로 감시",
    subtitle: "자체 적설 관측망이 없어, 기상청 대설·한파 특보와 적설·기온 예보를 참고 지표로 보여줍니다",
    wrnCodes: ["S", "C"],
    wrnTitle: "실시간 대설·한파 특보",
    live: "snow",
    legacy: legacyOf("ls-7"),
    dispatch: emptyDispatch(),
    closure: emptyClosure(),
  },
}
