import type { CoastAgencyStatus, CoastEvent, CoastFieldAlert, TimelineEntry } from "../types/coast"

/**
 * 연안 위험단계 상태 구간 — "TP-P22_002_플랫폼 데이터 리스트.xlsx" 연안 안전관리시스템 시트 "상태 구간 설정" 그대로(2026-09-22 사용자 확정).
 * 원본 단계명 '경보'는 앱 공통 라벨 '경계'(alert)로 표기. 세 지표(파고·풍속·조위) 중 몇 개 충족 시 상향인지는 원본에 없음.
 */
export const coastStageCriteria: { level: "safe" | "caution" | "warning" | "alert" | "danger"; label: string; waveHeight: string; windSpeed: string; tide: string; riskRange: string; action: string }[] = [
  { level: "safe", label: "정상", waveHeight: "1.0m 미만", windSpeed: "6m/s 미만", tide: "평시 평균 수위 유지", riskRange: "위험구역 잔류 인원 0명", action: "시스템 정상 작동·상시 모니터링, CCTV 이상 감지 자동 운영" },
  { level: "caution", label: "관심", waveHeight: "1.0 ~ 1.5m", windSpeed: "6 ~ 10m/s", tide: "만조 시 수위 상승 시작", riskRange: "위험구역 진입 AI 객체 감지 1~2건", action: "위험 지역 집중 모니터링 전환, 현장 전광판 주의 문구" },
  { level: "warning", label: "주의", waveHeight: "1.5 ~ 2.5m", windSpeed: "10 ~ 14m/s", tide: "고조(High Tide) 수위 도달", riskRange: "너울성 파도·간헐적 주기 파랑", action: "갯바위·방파제 자동 경보 방송, AI CCTV 너울 감지 알림" },
  { level: "alert", label: "경계(경보)", waveHeight: "2.5 ~ 4.0m", windSpeed: "14 ~ 20m/s", tide: "대조기·폭풍해일 주의 수위", riskRange: "방파제·해안도로 월파 시작", action: "위험구역 출입 전면 통제, 순찰 강화·대피 방송 연속 송출" },
  { level: "danger", label: "심각", waveHeight: "4.0m 초과", windSpeed: "20m/s 초과", tide: "범람·침수 위험 수위 초과", riskRange: "인명 고립·추락·내습 즉시 감지", action: "즉각 대피 명령, 해경·119·지자체 상황실 공유 및 구조대 출동" },
]

export const coastSummary = {
  lastUpdated: "14:32:07",
  targetArea: "함덕·협재 해수욕장 (1차년도 실증지)",
  infra: "AIoT 스마트폴 신설 (지능형 CCTV + 기상센서 + 경보스피커)",
  permitNote: "공유수면 점용허가 등 인허가 절차 필요 (스마트폴 신설 구간)",
  aiLabels: ["Person_In_Water", "Danger_Zone_Person", "Rip_Current", "Overtopping"],
  // coastEvents 실제 목록(5건: danger 3 · warning 2)과 반드시 같은 수치를 쓸 것
  activeEvents: { count: 5, detail: "🔴 고위험 3건 포함" },
  // coastEvents에서 status === "미확인"인 실제 건수(2건)와 반드시 같은 수치를 쓸 것 — CoastAlertPage의 승인 대기 목록과 동일해야 함
  unconfirmedEvents: { count: 2, detail: "⚠ 즉시 검토 필요" },
  coordination: { count: 2, detail: "🔵 해경 출동 1건" },
  equipment: { normal: 18, error: 2, detail: "센서 결측 2건 별도 확인" },
}

/** GIS 쉘 자산현황 패널용 — AIoT 스마트폴 대표 4기(coastSummary.equipment 오류 2건과 일치) */
export const coastSafetyAssets: { id: string; name: string; location: string; status: "정상" | "오류"; detail: string }[] = [
  { id: "ca1", name: "함덕 AIoT 스마트폴 #1", location: "함덕해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
  { id: "ca2", name: "함덕 AIoT 스마트폴 #2", location: "함덕해수욕장", status: "정상", detail: "CCTV·기상센서·경보스피커 정상" },
  { id: "ca3", name: "협재 AIoT 스마트폴 #1", location: "협재해수욕장", status: "오류", detail: "파고 센서 결측 2시간" },
  { id: "ca4", name: "협재 AIoT 스마트폴 #2", location: "협재해수욕장", status: "오류", detail: "경보스피커 응답 없음" },
]

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
    title: "이안류 감지 — 협재해수욕장",
    basis: "해상 센서 유속 급변(Rip_Current)",
    match: "GIS 이안류 위험구역 내 위치",
  },
]

export const coastEvents: CoastEvent[] = [
  { id: "e1", level: "danger", type: "익수 의심", source: "AI CCTV · 스마트폴", location: "함덕해수욕장", time: "14:28", status: "미확인" },
  { id: "e2", level: "danger", type: "위험구역 진입", source: "AI CCTV", location: "협재해수욕장 방파제", time: "14:15", status: "경보 실행 중" },
  { id: "e3", level: "danger", type: "이안류 감지", source: "해상 센서 · GIS", location: "협재해수욕장 외해", time: "14:09", status: "해경 공조 진행" },
  { id: "e4", level: "warning", type: "이안류 감지", source: "해상 센서", location: "함덕해수욕장", time: "13:55", status: "미확인" },
  { id: "e5", level: "warning", type: "월파 경보", source: "기상 센서 · GIS", location: "협재해수욕장", time: "13:40", status: "현장 경보 완료" },
]

export const coastFieldAlerts: CoastFieldAlert[] = [
  { id: "f1", location: "함덕해수욕장", level: "danger", time: "14:28 발령", detail: "스피커·경광등 작동 중" },
  { id: "f2", location: "협재해수욕장 방파제", level: "danger", time: "14:15 발령", detail: "현장 단말 수신 확인" },
  { id: "f3", location: "협재해수욕장", level: "warning", time: "13:55 발령", detail: "문자·앱 전파 완료" },
]

export const coastAgencyStatuses: CoastAgencyStatus[] = [
  { id: "a1", agency: "해경 출동", status: "출동 중", detail: "협재 이안류 — 출동 중 (14:12 요청)", level: "info" },
  { id: "a2", agency: "해경 대기", status: "승인 대기", detail: "함덕 익수 — 출동 대기 승인 대기", level: "caution" },
  { id: "a3", agency: "소방 대기", status: "현장 접수", detail: "협재 방파제 — 현장 접수 완료", level: "offline" },
]

export const coastEventDetail = {
  id: "EVT-2026-0904-003",
  level: "danger" as const,
  status: "탐지 중",
  type: "방파제 무단진입 · 익수 위험",
  detectedAt: "2026-09-04 14:32:07",
  grade: "▲ 3등급 / 고위험",
  source: "AI CCTV #EC-07 · AIoT 스마트폴 SP-03",
  zone: "제주시 한림읍 협재해수욕장 인근 방파제",
  reviewer: "김민준 (연안관제팀)",
  reviewStatus: "검토 대기",
  location: "북위 33.3940° 동경 126.2390°",
  radius: "약 250 m",
  nearbyCoast: "협재포구 · 금능해수욕장 인근",
  ripCurrentZone: "구간 C-2 (고위험)",
  relatedRiver: "인근 하천 없음",
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
  // coastEventDetail(EVT-2026-0904-003)과 같은 사건 — location은 zone과, detectedAt은 detectedAt과 반드시 일치시킬 것
  summary: { title: "⚠ 익수 의심 · 방파제 무단 진입", level: "심각", location: "제주시 한림읍 협재해수욕장 인근 방파제", detectedAt: "2026-09-04 14:32" },
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
  { id: "coast", label: "연안", status: "위험 탐지", detail: "CCTV 이벤트 3건 · 경보 장비 정상", level: "danger" as const },
]

export const coastClosure = {
  caseId: "COA-2026-0904",
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
