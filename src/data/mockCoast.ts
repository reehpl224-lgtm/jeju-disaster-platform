import type { CoastAgencyStatus, CoastEvent, CoastFieldAlert, TimelineEntry } from "../types/coast"

export const coastSummary = {
  lastUpdated: "14:32:07",
  targetArea: "함덕·삼양·협재 해수욕장",
  infra: "AIoT 스마트폴 신설 (지능형 CCTV + 기상센서 + 경보스피커)",
  permitNote: "공유수면 점용허가 등 인허가 절차 필요 (스마트폴 신설 구간)",
  aiLabels: ["Person_In_Water", "Danger_Zone_Person", "Rip_Current", "Overtopping"],
  activeEvents: { count: 7, detail: "🔴 고위험 3건 포함" },
  unconfirmedEvents: { count: 4, detail: "⚠ 즉시 검토 필요" },
  coordination: { count: 2, detail: "🔵 해경 출동 1건" },
  equipment: { normal: 18, error: 2, detail: "센서 결측 2건 별도 확인" },
}

export const coastAiInsights = [
  {
    id: "ai1",
    level: "danger" as const,
    title: "익수 의심 — 함덕해수욕장 북서 30m",
    basis: "영상 탐지(Person_In_Water) · AIoT 스마트폴 수온·파고 이상",
    match: "사고 이력 유사도 92%",
  },
  {
    id: "ai2",
    level: "warning" as const,
    title: "이안류 감지 — 삼양해수욕장",
    basis: "해상 센서 유속 급변(Rip_Current)",
    match: "GIS 이안류 위험구역 내 위치",
  },
]

export const coastEvents: CoastEvent[] = [
  { id: "e1", level: "danger", type: "익수 의심", source: "AI CCTV · 스마트폴", location: "함덕해수욕장", time: "14:28", status: "미확인" },
  { id: "e2", level: "danger", type: "위험구역 진입", source: "AI CCTV", location: "삼양해수욕장 방파제", time: "14:15", status: "경보 실행 중" },
  { id: "e3", level: "danger", type: "이안류 감지", source: "해상 센서 · GIS", location: "협재해수욕장 외해", time: "14:09", status: "해경 공조 진행" },
  { id: "e4", level: "warning", type: "이안류 감지", source: "해상 센서", location: "삼양해수욕장", time: "13:55", status: "미확인" },
  { id: "e5", level: "warning", type: "월파 경보", source: "기상 센서 · GIS", location: "협재해수욕장", time: "13:40", status: "현장 경보 완료" },
]

export const coastFieldAlerts: CoastFieldAlert[] = [
  { id: "f1", location: "함덕해수욕장", level: "danger", time: "14:28 발령", detail: "스피커·경광등 작동 중" },
  { id: "f2", location: "삼양해수욕장 방파제", level: "danger", time: "14:15 발령", detail: "현장 단말 수신 확인" },
  { id: "f3", location: "협재해수욕장", level: "warning", time: "13:55 발령", detail: "문자·앱 전파 완료" },
]

export const coastAgencyStatuses: CoastAgencyStatus[] = [
  { id: "a1", agency: "해경 출동", status: "출동 중", detail: "협재 이안류 — 출동 중 (14:12 요청)", level: "info" },
  { id: "a2", agency: "해경 대기", status: "승인 대기", detail: "함덕 익수 — 출동 대기 승인 대기", level: "caution" },
  { id: "a3", agency: "소방 대기", status: "현장 접수", detail: "삼양 방파제 — 현장 접수 완료", level: "offline" },
]

export const coastEventDetail = {
  id: "EVT-2025-0714-003",
  level: "danger" as const,
  status: "탐지 중",
  type: "방파제 무단진입 · 익수 위험",
  detectedAt: "2026-09-04 14:32:07",
  grade: "▲ 3등급 / 고위험",
  source: "AI CCTV #EC-07 · AIoT 스마트폴 SP-03",
  zone: "제주시 삼양해수욕장 북측 방파제",
  reviewer: "김민준 (연안관제팀)",
  reviewStatus: "검토 대기",
  location: "북위 33.5183° 동경 126.5721°",
  radius: "약 250 m",
  nearbyCoast: "삼양포구 · 원당봉 인근 방파제",
  ripCurrentZone: "구간 C-2 (고위험)",
  relatedRiver: "화북천 하구 (관심 단계)",
  nearbyFarms: "인근 해상 양식시설 없음",
  waveZone: "방파제 북단 40 m",
  rainSummary: { value: "10분 누적 강우 42 mm", detail: "수위 편차 +1.8 m (경보 기준 초과)", updatedAt: "14:30" },
  waveSummary: { value: "유의 파고 3.2 m", detail: "조위 +0.47 m (고조 진행 중)", updatedAt: "14:28" },
  ripCurrentRisk: { value: "AI 모델 위험 지수 0.87 / 1.0", detail: "과거 유사 패턴 3건 매칭", confidence: "신뢰도 92%" },
  detection: { class: "탐지 클래스: Danger_Zone_Person (방파제 진입 인원 2명)", confidence: "탐지 신뢰도 88% · 원본 마스킹 처리" },
  sensorCrossCheck: [
    { id: "sc1", name: "조류 센서 CS-04", status: "정상" },
    { id: "sc2", name: "수온 부이 BU-11", status: "데이터 지연 12분" },
  ],
  timeline: [
    { id: "t1", time: "14:32", title: "● 고위험 전환 — AI 탐지 + 센서 복합 임계 초과" },
    { id: "t2", time: "14:28", title: "▲ 중위험 상향 — 파고 3.0 m 초과" },
    { id: "t3", time: "14:15", title: "◆ 주의 등급 탐지 개시 — 방파제 진입 감지" },
    { id: "t4", time: "14:05", title: "○ 이벤트 생성 — 이상 패턴 초기 감지" },
    { id: "t5", time: "13:50", title: "○ 강우 경보 사전 알림 수신" },
  ] as TimelineEntry[],
  agencyStatus: [
    { id: "ag1", agency: "제주해양경찰서", status: "대기 요청 중" },
    { id: "ag2", agency: "제주시 재난안전과", status: "상황 공유 완료" },
    { id: "ag3", agency: "서귀포시 상황실", status: "미연결" },
    { id: "ag4", agency: "119 해상구조대", status: "출동 준비 중" },
  ],
  fieldActions: {
    dispatch: "해경 순찰정 1척 — 대기 중 (요청 시각 14:33)",
    control: "방파제 진입 차단 — 현장 요원 배치 (조치 시각 14:35)",
    alert: "현장 스피커 방송 실시 중 · 채널: 현장 단말 · 상황판",
  },
}

export const coastDispatch = {
  summary: { title: "⚠ 익수 의심 · 방파제 무단 진입", level: "심각", location: "제주시 한림읍 협재해수욕장 북서 방파제", detectedAt: "2026-09-04 14:32" },
  confidence: 94,
  ripCurrent: "활성 (고파랑 2.4m)",
  aiReason: "CCTV 프레임 내 인원 2명 방파제 선단부 진입 확인, AIoT 스마트폴 파고 센서 임계 초과, 이안류 발생 구역과 위치 중첩",
  radius: "약 120m",
  nearbyVisitors: "~40명",
  weather: "남서풍 7m/s · 시정 양호",
  request: {
    status: "전송 완료 · 응신 대기 중",
    agency: "제주해양경찰서 상황실",
    sentAt: "14:33",
    priority: "🔴 긴급 (P1)",
    vessel: "P-15 · 고속단정 2호",
    eta: "약 8분 (14:41)",
    fireLinked: "119 구조대 동시 출동 요청",
    boardShared: "수신 확인",
  },
  fallback: "3분 이내 응신 없을 경우 대체 채널(위성전화·핫라인) 전환 및 인근 구조정 재요청을 권장합니다.",
}

export const coastMonitoringDomains = [
  { id: "river", label: "하천", status: "범람 경계", detail: "수위 관측 4개소 · 차단기 2개소 작동", level: "alert" as const },
  { id: "coast", label: "연안", status: "위험 탐지", detail: "CCTV 이벤트 3건 · 경보 장비 정상", level: "danger" as const },
  { id: "aqua", label: "양식장", status: "주의 단계", detail: "수온 관측 2개소 · 안내 발송 완료", level: "caution" as const },
]

export const coastClosure = {
  caseId: "COA-2024-0312",
  title: "연안 위험 탐지 및 현장 경보",
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
