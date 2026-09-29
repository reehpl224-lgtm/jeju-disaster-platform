import type {
  TyphoonAlertDispatch,
  TyphoonClosure,
  TyphoonForecastPoint,
  TyphoonReport,
} from "../types/typhoon"

/**
 * 2026-09-29 초기화 — 시나리오 더미(발표 이력·예상 경로·발송·종료 보고)를 비웠다(사용자 요청). 발표 이력이 비어 있으면
 * "발표 중인 태풍 없음"이다. 기상청 발표 이력은 최신이 먼저 오도록 넣는다(형식: 벤더 데모의 태풍 정보 카드).
 */
export const typhoonReports: TyphoonReport[] = []

/** 기상청 예보 기반 제주 접근 예상 경로(자체 산출 아님) — 발표 중인 태풍이 없으면 비어 있다 */
export const typhoonForecastTrack: TyphoonForecastPoint[] = []

export const typhoonAlertDispatch: TyphoonAlertDispatch = {
  stage: "발령 없음",
  level: "safe",
  title: "현재 발령된 대비 안내 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  approver: "-",
  message: "현재 발령된 대비 안내가 없습니다.",
  channels: [
    { id: "tc-1", name: "문자(CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "tc-2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
  ],
  totalFail: 0,
}

/** 해제 보고 — 종료된 사건 없음(양식만 남김) */
export const typhoonClosure: TyphoonClosure = {
  caseId: "-",
  title: "해제된 특보 없음",
  status: "-",
  confirmedBy: "-",
  type: "-",
  duration: "-",
  durationDetail: "-",
  agencies: "-",
  agencyDetail: "-",
  observed: [],
  closureConditions: [],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
}

export const typhoonSource = {
  note: "자체 실측 장비 없음 — 기상청 발표 자료를 전량 수신해 그대로 표출합니다.",
  relatedLegacySystem: "민방위경보시스템 (중앙 시스템과만 연계, 도 자체 연계 없음)",
}
