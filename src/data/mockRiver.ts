import type { RiverControlRow, RiverStatus, RiverTidePoint, TimelineEntry } from "../types/river"
import type { RiskLevel } from "../types/domain"

export const riverTarget = {
  area: "서귀포시 효돈천 (돈내코·쇠소깍)",
  accuracyGoal: "예측 일치율 85% 이상",
  leadTimeGoal: "1시간 선행 범람 예측",
  aiLabels: ["Water_Level_High", "Flood_Imminent", "Debris_Flow"],
}

export const riverInfra = {
  newBuild: ["효돈천 AIoT 5종 복합 계측망 6개소 (1차년도 상류 3개소)", "스마트폴 (2차년도 중·하류 3개소에 포함)"],
  legacy: {
    jeju: 66,
    seogwipo: 69,
    total: 135,
    note: "레거시 침수정보센서 연계 (제주시·서귀포시) — 자사 강점 접점",
  },
}

/**
 * 하천 위험단계 상태 구간 — "TP-P22_002_플랫폼 데이터 리스트.xlsx" 하천 범람예측·경보 시스템 시트 "상태 구간 설정" 그대로(2026-09-22 사용자 확정).
 * 원본 단계명 '경보'는 앱 공통 라벨 '경계'(alert)로 표기한다. 원본은 20~30% 다음이 50%로 30~50% 구간이 비어 있어, 원본의 50%·70%·100%를 각 단계 '도달' 기준으로 보고
 * 관심을 다음 단계(주의 50%) 직전까지 연장해 빈 구간 없이 이어지게 임의 설정함(2026-09-22 사용자 요청) — 공식 기준 확정 시 수정.
 */
export const riverStageCriteria: { level: "safe" | "caution" | "warning" | "alert" | "danger"; label: string; flowRatio: string; waterState: string; meaning: string; action: string }[] = [
  { level: "safe", label: "정상", flowRatio: "20% 미만", waterState: "평시 수위 유지", meaning: "통상적인 하천 흐름 유지(침수 위험 없음)", action: "상시 모니터링, 시설물 정기 점검, 시스템 상태 확인" },
  { level: "caution", label: "관심", flowRatio: "20% 이상 ~ 50% 미만", waterState: "유의 수위 도달", meaning: "강우에 의한 하천 수위 상승 시작", action: "모니터링 강화, 통제 지점·연락망 점검, 산책로 예비 통제" },
  { level: "warning", label: "주의", flowRatio: "50% 이상 ~ 70% 미만", waterState: "주의보 수위 도달", meaning: "수위 급상승으로 홍수주의보 수준 도달", action: "하천변 출입 통제, 하상도로 차단, 주민 안내 방송" },
  { level: "alert", label: "경계(경보)", flowRatio: "70% 이상 ~ 100% 미만", waterState: "경보 수위 도달", meaning: "제방 유실 위험에 근접한 경계 상태", action: "제방 점검, 저지대 대피 준비, 비상근무 체계 전환" },
  { level: "danger", label: "심각", flowRatio: "100% 이상", waterState: "계획홍수위 도달", meaning: "계획홍수위 도달로 범람 임박·발생", action: "즉시 주민 대피 명령, 재난문자(CBS) 발송, 긴급 차단" },
]

/**
 * 2026-09-22 리셋 — 더미 "진행 중 사건"을 정상(0단계) 상태로 초기화. 하천범람 파트는 아직 케이스를
 * 만들지 않았고(사용자가 먼저 확인하고 싶어한 것은 저염분 고수온 관심 단계), 평시 감시 상태만
 * 보여준다. 실제 API 연동 데이터(khoaMoseulpoTide)는 그대로 두고 건드리지 않음.
 */
export const riverStatuses: RiverStatus[] = [
  { id: "soesokkak", name: "효돈천(쇠소깍)", level: "safe", stage: "0단계 · 정상", eta: "해당 없음", updatedAt: "09:00" },
  { id: "donnaeko", name: "효돈천(돈내코)", level: "safe", stage: "0단계 · 정상", eta: "해당 없음", updatedAt: "09:00" },
]

export const riverApprovalHistory: TimelineEntry[] = [
  { id: "h1", time: "09:00", title: "정기 점검 완료 — 이상 없음" },
]

export const riverSopStage = {
  current: "정상 단계 (0단계)",
  level: "safe" as RiskLevel,
  next: "현재 조치 필요 없음 · 강우·수위 임계값 도달 시 관심 단계로 자동 전환",
}

export const riverRiskBasis = {
  rainfall: { value: "1.5 mm", detail: "정상 범위", trend: "안정적" },
  waterLevel: { value: "1.05 m", detail: "정상 수위 (평시 0~0.8m 기준 여유)", trend: "안정적" },
  radar: { value: "감지 없음", detail: "강우 신호 없음", confidence: "-" },
  saturation: { value: "38%", detail: "추가 흡수 여력 충분", grade: "낮음" },
}

/**
 * 돌발 강우 AI 조기경고 — 레거시시스템 현황 조사 면담(2026-09-07) 근거: "사전 예고된 태풍 등은
 * 오히려 수월하고, 기상청 예측을 벗어나는 돌발 폭우가 가장 대응이 어렵다"는 지적. AI 역할은
 * 사전 예측이 아니라 실측 추이를 빠르게 캐치해 담당자에게 조기 전달하는 것 — 최종 판단은 항상
 * 담당자 몫(오경보 리스크). 2026-09-22 리셋 — 현재 돌발 강우 신호 없음(평시).
 */
export const riverSuddenRainAlert = {
  forecastMm: 5,
  observedMm: 4.2,
  detectedAt: "-",
  trendNote: "최근 특이 신호 없음 — 예보와 실측이 대체로 일치",
  aiNote: "현재 돌발 강우 패턴이 감지되지 않았습니다. 평시 모니터링을 유지합니다.",
  confirmNote: "최종 단계 상향·경보 발령 여부는 반드시 담당자 확인이 필요합니다 (오경보 리스크 고려).",
}

/**
 * 하천×조수 연계 — 레거시시스템 현황 조사 면담(2026-09-07) Q15 근거: "하천수위를 해양 조수
 * 시간과 연계해서 보여주면 좋겠음". 쇠소깍은 하구(감조구간)라 밀물 시간대에 조위가 겹치면
 * 수위가 추가 상승한다. 돈내코는 상류 계곡 구간이라 조수 영향이 없어 대상에서 제외.
 * 2026-09-22 리셋 — 관측·예측 구간 모두 평시 수위로 낮춤(정상 상태 참고용).
 */
export const riverTideCorrelation = {
  location: "효돈천(쇠소깍) — 감조구간",
  note: "쇠소깍은 하구에 위치해 밀물 시간대에 조위가 겹치면 수위가 소폭 상승합니다. 상류 돈내코 구간은 조수 영향이 없습니다.",
  boundaryLevelM: 3.0,
  nextHighTide: "15:10 예상 (조위 +1.35m)",
  series: [
    { time: "06:00", waterLevelM: 0.95, tideLevelM: 0.1, predicted: false },
    { time: "06:30", waterLevelM: 0.98, tideLevelM: 0.35, predicted: false },
    { time: "07:00", waterLevelM: 1.0, tideLevelM: 0.62, predicted: false },
    { time: "07:30", waterLevelM: 1.02, tideLevelM: 0.85, predicted: false },
    { time: "08:00", waterLevelM: 1.03, tideLevelM: 1.05, predicted: false },
    { time: "08:30", waterLevelM: 1.05, tideLevelM: 1.2, predicted: false },
    { time: "09:00", waterLevelM: 1.06, tideLevelM: 1.32, predicted: true },
    { time: "09:30", waterLevelM: 1.05, tideLevelM: 1.28, predicted: true },
    { time: "10:00", waterLevelM: 1.02, tideLevelM: 1.0, predicted: true },
    { time: "10:30", waterLevelM: 1.0, tideLevelM: 0.6, predicted: true },
    { time: "11:00", waterLevelM: 0.98, tideLevelM: 0.25, predicted: true },
  ] as RiverTidePoint[],
}

/**
 * 실측 데이터 — 국립해양조사원(KHOA) 조위관측소 실시간 API(data.go.kr, obsCode DT_0023, 모슬포).
 * jeju-lowsalinity-warning 프로젝트의 실연동 커넥터로 2026-09-09 확인한 실제 응답을 그대로 캡처한
 * 스냅샷(정적 프로토타입이라 재조회 없음). 모슬포는 서귀포시 대정읍 소재로, 위 riverTideCorrelation이
 * 다루는 효돈천 쇠소깍(하효동)과는 다른 지점(직선거리 약 25km)입니다 — 같은 관측소가 아니므로
 * 쇠소깍 차트에 합치지 않고, 제주 남부 실측 조위 흐름을 보여주는 참고 데이터로 별도 표기합니다.
 * 실제 서비스 데이터이므로 2026-09-22 리셋 대상에서 제외 — 값을 임의로 바꾸지 말 것.
 */
export const khoaMoseulpoTide = {
  stationName: "모슬포",
  stationCode: "DT_0023",
  location: "서귀포시 대정읍",
  distanceNote: "효돈천 쇠소깍(하효동)과는 다른 지점 — 직선거리 약 25km, 조수 흐름 참고용",
  series: [
    { time: "08:00", tideLevelCm: 250 },
    { time: "09:00", tideLevelCm: 258 },
    { time: "10:00", tideLevelCm: 246 },
    { time: "11:00", tideLevelCm: 216 },
    { time: "12:00", tideLevelCm: 175 },
    { time: "13:00", tideLevelCm: 130 },
    { time: "14:00", tideLevelCm: 95 },
    { time: "15:00", tideLevelCm: 76 },
  ],
  observedAt: "2026-09-09 15:00",
}

export const riverImpact = {
  area: "해당 없음 (평시)",
  population: "해당 없음",
  facilities: "해당 없음",
  evacuationRoutes: "2개 경로 상시 가용",
}

export const riverCctv = [
  { id: "c1", label: "효돈천 돈내코", time: "08:58:00", detected: "이상 없음", quality: "양호" },
  { id: "c2", label: "효돈천 쇠소깍", time: "08:58:20", detected: "이상 없음", quality: "양호" },
]

export const riverSensorCheck = [
  { id: "s1", name: "수위 센서 #HD-01 (돈내코)", status: "정상" as const, value: "1.02 m", detail: "레이더 수위 비교 ±0.02 m" },
  { id: "s2", name: "수위 센서 #HD-02 (쇠소깍)", status: "정상" as const, value: "1.05 m", detail: "최종 수신 09:00 (실시간)" },
]

export const riverDataConfidence = {
  rain: "높음",
  waterLevel: "높음",
  radar: "높음",
  video: "높음",
  overall: "높음 (94%)",
  note: "전 센서 정상 수신 중",
}

/**
 * 경보 발송(/river/alert) — 2026-09-22 리셋: 현재 발령된 경보가 없는 평시 상태. level이
 * RiskBadge 색상을 결정한다(이전에는 "danger" 하드코딩으로 평시에도 빨간 배지가 떴음).
 */
export const riverAlertDispatch = {
  stage: "0단계 · 정상 (발령 없음)",
  level: "safe" as const,
  title: "현재 발령된 경보 없음",
  target: "해당 없음",
  targetDetail: "평시 — 발송 대상 없음",
  sentAt: "-",
  rivers: "효돈천(돈내코·쇠소깍)",
  district: "서귀포시 하효동·상효동",
  approver: "-",
  message: "정상 단계 — 현재 발령된 경보가 없습니다.",
  channels: [
    { id: "ch1", name: "문자 (CBS/SMS)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch2", name: "모바일 앱 푸시", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch3", name: "현장 단말 (무선)", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-" },
    { id: "ch4", name: "상황판 방송", sent: 0, success: 0, fail: 0, rate: "-", lastSent: "-", unit: "개소" },
  ],
  totalFail: 0,
}

export const riverControlRows: RiverControlRow[] = [
  { id: "r1", river: "효돈천(쇠소깍)", stage: "정상 감시 중", location: "서귀포시 하효동 쇠소깍 일원", gate: "정상 작동", dispatch: "완료", ack: "확인" },
  { id: "r2", river: "효돈천(돈내코)", stage: "정상 감시 중", location: "서귀포시 상효동 돈내코 계곡", gate: "정상 작동", dispatch: "완료", ack: "확인" },
]

export const riverControlFailures: { id: string; title: string; time: string; cause: string; action: string }[] = []

export const riverPropagation = [
  { id: "p1", channel: "문자(CBS)", status: "최근 발송 없음" },
  { id: "p2", channel: "제주 AX 앱 푸시", status: "최근 발송 없음" },
  { id: "p3", channel: "현장 단말", status: "최근 발송 없음" },
  { id: "p4", channel: "상황판", status: "평시 화면 표시 중" },
]

export const riverControlTimeline: TimelineEntry[] = [
  { id: "ct1", time: "09:00", title: "상시 모니터링 중 — 이상 없음" },
]

export const riverJointAgencies = [
  { id: "j1", agency: "제주도청 재난안전과", status: "평시 대기" },
  { id: "j2", agency: "서귀포시 상황실", status: "평시 대기" },
  { id: "j3", agency: "소방서 (서귀포)", status: "평시 대기" },
  { id: "j4", agency: "경찰서 (서귀포시)", status: "평시 대기" },
]

/**
 * 출동 요청(/river/dispatch) — 2026-09-22 리셋: 현재 출동 요청 없음(평시). level이 RiskBadge
 * 색상을 결정한다(이전에는 "alert" 하드코딩).
 */
export const riverDispatchRequest = {
  target: "해당 없음 (평시 감시 중)",
  stage: "정상 상태 · 출동 불필요",
  level: "safe" as const,
  eta: "해당 없음",
  impact: "해당 없음",
  requestedAt: "-",
  requester: "-",
  analysis: [
    "현재 위험 신호 없음",
    "정기 모니터링 지속 중",
  ],
  process: [
    { id: "pr1", time: "09:00", title: "정기 점검 완료 — 이상 없음" },
  ] as TimelineEntry[],
}

/**
 * 종료 보고서(/river/closure) — 지난 사례 예시. 오늘(2026-09-22) 진행 중인 사건이 아니라, 2차년도
 * 실증에서 있었던 범람 대응 사례를 "종료 보고서가 어떤 형태인지" 보여주기 위한 참고용으로 남겨둠.
 */
export const riverClosure = {
  caseId: "RIV-2026-0904",
  title: "효돈천(쇠소깍) 범람 대피 대응 (지난 사례)",
  status: "종료 완료",
  confirmedBy: "재난대응1팀 김재난 · 2026-09-04 16:23",
  type: "하천 범람 위험 · 2단계 대피",
  location: "서귀포시 효돈천 쇠소깍 일원",
  duration: "2시간 18분",
  durationDetail: "최초 감지 14:05 → 종료 승인 16:23",
  agencies: "소방·경찰 출동 완료 · 도청 상황실 공동 대응",
  agencyDetail: "총 대응 기관 4개소",
  aiSummary: [
    { id: "as1", label: "범람 예측 정확도", value: "예측 대비 실측 오차 −0.2m (과대 예측)" },
    { id: "as2", label: "수위 회복 확인", value: "3.82m → 2.10m (대피 기준 이하)" },
  ],
  observed: [
    { id: "ob1", label: "최고 수위(관측)", value: "3.9m (14:32)" },
    { id: "ob2", label: "누적 강우량", value: "112mm (6시간)" },
  ],
  closureConditions: [
    "수위 대피 기준(1.5m) 이하로 30분 이상 유지",
    "차단기·현장 통제 조치 정상 복구 완료",
    "출동 기관 전원 철수 확인",
    "센서·CCTV 정상 운용 복구",
  ],
  report: {
    department: "제주특별자치도 재난안전대책본부",
    sop: "e-SOP R-2 하천 범람 종료 절차 v1.8",
    casualties: "없음",
    property: "없음 (추정)",
    lesson: "쇠소깍 차단기 통신 두절 재발 방지 위해 LTE 음영구역 보강 필요",
  },
}
