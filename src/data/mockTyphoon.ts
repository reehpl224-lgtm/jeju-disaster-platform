import type {
  TyphoonAlertDispatch,
  TyphoonClosure,
  TyphoonForecastPoint,
  TyphoonReport,
} from "../types/typhoon"

/**
 * 기상청 발표 태풍 정보 — 자체 실측 장비 없이 전량 기상청 자료를 수신하는 구조이므로, 하천/호우처럼
 * "관측망 현황"이 없다. 발표 시각 역순으로 최신 정보가 먼저 온다. 다른 mock 데이터와 동일한 시간대
 * (2026-09-08 오후)로 맞췄다.
 */
export const typhoonReports: TyphoonReport[] = [
  {
    id: "ty-1",
    name: "제24호 크로반",
    status: "태풍경보",
    issuedAt: "2026-09-08 14:00",
    location: "일본 오키나와 북동쪽 약 210km 부근 해상",
    speedKmh: 24,
    pressureHpa: 985,
    maxWindMs: 28,
  },
  {
    id: "ty-2",
    name: "제24호 크로반",
    status: "태풍주의보",
    issuedAt: "2026-09-08 09:00",
    location: "일본 오키나와 동쪽 약 340km 부근 해상",
    speedKmh: 20,
    pressureHpa: 990,
    maxWindMs: 24,
  },
  {
    id: "ty-3",
    name: "제24호 크로반",
    status: "예비특보",
    issuedAt: "2026-09-07 21:00",
    location: "일본 오키나와 동남동쪽 약 480km 부근 해상",
    speedKmh: 18,
    pressureHpa: 994,
    maxWindMs: 21,
  },
]

/** 기상청 예보 기반 제주 접근 예상 경로(자체 산출 아님) — 최신 발표(ty-1, 210km·24km/h) 기준 전방 예측 */
export const typhoonForecastTrack: TyphoonForecastPoint[] = [
  { time: "2026-09-08 14:00", distanceFromJejuKm: 210, maxWindMs: 28, note: "현재 위치" },
  { time: "2026-09-08 20:00", distanceFromJejuKm: 140, maxWindMs: 27, note: "북서진 지속" },
  { time: "2026-09-09 02:00", distanceFromJejuKm: 80, maxWindMs: 26, note: "제주 근접 예상" },
  { time: "2026-09-09 08:00", distanceFromJejuKm: 60, maxWindMs: 24, note: "최근접 예상" },
  { time: "2026-09-09 14:00", distanceFromJejuKm: 120, maxWindMs: 20, note: "북동진 전환, 세력 약화 예상" },
]

export const typhoonAlertDispatch: TyphoonAlertDispatch = {
  stage: "태풍경보 대비 안내",
  title: "제24호 크로반 대비 안내",
  target: "제주 전역 주민",
  targetDetail: "해안가·저지대 우선 안내",
  sentAt: "2026-09-08 14:05",
  approver: "이도현 주무관",
  message: "태풍경보 — 외출 자제 및 시설물 고정 안내",
  channels: [
    { id: "tc-1", name: "문자(CBS/SMS)", sent: 612000, success: 609800, fail: 2200, rate: "99.6%", lastSent: "14:05:20" },
    { id: "tc-2", name: "모바일 앱 푸시", sent: 284000, success: 283100, fail: 900, rate: "99.7%", lastSent: "14:05:25" },
  ],
  totalFail: 3100,
}

export const typhoonClosure: TyphoonClosure = {
  caseId: "TY-2026-0827",
  title: "제18호 사우엘 특보 해제",
  status: "특보 해제",
  confirmedBy: "재난대응1팀 이도현 · 2026-08-28 09:10",
  type: "태풍 · 예비특보",
  duration: "18시간 40분",
  durationDetail: "예비특보 발효 2026-08-27 14:30 → 해제 2026-08-28 09:10",
  agencies: "기상청 특보 해제 확인 · 도청 상황실 모니터링 종료",
  agencyDetail: "총 대응 기관 2개소",
  observed: [
    { id: "ty-ob1", label: "제주 최근접 거리", value: "약 190km (2026-08-27 22:00)" },
    { id: "ty-ob2", label: "실측 최대풍속", value: "18m/s (제주 지상 관측)" },
  ],
  closureConditions: [
    "기상청 특보 공식 해제 확인",
    "제주 방향 이탈 경로 확인",
    "피해 신고 접수 없음 확인",
  ],
  report: {
    department: "제주특별자치도 자연재난과",
    sop: "e-SOP T-1 태풍 특보 해제 절차 v1.0",
    casualties: "없음",
    property: "없음",
    lesson: "기상청 발표 자료 수신 지연(약 8분) 1건 발생 — 수신 체계 점검 필요",
  },
}

export const typhoonSource = {
  note: "자체 실측 장비 없음 — 기상청 발표 자료를 전량 수신해 그대로 표출합니다.",
  relatedLegacySystem: "민방위경보시스템 (중앙 시스템과만 연계, 도 자체 연계 없음)",
}
