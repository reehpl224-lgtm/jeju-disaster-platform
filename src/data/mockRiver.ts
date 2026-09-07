import type { RiverControlRow, RiverStatus, TimelineEntry } from "../types/river"

export const riverTarget = {
  area: "서귀포시 효돈천 (돈내코·쇠소깍)",
  accuracyGoal: "예측 일치율 85% 이상",
  leadTimeGoal: "예보 선행시간 1시간 이하",
  aiLabels: ["Water_Level_High", "Flood_Imminent", "Debris_Flow"],
}

export const riverInfra = {
  newBuild: ["신규 강우레이더 1식", "신규 수위계"],
  legacy: {
    jeju: 66,
    seogwipo: 69,
    total: 135,
    note: "레거시 침수정보센서 연계 (제주시·서귀포시) — 자사 강점 접점",
  },
}

export const riverStatuses: RiverStatus[] = [
  { id: "soesokkak", name: "효돈천(쇠소깍)", level: "alert", stage: "2단계 · 경계", eta: "약 38분 후 (14:22)", updatedAt: "14:08" },
  { id: "donnaeko", name: "효돈천(돈내코)", level: "warning", stage: "1단계 · 주의", eta: "약 1시간 22분 후 (15:06)", updatedAt: "14:07" },
]

export const riverApprovalHistory: TimelineEntry[] = [
  { id: "h1", time: "14:05", title: "1단계 발령 승인 — 승인자: 김OO 재난대응팀장" },
  { id: "h2", time: "13:42", title: "관심 단계 등록 — 시스템 자동 감지" },
  { id: "h3", time: "13:10", title: "강우 임계값 도달 알림 — 자동 알림" },
]

export const riverSopStage = {
  current: "경계 단계 (2단계)",
  next: "다음 절차: 주민 대피 안내 및 도로 통제 요청",
}

export const riverRiskBasis = {
  rainfall: { value: "87.4 mm", detail: "임계값 대비 143%", trend: "↑ 상승 중" },
  waterLevel: { value: "3.82 m", detail: "경계 수위 3.5m 초과", trend: "↑ 급상승" },
  radar: { value: "120분 지속", detail: "90분 내 최고조 예상", confidence: "높음 (87%)" },
  saturation: { value: "94%", detail: "추가 흡수 여력 없음", grade: "매우 높음" },
}

export const riverImpact = {
  area: "약 0.38 km²",
  population: "약 1,240명",
  facilities: "도로 3개소, 주택 지구 1개소",
  evacuationRoutes: "2개 경로 가용",
}

export const riverCctv = [
  { id: "c1", label: "효돈천 돈내코", time: "14:06:38", detected: "확인됨", quality: "양호" },
  { id: "c2", label: "효돈천 쇠소깍", time: "14:07:12", detected: "확인됨", quality: "양호" },
]

export const riverSensorCheck = [
  { id: "s1", name: "수위 센서 #HD-01 (돈내코)", status: "정상" as const, value: "3.82 m", detail: "레이더 수위 비교 ±0.04 m" },
  { id: "s2", name: "수위 센서 #HD-02 (쇠소깍)", status: "이상" as const, value: "데이터 없음", detail: "최종 수신 13:51 (17분 경과)" },
]

export const riverDataConfidence = {
  rain: "높음",
  waterLevel: "부분 (1개 이상)",
  radar: "높음",
  video: "높음",
  overall: "높음 (82%)",
  note: "수위 센서 1개 이상으로 보정값 적용 중",
}

export const riverAlertDispatch = {
  stage: "위험 단계 3",
  title: "하천 범람 위험",
  target: "주민 480명",
  targetDetail: "관광객 포함 추가 1,140명",
  sentAt: "14:32:07",
  rivers: "효돈천(돈내코·쇠소깍)",
  district: "서귀포시 하효동·상효동",
  approver: "김재난 담당관",
  message: "위험 단계 — 효돈천(돈내코·쇠소깍) 범람 위험",
  channels: [
    { id: "ch1", name: "문자 (CBS/SMS)", sent: 5960, success: 5841, fail: 119, rate: "98.0%", lastSent: "14:32:09" },
    { id: "ch2", name: "모바일 앱 푸시", sent: 3210, success: 3198, fail: 12, rate: "99.6%", lastSent: "14:32:11" },
    { id: "ch3", name: "현장 단말 (무선)", sent: 42, success: 39, fail: 3, rate: "92.9%", lastSent: "14:32:15" },
    { id: "ch4", name: "상황판 방송", sent: 18, success: 18, fail: 0, rate: "100%", lastSent: "14:32:20", unit: "개소" },
  ],
  totalFail: 134,
}

export const riverControlRows: RiverControlRow[] = [
  { id: "r1", river: "효돈천(쇠소깍)", stage: "⚠ 경계 2단계", location: "서귀포시 하효동 쇠소깍 일원", gate: "오류 발생", dispatch: "대기 중", ack: "미확인" },
  { id: "r2", river: "효돈천(돈내코)", stage: "⚠ 주의 1단계", location: "서귀포시 상효동 돈내코 계곡", gate: "정상 작동", dispatch: "완료", ack: "확인" },
]

export const riverControlFailures = [
  { id: "f1", title: "쇠소깍 — 차단기 동작 실패", time: "14:22 확인", cause: "현장 단말 통신 두절 (LTE 음영 구역)", action: "권장 대체 조치: 수동 통제 인력 즉시 파견" },
  { id: "f2", title: "쇠소깍 — 출동 미배정", time: "14:25 확인", cause: "가용 인력 부족 (서귀포시 소방 2팀 현장 투입 중)", action: "출동 요청 필요" },
]

export const riverPropagation = [
  { id: "p1", channel: "문자(CBS)", status: "발송 완료 14:10" },
  { id: "p2", channel: "제주 AX 앱 푸시", status: "발송 완료 14:11" },
  { id: "p3", channel: "현장 단말", status: "2건 미전달" },
  { id: "p4", channel: "상황판", status: "갱신 완료 14:12" },
]

export const riverControlTimeline: TimelineEntry[] = [
  { id: "ct1", time: "13:45", title: "주의 1단계 발령 승인" },
  { id: "ct2", time: "14:05", title: "경계 2단계 상향 승인" },
  { id: "ct3", time: "14:10", title: "주민 문자 전파 완료" },
  { id: "ct4", time: "14:12", title: "돈내코 차단기 작동 확인" },
  { id: "ct5", time: "14:22", title: "쇠소깍 차단기 오류 감지" },
  { id: "ct6", time: "14:25", title: "쇠소깍 출동 미배정 확인 — 현재 진행 중" },
]

export const riverJointAgencies = [
  { id: "j1", agency: "제주도청 재난안전과", status: "현장 투입 중" },
  { id: "j2", agency: "서귀포시 상황실", status: "공조 수신 완료" },
  { id: "j3", agency: "소방서 (서귀포)", status: "출동 완료" },
  { id: "j4", agency: "경찰서 (서귀포시)", status: "대기 중" },
]

export const riverDispatchRequest = {
  target: "효돈천 쇠소깍 구간",
  stage: "⚠ 위험 3단계",
  eta: "14:22 (약 18분 후)",
  impact: "인근 주민 80세대 / 관광객 밀집",
  requestedAt: "14:04",
  requester: "김현우 (서귀포시 재난안전과)",
  analysis: [
    "수위 급상승: 현재 3.8m / 경보 기준 4.0m",
    "강우 강도: 42mm/h (최근 30분 평균)",
    "범람 확률: 87% (모델 앙상블)",
    "인접 범람 이력: 2022-08-15, 2019-10-01",
    "GIS 취약 구간: 돈내코 계곡 교량 하부 2개소",
  ],
  process: [
    { id: "pr1", time: "14:01", title: "e-SOP 위험 3단계 자동 발동" },
    { id: "pr2", time: "14:03", title: "담당자 위험 분석 검토 완료" },
    { id: "pr3", time: "14:04", title: "출동 요청 승인 (김현우)" },
    { id: "pr4", time: "14:05", title: "기관별 출동 요청 전송 완료" },
  ] as TimelineEntry[],
}

export const riverClosure = {
  caseId: "RIV-2026-0904",
  title: "효돈천(쇠소깍) 범람 경계 대응",
  status: "종료 완료",
  confirmedBy: "재난대응1팀 김재난 · 2026-09-04 16:40",
  type: "하천 범람 위험 · 경계 2단계",
  location: "서귀포시 효돈천 쇠소깍 일원",
  duration: "2시간 18분",
  durationDetail: "최초 감지 14:05 → 종료 승인 16:23",
  agencies: "소방·경찰 출동 완료 · 도청 상황실 공동 대응",
  agencyDetail: "총 대응 기관 4개소",
  aiSummary: [
    { id: "as1", label: "범람 예측 정확도", value: "예측 대비 실측 오차 −0.2m (과대 예측)" },
    { id: "as2", label: "수위 회복 확인", value: "3.82m → 2.10m (경계 수위 이하)" },
  ],
  observed: [
    { id: "ob1", label: "최고 수위(관측)", value: "3.9m (14:32)" },
    { id: "ob2", label: "누적 강우량", value: "112mm (6시간)" },
  ],
  closureConditions: [
    "수위 경계 기준(3.5m) 이하로 30분 이상 유지",
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
