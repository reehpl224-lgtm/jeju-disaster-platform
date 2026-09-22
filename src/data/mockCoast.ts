import type { CoastAgencyStatus, CoastEvent, CoastFieldAlert, TimelineEntry } from "../types/coast"

/**
 * 연안 위험단계 상태 구간 — "TP-P22_002_플랫폼 데이터 리스트.xlsx" 연안 안전관리시스템 시트 "상태 구간 설정" 그대로(2026-09-22 사용자 확정).
 * 원본 단계명 '경보'는 앱 공통 라벨 '경계'(alert)로 표기. 세 지표(파고·풍속·조위) 중 몇 개 충족 시 상향인지는 원본에 없어 2026-09-22
 * classifyCoastRisk()(coastAlertThresholds.ts)로 임의 결합 규칙을 설정함 — 공식 기준 확정 시 수정.
 */
export const coastStageCriteria: { level: "safe" | "caution" | "warning" | "alert" | "danger"; label: string; waveHeight: string; windSpeed: string; tide: string; riskRange: string; action: string }[] = [
  { level: "safe", label: "정상", waveHeight: "1.0m 미만", windSpeed: "6m/s 미만", tide: "평시 평균 수위 유지", riskRange: "위험구역 잔류 인원 0명", action: "시스템 정상 작동·상시 모니터링, CCTV 이상 감지 자동 운영" },
  { level: "caution", label: "관심", waveHeight: "1.0 ~ 1.5m", windSpeed: "6 ~ 10m/s", tide: "만조 시 수위 상승 시작", riskRange: "위험구역 진입 AI 객체 감지 1~2건", action: "위험 지역 집중 모니터링 전환, 현장 전광판 주의 문구" },
  { level: "warning", label: "주의", waveHeight: "1.5 ~ 2.5m", windSpeed: "10 ~ 14m/s", tide: "고조(High Tide) 수위 도달", riskRange: "너울성 파도·간헐적 주기 파랑", action: "갯바위·방파제 자동 경보 방송, AI CCTV 너울 감지 알림" },
  { level: "alert", label: "경계(경보)", waveHeight: "2.5 ~ 4.0m", windSpeed: "14 ~ 20m/s", tide: "대조기·폭풍해일 주의 수위", riskRange: "방파제·해안도로 월파 시작", action: "위험구역 출입 전면 통제, 순찰 강화·대피 방송 연속 송출" },
  { level: "danger", label: "심각", waveHeight: "4.0m 초과", windSpeed: "20m/s 초과", tide: "범람·침수 위험 수위 초과", riskRange: "인명 고립·추락·내습 즉시 감지", action: "즉각 대피 명령, 해경·119·지자체 상황실 공유 및 구조대 출동" },
]

/**
 * 2026-09-22 리셋 — 더미 "진행 중 사건"을 정상 상태로 초기화. 연안 안전관리 파트는 아직 케이스를
 * 만들지 않았고(사용자가 먼저 확인하고 싶어한 것은 저염분 고수온 관심 단계), 평시 감시 상태만
 * 보여준다. 실제 API 연동 데이터(khoaBuoyMarineConditions 등)는 그대로 두고 건드리지 않음.
 */
export const coastSummary = {
  lastUpdated: "09:15",
  targetArea: "함덕·협재 해수욕장 (1차년도 실증지)",
  infra: "AIoT 스마트폴 신설 (지능형 CCTV + 기상센서 + 경보스피커)",
  permitNote: "공유수면 점용허가 등 인허가 절차 필요 (스마트폴 신설 구간)",
  aiLabels: ["Person_In_Water", "Danger_Zone_Person", "Rip_Current", "Overtopping"],
  // coastEvents 실제 목록(0건)과 반드시 같은 수치를 쓸 것
  activeEvents: { count: 0, detail: "평시 — 진행 중 이벤트 없음" },
  // coastEvents에서 status === "미확인"인 실제 건수와 반드시 같은 수치를 쓸 것 — CoastAlertPage의 승인 대기 목록과 동일해야 함
  unconfirmedEvents: { count: 0, detail: "확인 대기 없음" },
  coordination: { count: 0, detail: "출동 공조 없음" },
  equipment: { normal: 4, error: 0, detail: "전 기기 정상" },
}

/** GIS 쉘 자산현황 패널용 — AIoT 스마트폴 대표 4기(coastSummary.equipment 오류 0건과 일치) */
export const coastSafetyAssets: { id: string; name: string; location: string; status: "정상" | "오류"; detail: string }[] = [
  { id: "ca1", name: "함덕 AIoT 스마트폴 #1", location: "함덕해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
  { id: "ca2", name: "함덕 AIoT 스마트폴 #2", location: "함덕해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
  { id: "ca3", name: "협재 AIoT 스마트폴 #1", location: "협재해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
  { id: "ca4", name: "협재 AIoT 스마트폴 #2", location: "협재해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
]

export const coastAiInsights: { id: string; level: "safe" | "caution" | "warning" | "alert" | "danger"; title: string; basis: string; match: string }[] = []

export const coastEvents: CoastEvent[] = []

export const coastFieldAlerts: CoastFieldAlert[] = []

export const coastAgencyStatuses: CoastAgencyStatus[] = [
  { id: "a1", agency: "해경", status: "평시 대기", detail: "출동 요청 없음", level: "safe" },
  { id: "a2", agency: "소방", status: "평시 대기", detail: "출동 요청 없음", level: "safe" },
]

/**
 * 이벤트 상세(/coast/events) — 2026-09-22 리셋: 현재 감지된 위험 이벤트가 없는 평시 상태.
 * level이 CoastEventDetailPage·CoastAlertPage의 배지 색상을 결정한다.
 */
export const coastEventDetail = {
  id: "EVT-없음",
  level: "safe" as const,
  status: "평시 — 감지된 위험 이벤트 없음",
  type: "해당 없음",
  detectedAt: "-",
  grade: "정상",
  source: "AI CCTV · AIoT 스마트폴 (상시 모니터링 중)",
  zone: "함덕·협재 해수욕장 전 구역",
  reviewer: "-",
  reviewStatus: "해당 없음",
  location: "-",
  radius: "-",
  nearbyCoast: "-",
  ripCurrentZone: "감지된 이안류 위험구간 없음",
  relatedRiver: "인근 하천 없음",
  nearbyFarms: "인근 해상 양식시설 없음",
  waveZone: "-",
  rainSummary: { value: "10분 누적 강우 0 mm", detail: "정상 범위", updatedAt: "09:10" },
  waveSummary: { value: "유의 파고 0.6 m", detail: "정상 범위", updatedAt: "09:10" },
  ripCurrentRisk: { value: "AI 모델 위험 지수 0.05 / 1.0", detail: "이상 패턴 없음", confidence: "신뢰도 96%" },
  detection: { class: "탐지 클래스: 없음", confidence: "정상 모니터링 중" },
  sensorCrossCheck: [
    { id: "sc1", name: "조류 센서 CS-04", status: "정상" },
    { id: "sc2", name: "수온 부이 BU-11", status: "정상" },
  ],
  timeline: [
    { id: "t1", time: "09:10", title: "○ 정상 모니터링 — 이상 없음" },
  ] as TimelineEntry[],
  agencyStatus: [
    { id: "ag1", agency: "제주해양경찰서", status: "평시 대기" },
    { id: "ag2", agency: "제주시 재난안전과", status: "평시 대기" },
    { id: "ag3", agency: "서귀포시 상황실", status: "평시 대기" },
    { id: "ag4", agency: "119 해상구조대", status: "평시 대기" },
  ],
  fieldActions: {
    dispatch: "해당 없음 (평시)",
    control: "해당 없음 (평시)",
    alert: "해당 없음 (평시)",
  },
}

/**
 * 현장 공조(/coast/dispatch) — 2026-09-22 리셋: 현재 출동 요청이 없는 평시 상태. level이
 * CoastDispatchPage 배지 색상을 결정한다(이전에는 "danger" 하드코딩).
 */
export const coastDispatch = {
  // coastEventDetail과 같은 사건을 가리켜야 함 — 현재는 평시라 둘 다 비어 있음
  summary: { title: "현재 진행 중인 출동 요청 없음", level: "safe" as const, location: "함덕·협재 해수욕장 전 구역", detectedAt: "-" },
  confidence: 0,
  ripCurrent: "감지 없음",
  aiReason: "현재 위험 신호가 감지되지 않았습니다 — 평시 모니터링 유지 중",
  radius: "-",
  nearbyVisitors: "-",
  weather: "남서풍 4m/s · 시정 양호",
  request: {
    status: "요청 없음 (평시)",
    agency: "-",
    sentAt: "-",
    priority: "-",
    vessel: "-",
    eta: "-",
    fireLinked: "-",
    boardShared: "-",
  },
  fallback: "위험 신호 감지 시 자동으로 출동 요청 초안이 생성됩니다.",
}

export const coastMonitoringDomains = [
  { id: "coast", label: "연안", status: "정상", detail: "CCTV 이벤트 0건 · 경보 장비 정상", level: "safe" as const },
]

/**
 * 종료 보고서(/coast/closure) — 지난 사례 예시. 오늘(2026-09-22) 진행 중인 사건이 아니라,
 * "종료 보고서가 어떤 형태인지" 보여주기 위한 참고용으로 남겨둔 과거 사례.
 */
export const coastClosure = {
  caseId: "COA-2026-0904",
  title: "연안 위험 탐지 및 현장 경보 (지난 사례)",
  status: "종료 완료",
  confirmedBy: "관제 담당자 김제주 · 2026-09-04 17:42",
  type: "익수 위험 · 위험구역 진입",
  location: "제주시 함덕해수욕장 북단 방파제",
  duration: "1시간 23분",
  durationDetail: "최초 감지 16:19 → 종료 승인 17:42",
  agencies: "해경 출동 완료 · 소방 지원 완료",
  agencyDetail: "총 출동 기관 2개소 · 현장 인원 8명",
  aiSummary: [
    { id: "as1", label: "익수 위험 탐지 신뢰도", value: "98.4% (고신뢰)" },
    { id: "as2", label: "방파제 진입 탐지 신뢰도", value: "96.1% (고신뢰)" },
    { id: "as3", label: "이안류 위험 지수", value: "0.82 → 0.21 (해제 수준)" },
  ],
  observed: [
    { id: "ob1", label: "파고 (관측)", value: "최고 2.4m → 현재 0.9m (정상 이하)" },
    { id: "ob2", label: "풍속", value: "최고 14.2m/s → 현재 6.1m/s" },
    { id: "ob3", label: "이안류 위험 구간", value: "3개 구간 → 0개 구간 해소" },
  ],
  closureConditions: [
    "위험 구역 내 잔류 인원 없음 확인",
    "이안류·파고 위험 지수 해제 수준 도달",
    "현장 통제선 해제 및 차단기 복구 완료",
    "해경 현장 철수 및 귀환 확인",
    "감지 센서 정상 운용 복구",
  ],
  report: {
    department: "제주특별자치도 재난안전대책본부 연안 관제팀",
    sop: "e-SOP C-4 연안 위험 종료 절차 v2.3",
    casualties: "없음",
    property: "없음 (추정)",
    lesson: "CAM-11 센서 지연 2분 — 유지보수 요청 등록됨",
  },
}
