import type {
  AquaActionLogEntry,
  AquaAgencyRow,
  AquaChecklistItem,
  AquaDataIssue,
  AquaDataSource,
  AquaFarm,
  AquaModelConfidence,
  AquaQualityMetric,
  AquaStage,
  AquaTimelineEntry,
} from "../types/aqua"

export const aquaSummary = {
  lastUpdated: "14:32",
  targetArea: "제주 서남부 한경·대정 육상양식장",
  spatialResolution: "1km 이하",
  aiLabels: ["Low_Salinity_Plume", "High_Temp_Water"],
  salinityThreshold: "25.0 psu 이하",
  activeRisk: { count: 3, detail: "저염분수 1 · 고수온 1 · 복합 1" },
  pendingApproval: { count: 2, detail: "주의 승인 1 · 경보 승인 1" },
  affectedFarms: { count: 17, detail: "고위험 5 · 주의 8 · 관심 4" },
  dataQuality: { percent: 91, detail: "전체 소스 평균" },
}

export const aquaJourneys = [
  { id: "data", label: "데이터 수집", desc: "전체 24개 소스 · 정상 19 · 지연·누락 3 · 오류 2", href: "/aqua/data" },
  { id: "prediction", label: "AI 예측", desc: "고위험 3등급 · 예측 신뢰도 87%", href: "/aqua/prediction" },
  { id: "farms", label: "영향 양식장", desc: "17개소 위험권 · 전일 대비 +3개소", href: "/aqua/farms" },
  { id: "alerts", label: "경보 승인", desc: "경계 3단계 · 승인 요청 대기 중", href: "/aqua/alerts" },
  { id: "response", label: "e-SOP 대응", desc: "2단계 주의 · 조치 2건 진행 중", href: "/aqua/response" },
  { id: "monitoring", label: "실시간 모니터링", desc: "표층 수온 28.6℃ · 염분 24.8psu", href: "/aqua/monitoring" },
]

export const aquaDataSources: AquaDataSource[] = [
  { id: "s1", name: "해수온 부이 — 제주 북부·남부", detail: "표층 수온·염분 관측", updatedAt: "14:30", cycle: "10분", status: "error", qualityScore: 41, note: "이상값 다수 포함" },
  { id: "s2", name: "위성 영상 (Sentinel-2 — 저염분 추적)", detail: "해색·염분 추정", updatedAt: "06:20", cycle: "6시간", status: "normal", qualityScore: 93, note: "구름량 12%" },
  { id: "s3", name: "AI CCTV 탐지 메타데이터 — 연안 6개소", detail: "위험행동 탐지", updatedAt: "14:49", cycle: "실시간", status: "delayed", qualityScore: 82, note: "마지막 수신 14분 경과" },
  { id: "s4", name: "수위 센서 — 효돈천(돈내코·쇠소깍)", detail: "하천 수위", updatedAt: "14:50", cycle: "1분", status: "normal", qualityScore: 95, note: "누락 0건" },
  { id: "s5", name: "강우 레이더 (기상청 API)", detail: "강수량", updatedAt: "14:52", cycle: "5분", status: "normal", qualityScore: 98, note: "누락 0건" },
  { id: "s6", name: "GIS 레이어 — 침수 예측 격자", detail: "침수 예측", updatedAt: "14:45", cycle: "10분", status: "normal", qualityScore: 97, note: "누락 0건" },
  { id: "s7", name: "현장 수동 관측 — 도청·서귀포시", detail: "강우·수위 교차검증", updatedAt: "13:00", cycle: "1시간", status: "missing", qualityScore: null, note: "금일 2회차 미수신" },
]

export const aquaDataIssues: AquaDataIssue[] = [
  { id: "i1", type: "error", title: "해수온 부이 — 제주 북부", cause: "센서 하드웨어 오류 추정, 이상값 연속 발생", impact: "저염분·고수온 예측 모델 입력값 부재 → 예측 신뢰도 저하" },
  { id: "i2", type: "delayed", title: "AI CCTV — 연안 6개소", cause: "네트워크 지연 (현재 14분 경과)", impact: "연안 위험행동 탐지 메타데이터 공백" },
  { id: "i3", type: "missing", title: "현장 수동 관측 — 도청", cause: "2회차 수동 입력 미완료", impact: "강우·수위 교차검증 데이터 부족" },
]

export const aquaActionLog: AquaActionLogEntry[] = [
  { id: "a1", time: "14:51", title: "강우 레이더 정상 복구 확인", owner: "김철수", action: "자동 재연결 성공", status: "완료" },
  { id: "a2", time: "14:38", title: "AI CCTV 지연 감지 (임계 10분 초과)", owner: "시스템 자동 경고", action: "네트워크 점검 요청", status: "진행 중" },
  { id: "a3", time: "14:32", title: "해수온 부이 오류 알림 발송", owner: "이영희", action: "현장 점검 연락 완료", status: "진행 중" },
  { id: "a4", time: "13:05", title: "현장 관측 미수신 1회차 기록", owner: "박지훈", action: "담당 기관 유선 연락", status: "완료" },
]

export const aquaRiskState = {
  level: "고위험 [3등급]",
  headline: "저염분수 제주 서부 해역 접근 확인",
  confidence: 87,
  updatedAt: "14:32",
  lowSalinity: { eta: "D-2 / 16시간 후", time: "2026-09-06 06:00", location: "한경면 해역 1.2km 전방" },
  highTemp: { eta: "D-4 / 38시간 후", time: "2026-09-08 04:00", location: "대정읍 해역 남서 방향 진행" },
  affectedFarmCount: 17,
  affectedFarmDelta: "전일 대비 +3개소 추가",
}

export const aquaModelConfidence: AquaModelConfidence[] = [
  { id: "m1", name: "HYCOM 모델", percent: 89 },
  { id: "m2", name: "ROMS 모델", percent: 85 },
  { id: "m3", name: "위성 관측 보정", percent: 91 },
  { id: "m4", name: "현장 부이 관측", percent: 82 },
]

export const aquaQualityMetrics: AquaQualityMetric[] = [
  { id: "q1", name: "위성 SST", level: "safe", percent: 98, note: "수신 지연 없음" },
  { id: "q2", name: "해양 부이 수온", level: "safe", percent: 94, note: "최근 수신 14:28" },
  { id: "q3", name: "현장 염분 관측", level: "caution", percent: 71, note: "우도 부이 미수신 2시간" },
  { id: "q4", name: "강우·하천 유량", level: "safe", percent: 96, note: "최근 수신 14:25" },
]

export const aquaFarms: AquaFarm[] = [
  { id: "f1", name: "한경 금등 전복 양식장", region: "한경면 금등리", species: "전복·소라", level: "danger", riskType: "저염분수+고수온", etaHours: 18, salinity: 24.1, temperature: 30.2 },
  { id: "f2", name: "대정 일과 넙치 양식장", region: "대정읍 일과리", species: "넙치", level: "danger", riskType: "고수온", etaHours: 20, temperature: 30.5 },
  { id: "f3", name: "한경 용수 미역 양식장", region: "한경면 용수리", species: "미역·톳", level: "warning", riskType: "저염분수", etaHours: 28, salinity: 24.9 },
  { id: "f4", name: "한경 신창 광어 양식장", region: "한경면 신창리", species: "광어", level: "warning", riskType: "고수온", etaHours: 32, temperature: 29.6 },
  { id: "f5", name: "대정 무릉 해삼 양식장", region: "대정읍 무릉리", species: "해삼·전복", level: "caution", riskType: "저염분수", etaHours: 48, salinity: 25.4 },
  { id: "f6", name: "대정 영락 돌돔 양식장", region: "대정읍 영락리", species: "돌돔", level: "caution", riskType: "복합", etaHours: 52, salinity: 25.6, temperature: 29.1 },
  {
    id: "f7",
    name: "한경 조수 1호 양식장",
    region: "제주시 한경면 조수리",
    species: "전복 / 넙치",
    level: "caution",
    riskType: "저염분수 유입 예측",
    etaHours: 12,
    salinity: 24.5,
    temperature: 24.2,
    manager: "김○○ (010-****-1234)",
    phone: "010-****-1234",
    area: "2.4 ha",
    registeredAt: "2019-03-15",
  },
]

export const aquaFarmTotals = { total: 24, danger: 6, warning: 9, caution: 9 }

export const aquaAlertDraft = {
  region: "제주시 전체",
  riskType: "저염분수",
  grade: "관심",
  scope: "해당 읍·면",
  effectiveAt: "즉시 발효",
  validFor: "3시간",
  currentGrade: "⚠ 경계 (3단계)",
  affectedFarms: 14,
  affectedPopulation: "약 2,300명",
  eta: "15:50 (약 88분 후)",
  affectedArea: "한경 ~ 대정 연안",
  channels: ["문자(CBS·SMS)", "재난안전앱", "현장 단말", "상황판"],
  smsTarget: 1842,
  appTarget: 976,
  fieldDevices: 23,
  boards: "도·서귀포 2개소",
  confidence: 87,
  satelliteMatch: "확인됨",
  fieldDelta: "±0.3°C",
  approvalSteps: [
    { id: "d1", stage: "작성", owner: "김재난", time: "14:05" },
    { id: "d2", stage: "1차 검토", owner: "이담당", time: "14:18" },
    { id: "d3", stage: "승인 요청", owner: "-", time: "대기 중" },
    { id: "d4", stage: "최종 승인", owner: "-", time: "미완료" },
  ],
  audit: [
    { id: "au1", time: "14:05", title: "경보 초안 작성 — 김재난" },
    { id: "au2", time: "14:12", title: "근거 데이터 첨부 — 시스템" },
    { id: "au3", time: "14:18", title: "1차 내용 검토 완료 — 이담당" },
    { id: "au4", time: "14:22", title: "모델 신뢰도 재확인 — 시스템" },
  ] as AquaTimelineEntry[],
}

export const aquaResponseState = {
  title: "저염분수·고수온 위험 — 한경·대정 해역",
  level: "주의",
  grade: "2단계 / 주의",
  location: "한경·대정 해역 · 영향 양식장 3개소",
  detectedAt: "2026-09-04 09:22",
  eta: "D-2 / 16시간 후",
  salinity: "24.6 psu / 기준 25.0 psu",
  temperature: "29.8 °C / 기준 28.0 °C",
  radius: "약 1.2 km",
}

export const aquaStages: AquaStage[] = [
  { step: 1, label: "관심", status: "완료" },
  { step: 2, label: "주의", status: "진행 중" },
  { step: 3, label: "경계", status: "대기" },
  { step: 4, label: "심각", status: "대기" },
  { step: 5, label: "해제", status: "대기" },
]

export const aquaChecklist: AquaChecklistItem[] = [
  { id: "c1", label: "어가 맞춤 SOP 안내 발송", owner: "최경보", time: "09:46", status: "완료" },
  { id: "c2", label: "먹이 공급 중단 권고 전달", owner: "박통제", time: "09:48", status: "완료" },
  { id: "c3", label: "양식장 현장 점검 요청", owner: "최경보", time: "-", status: "미완료" },
  { id: "c4", label: "어가 알림 앱 푸시 발송", owner: "최경보", time: "발송 실패 09:51", status: "실패" },
  { id: "c5", label: "도·서귀포시 상황실 공유", owner: "김재난", time: "-", status: "대기" },
]

export const aquaAgencyRows: AquaAgencyRow[] = [
  { id: "ag1", agency: "제주특별자치도 재난안전과", role: "총괄 승인", approve: "완료", execute: "완료", receive: "완료" },
  { id: "ag2", agency: "제주시 한경면사무소", role: "한경 현장 안내", execute: "진행 중", approve: "완료", receive: "완료" },
  { id: "ag3", agency: "서귀포시 대정읍사무소", role: "대정 현장 안내", execute: "진행 중", approve: "완료", receive: "완료" },
  { id: "ag4", agency: "제주특별자치도 해양수산연구원", role: "예측 검증", approve: "완료", execute: "완료", receive: "대기" },
]

export const aquaMonitoringState = {
  waterLevel: { label: "하천 수위", value: "효돈천(쇠소깍) +2.4m / 경계 2.0m", level: "danger" as const, tag: "초과" },
  rainfall: { label: "강우량", value: "현재 38mm/h · 1시간 누적 72mm", level: "caution" as const, tag: "기준 초과" },
  coast: { label: "연안 위험", value: "협재 방파제 파고 3.1m", level: "warning" as const, tag: "월파 위험" },
  ocean: { label: "양식장 해양환경", value: "표층 수온 28.6°C · 염분 24.8psu", level: "caution" as const, tag: "저염분수 진입" },
}

export const aquaMonitoringEvents: AquaTimelineEntry[] = [
  { id: "e1", time: "14:28", title: "효돈천(쇠소깍) 수위 경계 초과 감지 — 자동 e-SOP 경계 2단계 진입 · 담당자 확인 대기" },
  { id: "e2", time: "14:20", title: "협재 CCTV — 방파제 진입 2명 탐지 — 현장 경보 실행 · 담당자: 박관제" },
  { id: "e3", time: "14:15", title: "대정 표층 수온 임계값 초과 — e-SOP 주의 1단계 승인 · 담당자: 이해양" },
  { id: "e4", time: "14:08", title: "수위 센서 #7 데이터 품질 저하 — 이중화 센서 전환 완료 · 담당자: 최장비" },
  { id: "e5", time: "13:55", title: "양식장 어가 맞춤 안내 발송 — 수신 확인 34 / 미확인 6 · 재발송 예정" },
]

export const aquaClosureSummary = {
  type: "저염분수·고수온 위험",
  location: "한경·대정 해역 · 영향 양식장 3개소",
  startedAt: "2026-09-04 09:22",
  endedAt: "2026-09-04 14:47",
  finalGrade: "[주의 2등급] 관심 해제",
  duration: "5시간 25분",
}

export const aquaClosureTimeline: AquaTimelineEntry[] = [
  { id: "ct1", time: "09:22", title: "[탐지] 해양 부이 염분 임계값 초과 — 한경면 해역" },
  { id: "ct2", time: "09:35", title: "[경보] e-SOP 주의 단계 승인 — 담당자 이해양" },
  { id: "ct3", time: "10:11", title: "[안내] 어가 맞춤 SOP 안내 발송 완료 (34개소)" },
  { id: "ct4", time: "11:30", title: "[검증] 위성 관측 보정 데이터 반영 · 신뢰도 87%" },
  { id: "ct5", time: "13:15", title: "[모니터링] 염분·수온 회복 추세 확인" },
  { id: "ct6", time: "14:47", title: "[종료] 상황 종료 승인 — 담당자 이해양" },
]

export const aquaClosurePrediction = {
  predictedSalinity: "24.3 psu",
  actualSalinity: "24.9 psu",
  error: "+0.6 psu (과소 예측)",
  reasoning: [
    "[위성] GOCI-II 해색 산출물 — 저염분수 확산 범위 확인",
    "[부이] 한경면 해양관측부이 실측값 정상 수신·교차검증 완료",
    "[모델] HYCOM·ROMS 앙상블 신뢰도 87% — 위성 관측과 일치",
    "[GIS] 영향 반경 약 1.2km — 양식장 3개소 포함",
  ],
}

export const aquaRetraining = {
  target: "예측·실측 편차 데이터 8건",
  status: "검토 중 · 재학습 대기",
  updatedAt: "2026-09-04 15:02",
}
