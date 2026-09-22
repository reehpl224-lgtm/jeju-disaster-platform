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
import type { RiskLevel } from "../types/domain"

/**
 * 2026-09-22 리셋 — 사용자 요청으로 더미 "진행 중 사건" 데이터를 초기화하고, 파트별 케이스
 * 프로토타입의 첫 사례로 "저염분수 관심(1단계) 단계 — 확인→대응→조치→처리" 흐름을 새로 구성함.
 * 실제 API 연동 데이터(khoaLiveObservations)는 그대로 두고 건드리지 않음.
 * 케이스: 한경 용수 인근 관측지점에서 염분이 관심 구간(28.0~30.0psu)까지 하락 — 아직 경보 발령
 * 전 단계로, TP-P22_002 데이터 리스트의 관심 단계 행동요령("비상 대응 장비 점검 및 어장 예찰
 * 활동 강화")에 맞춰 "내부 점검·예찰" 중심으로 구성했고, 아직 대외 경보는 발송하지 않았다.
 */
export const aquaSummary = {
  lastUpdated: "09:15",
  targetArea: "제주 서남부 한경·대정 육상양식장",
  spatialResolution: "1km 이하",
  aiLabels: ["Low_Salinity_Plume", "High_Temp_Water"],
  /** 염분 단독 기준 5단계 — marineAlertThresholds.ts classifySalinity()와 반드시 일치시킬 것 */
  salinityLevels: [
    { level: "safe", label: "정상", range: "30.0 psu 이상" },
    { level: "caution", label: "관심", range: "28.0 이상 ~ 30.0 psu 미만" },
    { level: "warning", label: "주의", range: "26.0 이상 ~ 28.0 psu 미만" },
    { level: "alert", label: "경계(경보)", range: "24.0 이상 ~ 26.0 psu 미만" },
    { level: "danger", label: "심각", range: "24.0 psu 미만" },
  ] as { level: RiskLevel; label: string; range: string }[],
  /** 복합(수온+염분) 승격 규칙 — 단순 "한 단계 승격"이 아니라 조건별로 도달 단계가 다르므로 정확히 표기.
   *  marineAlertThresholds.ts의 combinedOverride()와 반드시 일치시킬 것 */
  combinedRuleNote:
    "수온 28.0℃ 이상 동반 시: 염분 26.0 이하→심각 / 염분 28.0 이하→경계 이상. 수온 26.0~28.0℃면 염분 28.0 이하→주의 이상으로 승격",
  /** 수온 단독 기준 5단계 — marineAlertThresholds.ts classifyTemperature()와 반드시 일치시킬 것.
   *  28.0℃ 이상 구간은 값 자체가 아니라 지속일수로 주의/경계/심각이 갈리므로 range에 지속일수를 함께 표기 */
  temperatureLevels: [
    { level: "safe", label: "정상", range: "25.0℃ 이하" },
    { level: "caution", label: "관심", range: "25.1 ~ 27.9℃" },
    { level: "warning", label: "주의", range: "28.0℃ 이상 (당일 도달)" },
    { level: "alert", label: "경계", range: "28.0℃ 이상 1~2일 지속" },
    { level: "danger", label: "심각", range: "28.0℃ 이상 3일 이상 지속" },
  ] as { level: RiskLevel; label: string; range: string }[],
  // 케이스: 한경 용수 인근 저염분수 관심 1건 — 고수온 동반 없음
  activeRisk: { count: 1, detail: "저염분수 관심 1건 (한경 용수 인근)" },
  // 관심 단계는 대외 경보 승인 절차가 필요 없음(TP-P22_002 관심 행동요령 = 내부 장비 점검·예찰) — 승인 대기 없음
  pendingApproval: { count: 0, detail: "승인 대기 없음 — 관심 단계는 내부 점검 중" },
  /** 아쿠아팜스 페이지(aquaFarmTotals)와 반드시 같은 수치를 쓸 것 — 총량이 화면마다 다르면 담당자가 신뢰 못함 */
  affectedFarms: { count: 3, detail: "관심 3 (심각·경계·주의 없음)" },
  /** aquaDataSources 품질점수 평균(null 제외) — 소스가 바뀌면 이 값도 다시 계산할 것 */
  dataQuality: { percent: 93, detail: "전체 소스 평균" },
}

export const aquaJourneys = [
  { id: "data", label: "데이터 수집", desc: "전체 5개 소스 · 정상 4 · 지연 1", href: "/aqua/data" },
  { id: "prediction", label: "AI 예측", desc: "관심 1등급 · 예측 신뢰도 87%", href: "/aqua/prediction" },
  { id: "farms", label: "영향 양식장", desc: "3개소 관심권 · 전일 대비 +1개소", href: "/aqua/farms" },
  { id: "alerts", label: "경보 승인", desc: "관심 단계 · 대외 경보 미발령(내부 점검 중)", href: "/aqua/alerts" },
  { id: "response", label: "e-SOP 대응", desc: "1단계 관심 · 점검 항목 2건 진행 중", href: "/aqua/response" },
  { id: "monitoring", label: "실시간 모니터링", desc: "표층 수온 24.6℃ · 염분 29.4psu", href: "/aqua/monitoring" },
]

/**
 * 실측 데이터 — 국립해양조사원(KHOA) 실시간 해양관측 공공데이터 API(data.go.kr) 실연동 완료.
 * `jeju-lowsalinity-warning` 파이프라인 프로젝트(collection-status-feature 작업분)에서 발급받은
 * 서비스키로 2026-09-09 확인한 실제 API 응답값을 그대로 캡처한 스냅샷입니다(이 앱은 정적
 * 프로토타입이라 실시간 재조회는 하지 않음 — 값을 바꾸려면 API를 다시 호출해 갱신해야 함).
 * 해양관측부이 API(TW_0075·KG_0021·KG_0028) + 조위관측소 API(DT_0023, 모슬포) 기준.
 * 실제 서비스 데이터이므로 2026-09-22 리셋 대상에서 제외 — 값을 임의로 바꾸지 말 것.
 */
export const khoaLiveObservations: {
  id: string
  stationName: string
  stationCode: string
  kind: "해양관측부이" | "조위관측소"
  lat: number
  lng: number
  seaTempC: number
  salinityPsu: number
  /** 유향(deg)·유속(cm/s) — 저염분수/고수온수 확산 방향 참고. 관측소별로 결측(null)일 수 있음 */
  currentDirDeg?: number
  currentSpeedCms?: number
  observedAt: string
}[] = [
  { id: "khoa-tw0075", stationName: "중문해수욕장", stationCode: "TW_0075", kind: "해양관측부이", lat: 33.2345, lng: 126.40955, seaTempC: 27.22, salinityPsu: 26.82, observedAt: "2026-09-09 15:00" },
  { id: "khoa-kg0021", stationName: "제주남부", stationCode: "KG_0021", kind: "해양관측부이", lat: 32.09041, lng: 126.96586, seaTempC: 27.76, salinityPsu: 32.80, currentDirDeg: 115, currentSpeedCms: 21.2, observedAt: "2026-09-09 14:00" },
  { id: "khoa-kg0028", stationName: "제주해협", stationCode: "KG_0028", kind: "해양관측부이", lat: 33.70011, lng: 126.5905, seaTempC: 26.93, salinityPsu: 30.47, currentDirDeg: 115, currentSpeedCms: 81.8, observedAt: "2026-09-09 14:00" },
  { id: "khoa-dt0023", stationName: "모슬포", stationCode: "DT_0023", kind: "조위관측소", lat: 33.21444, lng: 126.25111, seaTempC: 26.6, salinityPsu: 30.6, observedAt: "2026-09-09 15:00" },
]

export const aquaDataSources: AquaDataSource[] = [
  {
    id: "s1",
    name: "해양관측부이 (국립해양조사원 KHOA API)",
    detail: "중문·제주남부·제주해협 3개소 — 실시간 수온·염분",
    updatedAt: "09:00",
    cycle: "1시간",
    status: "normal",
    qualityScore: 99,
    note: "data.go.kr 공공API 실연동 완료 (2026-09-09 확인)",
  },
  { id: "s2", name: "위성 (GOCI-II — 해색·저염분 추적)", detail: "해색·염분 추정", updatedAt: "06:20", cycle: "6시간", status: "normal", qualityScore: 93, note: "구름량 8%" },
  { id: "s3", name: "위성 (SMAP — 해면 염분)", detail: "해면 염분 관측", updatedAt: "08:10", cycle: "1~3일", status: "normal", qualityScore: 90, note: "회의(2026-09-15) 학습 데이터 소스 기준" },
  { id: "s4", name: "해양 수치모델 (ROMS)", detail: "해양순환 수치예측 (2020~2025 Hindcast)", updatedAt: "08:00", cycle: "6시간", status: "normal", qualityScore: 96, note: "실증사 발표자료 기준 — 회의록의 RAMS 표기를 ROMS로 정정" },
  { id: "s5", name: "해양 수치모델 (NEMO)", detail: "해양 순환 수치예측", updatedAt: "전일 24:00", cycle: "24시간", status: "delayed", qualityScore: 88, note: "최신 산출물 갱신 지연" },
]

export const aquaDataIssues: AquaDataIssue[] = [
  { id: "i2", type: "delayed", title: "해양 수치모델 (NEMO)", cause: "최신 산출물 갱신 지연", impact: "예측 학습·검증에 쓰는 순환장 데이터 최신성 저하" },
]

export const aquaActionLog: AquaActionLogEntry[] = [
  { id: "a1", time: "08:52", title: "한경 용수 인근 염분 관심 구간 진입 감지", owner: "시스템 자동 판정", action: "AI 자동 관심 단계 판정 · 담당자 확인 대기", status: "진행 중" },
  { id: "a2", time: "08:40", title: "NEMO 산출물 갱신 지연 감지", owner: "시스템 자동 경고", action: "수치모델 수집 파이프라인 점검 요청", status: "진행 중" },
  { id: "a3", time: "09:00", title: "해양관측부이 KHOA API 연동 확인", owner: "관리자", action: "실시간 수신 정상 확인 (중문·제주남부·제주해협)", status: "완료" },
]

/**
 * AI 예측 결과 대시보드(/aqua/prediction) 상단 카드 — riskLevel이 RiskBadge 색상을 결정한다
 * (이전에는 페이지 코드에 "danger"가 하드코딩돼 있어 실제 등급과 무관하게 항상 빨간 배지가
 * 떴던 문제를 2026-09-22에 함께 고침).
 */
export const aquaRiskState = {
  level: "관심 [1등급]",
  riskLevel: "caution" as RiskLevel,
  headline: "저염분수 한경 용수 인근 접근 확인 (관심 단계)",
  confidence: 84,
  updatedAt: "09:15",
  lowSalinity: { eta: "D+3 / 72시간 후", riskLevel: "caution" as RiskLevel, time: "2026-09-25 09:00", location: "한경면 용수리 해역 인근" },
  highTemp: { eta: "해당 없음", riskLevel: "safe" as RiskLevel, time: "-", location: "고수온 동반 신호 없음" },
  affectedFarmCount: 3,
  affectedFarmDelta: "전일 대비 +1개소",
}

export const aquaModelConfidence: AquaModelConfidence[] = [
  { id: "m1", name: "HYCOM 모델", percent: 88 },
  { id: "m2", name: "ROMS 모델", percent: 85 },
  { id: "m3", name: "위성 관측 보정", percent: 90 },
  { id: "m4", name: "현장 부이 관측", percent: 86 },
]

export const aquaQualityMetrics: AquaQualityMetric[] = [
  { id: "q1", name: "위성 SST", level: "safe", percent: 98, note: "수신 지연 없음" },
  { id: "q2", name: "해양 부이 수온", level: "safe", percent: 96, note: "국립해양조사원 KHOA API · 최근 수신 09:00" },
  { id: "q3", name: "현장 염분 관측", level: "caution", percent: 82, note: "우도 부이 미수신 1시간" },
  { id: "q4", name: "강우·하천 유량", level: "safe", percent: 97, note: "최근 수신 09:10" },
]

/**
 * 영향 양식장(관심 단계 3개소) — 확정 관측지점 3곳(한경 금등·한경 용수·대정 일과, AGENTS.md §2-①)
 * 중 한경 용수 인근에서 감지된 저염분수 신호가 인근 양식장으로 번지는 초기 단계를 보여준다.
 * 2026-09-22: 이전 "심각" 사건 더미데이터를 리셋하고 관심 단계 케이스로 전면 재구성함 — 대표
 * 사례 3건이 곧 전체(aquaFarmTotals.total=3)이며, 숨겨진 양식장은 없음.
 */
export const aquaFarms: AquaFarm[] = [
  { id: "f1", name: "한경 용수 미역 양식장", region: "한경면 용수리", species: "미역·톳", level: "caution", riskType: "저염분수 관심", etaHours: 60, salinity: 29.4 },
  { id: "f2", name: "대정 무릉 해삼 양식장", region: "대정읍 무릉리", species: "해삼·전복", level: "caution", riskType: "저염분수 관심", etaHours: 72, salinity: 29.8 },
  {
    id: "f3",
    name: "한경 조수 1호 양식장",
    region: "제주시 한경면 조수리",
    species: "전복 / 넙치",
    level: "caution",
    riskType: "저염분수 관심",
    etaHours: 54,
    salinity: 29.1,
    temperature: 23.8,
    manager: "김○○ (010-****-1234)",
    phone: "010-****-1234",
    area: "2.4 ha",
    registeredAt: "2019-03-15",
  },
]

export const aquaFarmTotals = { total: 3, danger: 0, alert: 0, warning: 0, caution: 3 }

/**
 * 경보 초안(/aqua/alerts) — 관심 단계는 TP-P22_002 행동요령상 "비상 대응 장비 점검 및 어장 예찰
 * 활동 강화"이며 대외 경보 발송 대상이 아니다. 그래서 초안은 "작성됨"이지만 승인 요청 전 단계로
 * 유지하고, 실제로는 어가 대상 경보를 아직 보내지 않은 상태를 보여준다 — 담당자가 상황을 지켜보며
 * 필요 시(주의 단계 진입 시) 바로 이어서 진행할 수 있도록 준비만 해둔 것.
 */
export const aquaAlertDraft = {
  region: "한경면 용수리 일원",
  riskType: "저염분수",
  grade: "관심",
  riskLevel: "caution" as RiskLevel,
  scope: "한경면 용수리 인근 양식장",
  effectiveAt: "미발효 (내부 점검 단계)",
  validFor: "-",
  // aquaStages 5단계 번호체계(관심1·주의2·경계3·심각4·해제5) 기준
  currentGrade: "관심 (1단계)",
  affectedFarms: 3,
  affectedPopulation: "해당 없음 (대외 경보 미발령)",
  eta: "해당 없음",
  affectedArea: "한경면 용수리 인근 해역",
  channels: ["문자(CBS·SMS)", "재난안전앱", "현장 단말", "상황판"],
  smsTarget: 0,
  appTarget: 0,
  fieldDevices: 0,
  boards: "대기 (미발송)",
  confidence: 84,
  satelliteMatch: "확인됨",
  fieldDelta: "±0.2 psu",
  approvalSteps: [
    { id: "d1", stage: "작성", owner: "이해양", time: "08:55" },
    { id: "d2", stage: "1차 검토", owner: "-", time: "대기 중" },
    { id: "d3", stage: "승인 요청", owner: "-", time: "미착수 (관심 단계는 내부 점검 우선)" },
    { id: "d4", stage: "최종 승인", owner: "-", time: "미완료" },
  ],
  audit: [
    { id: "au1", time: "08:52", title: "관심 단계 자동 판정 — 시스템" },
    { id: "au2", time: "08:55", title: "경보 초안 작성 (미발송) — 이해양" },
    { id: "au3", time: "09:05", title: "근거 데이터 첨부 — 시스템" },
  ] as AquaTimelineEntry[],
}

/**
 * e-SOP 대응(/aqua/response) 현재 상황 카드 — riskLevel이 RiskBadge 색상을 결정한다
 * (이전에는 "danger" 하드코딩으로 관심 단계에서도 빨간 배지가 떴음, 2026-09-22 수정).
 */
export const aquaResponseState = {
  title: "저염분수 관심 — 한경 용수 인근",
  level: "관심",
  riskLevel: "caution" as RiskLevel,
  // aquaStages 5단계 번호체계(관심1·주의2·경계3·심각4·해제5) 기준
  grade: "1단계 / 관심",
  location: "한경면 용수리 인근 해역 · 영향 양식장 3개소",
  detectedAt: "2026-09-22 08:52",
  eta: "D+3 / 72시간 후",
  salinity: "29.4 psu / 정상 기준 30.0 psu",
  temperature: "24.6 °C / 정상 기준 25.0 °C",
  radius: "약 0.6 km",
}

// aquaResponseState.grade("1단계/관심")와 항상 같은 현재 단계를 가리켜야 함
export const aquaStages: AquaStage[] = [
  { step: 1, label: "관심", status: "진행 중" },
  { step: 2, label: "주의", status: "대기" },
  { step: 3, label: "경계", status: "대기" },
  { step: 4, label: "심각", status: "대기" },
  { step: 5, label: "해제", status: "대기" },
]

/**
 * 관심 단계 체크리스트 — TP-P22_002 행동요령("비상 대응 장비 점검 및 어장 예찰 활동 강화")을
 * 구체적인 점검 항목으로 풀어썼다. 심각 단계의 "긴급 회수·조기 출하 지원"과 달리 아직은
 * 예방 점검 성격의 조치만 있음 — 2026-09-22 관심 단계 케이스로 재구성.
 */
export const aquaChecklist: AquaChecklistItem[] = [
  { id: "c1", label: "예비 센서 세트 점검(파울링·통신 상태)", owner: "최경보", time: "09:05", status: "완료" },
  { id: "c2", label: "한경 용수 인근 양식장 예찰 방문 요청", owner: "박통제", time: "09:10", status: "완료" },
  { id: "c3", label: "액화산소 공급 장비 대기 상태 확인", owner: "최경보", time: "-", status: "미완료" },
  { id: "c4", label: "모니터링 주기 단축(1시간 → 30분)", owner: "이해양", time: "-", status: "미완료" },
  { id: "c5", label: "도·서귀포시 상황실 관심 단계 공유", owner: "김재난", time: "-", status: "대기" },
]

export const aquaAgencyRows: AquaAgencyRow[] = [
  { id: "ag1", agency: "제주특별자치도 재난안전과", role: "총괄 모니터링", approve: "-", execute: "확인", receive: "완료" },
  { id: "ag2", agency: "제주시 한경면사무소", role: "한경 용수 현장 예찰", execute: "진행 중", approve: "-", receive: "완료" },
  { id: "ag3", agency: "서귀포시 대정읍사무소", role: "대정 현장 상시 관찰", execute: "대기", approve: "-", receive: "완료" },
  { id: "ag4", agency: "제주특별자치도 해양수산연구원", role: "예측 검증", approve: "-", execute: "진행 중", receive: "완료" },
]

export const aquaMonitoringState = {
  ocean: { label: "양식장 해양환경", value: "표층 수온 24.6°C · 염분 29.4psu", level: "caution" as const, tag: "관심(저염분수 초기 신호)" },
}

export const aquaMonitoringEvents: AquaTimelineEntry[] = [
  { id: "e1", time: "08:52", title: "한경 용수 인근 염분 29.4psu 감지 — AI 관심 단계 자동 판정" },
  { id: "e2", time: "09:05", title: "예비 센서 세트 점검 완료 · 예찰 방문 요청 — 담당자: 최경보" },
  { id: "e3", time: "09:15", title: "현재 관심 단계 유지 중 — 30분 주기 모니터링 강화" },
]

/**
 * 종료 보고서(/aqua/closure) — 오늘(2026-09-22) 진행 중인 관심 단계 케이스가 아니라, 지난주
 * 정상적으로 종료된 관심 단계 사례를 예시로 남겨둔 것이다(날짜가 다름에 주의). 현재 진행 중인
 * 케이스는 아직 종료되지 않았으므로 /aqua/response · /aqua/monitoring에서 진행 상황을 확인할 것.
 */
export const aquaClosureSummary = {
  type: "저염분수 관심 단계 (지난 사례)",
  location: "대정읍 일과리 해역 · 영향 양식장 2개소",
  startedAt: "2026-09-15 07:40",
  endedAt: "2026-09-15 11:20",
  finalGrade: "관심 (1단계) — 정상 회복 해제",
  finalLevel: "safe" as RiskLevel,
  duration: "3시간 40분",
}

export const aquaClosureTimeline: AquaTimelineEntry[] = [
  { id: "ct1", time: "07:40", title: "[탐지] 해양 부이 염분 관심 구간 진입 — 대정읍 일과리 해역" },
  { id: "ct2", time: "07:50", title: "[점검] 예비 센서·액화산소 장비 점검 완료" },
  { id: "ct3", time: "08:30", title: "[예찰] 인근 양식장 2개소 현장 확인 — 이상 없음" },
  { id: "ct4", time: "09:40", title: "[모니터링] 염분 회복 추세 확인 (29.6 → 30.2psu)" },
  { id: "ct5", time: "11:20", title: "[종료] 정상 회복 확인 · 관심 단계 해제 승인 — 담당자 이해양" },
]

export const aquaClosurePrediction = {
  predictedSalinity: "29.5 psu",
  actualSalinity: "29.6 psu",
  error: "+0.1 psu (양호)",
  reasoning: [
    "[위성] GOCI-II 해색 산출물 — 저염분수 확산 범위 국지적(일과리 인근)으로 확인",
    "[부이] 대정 인근 해양관측부이 실측값 정상 수신·교차검증 완료",
    "[모델] HYCOM·ROMS 앙상블 신뢰도 88% — 위성 관측과 일치",
    "[GIS] 영향 반경 약 0.5km — 양식장 2개소 포함, 확산 없음",
  ],
}

export const aquaRetraining = {
  target: "예측·실측 편차 데이터 3건",
  status: "검토 완료 · 반영 대기",
  updatedAt: "2026-09-15 11:30",
}
