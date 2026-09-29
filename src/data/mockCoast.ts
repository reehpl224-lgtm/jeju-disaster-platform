import type { CoastAgencyStatus, CoastEvent, CoastFieldAlert, TimelineEntry } from "../types/coast"
import type { FlowProgress } from "../types/flow"

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
  lastUpdated: "-",
  targetArea: "함덕·협재 해수욕장 (1차년도 실증지)",
  infra: "AIoT 스마트폴 신설 (지능형 CCTV + 기상센서 + 경보스피커)",
  permitNote: "공유수면 점용허가 등 인허가 절차 필요 (스마트폴 신설 구간)",
  aiLabels: ["Person_In_Water", "Danger_Zone_Person", "Rip_Current", "Overtopping"],
  // coastEvents 실제 목록(0건)과 반드시 같은 수치를 쓸 것
  activeEvents: { count: 0, detail: "평시 — 진행 중 이벤트 없음" },
  // coastEvents에서 status === "미확인"인 실제 건수와 반드시 같은 수치를 쓸 것 — CoastAlertPage의 승인 대기 목록과 동일해야 함
  unconfirmedEvents: { count: 0, detail: "확인 대기 없음" },
  coordination: { count: 0, detail: "출동 공조 없음" },
  equipment: { normal: 0, error: 0, detail: "등록된 기기 없음" },
}

/** GIS 쉘 자산현황 패널용 — AIoT 스마트폴 목록(2026-09-29 초기화로 비움). 시나리오가 기기와 상태를 채운다 */
export const coastSafetyAssets: { id: string; name: string; location: string; status: "정상" | "오류"; detail: string }[] = []

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
  rainSummary: { value: "-", detail: "관측값 없음", updatedAt: "-" },
  waveSummary: { value: "-", detail: "관측값 없음", updatedAt: "-" },
  ripCurrentRisk: { value: "-", detail: "이상 패턴 없음", confidence: "-" },
  detection: { class: "탐지 없음", confidence: "-" },
  sensorCrossCheck: [] as { id: string; name: string; status: string }[],
  timeline: [] as TimelineEntry[],
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
  weather: "-",
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

export const coastMonitoringDomains: { id: string; label: string; status: string; detail: string; level: "safe" | "caution" | "warning" | "alert" | "danger" }[] = []

/**
 * KHOA 실측 기반 AI 보강 가능성 검토(2026-09-28) — classifyCoastRisk()(coastAlertThresholds.ts)의
 * 조위(tide) 입력이 비어 있어 "정보 없음 → 평시 가정"으로 처리되던 부분을 점검. 하천(river)이 쓰는
 * khoaMoseulpoTide(모슬포 조위관측소, 시간별 실측)가 있지만 협재와 약 20km, 함덕과 약 53km 떨어진
 * 다른 해역이라, 그 값을 그대로 결합 규칙에 대입하면 새 임의 임계값을 지어내는 것과 다르지 않아
 * 실제 판정에는 반영하지 않고 참고 표시만 하기로 함(2026-09-28 결정). 파고·풍속(KHOA 부이)은 이미
 * 결합 규칙 예시에 쓰이고 있지만, 유의파랑 주기(wavePeriodSec)는 부이 데이터에 있는데도 결합
 * 규칙이 파고만 쓰고 있어 미반영 상태 — 주기가 길수록(너울성) 이안류 위험이 커진다는 건 공식
 * 자료로 확인이 필요해 임의로 로직에 넣지 않았다. 상세 근거·실증사 요청안:
 * docs/khoa-ai-prediction-requests.md
 */
export const coastKhoaEnhancementReview = {
  feasible: "제한적",
  summary: "KHOA 부이 파고·풍속은 이미 결합 규칙 예시에 반영 중 — 조위(모슬포)는 거리가 멀어 참고 표시만 하고 실제 판정엔 미반영",
  usable: ["KHOA 부이(중문·제주남부·제주해협) 파고·풍속 실측 — 이미 결합 규칙 적용 예시에 반영 중"],
  limited: [
    "조위(모슬포 조위관측소)는 협재·함덕과 각각 약 20km·53km 떨어진 참고값이라 결합 규칙에 직접 대입하지 않음",
    "유의파랑 주기(wavePeriodSec)는 부이 데이터에 이미 있으나 결합 규칙이 파고만 쓰고 주기는 미반영",
  ],
  vendorAsk: "올포랜드에 (1) 함덕·협재 현지 조위·파고 실측 지점 신설 여부, (2) 파랑 주기 기반 이안류 위험도 가중 로직 적용 여부를 문의할 필요가 있음",
}

/** 종료 보고서(/coast/closure) — 종료된 사건 없음(양식만 남김, 2026-09-29 초기화) */
export const coastClosure = {
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
  aiSummary: [] as { id: string; label: string; value: string }[],
  observed: [] as { id: string; label: string; value: string }[],
  closureConditions: [] as string[],
  report: { department: "-", sop: "-", casualties: "-", property: "-", lesson: "-" },
}

/** 업무 흐름 진행(감지→확인→판단→경보→대응→종료) — 평시라 시작된 단계 없음. 시나리오가 채운다 */
export const coastFlowProgress: FlowProgress = {}
