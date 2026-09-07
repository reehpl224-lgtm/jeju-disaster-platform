import type {
  IncidentAgencyAction,
  IncidentAttachment,
  IncidentRecord,
  IncidentSopApproval,
  IncidentTimelineEntry,
} from "../types/reports"

export const reportsSummary = { total: 247, lastUpdated: "09:12" }

export const incidentRecords: IncidentRecord[] = [
  {
    id: "inc-1",
    level: "danger",
    levelLabel: "심각",
    domain: "river",
    domainLabel: "하천 범람",
    endedAt: "2026-09-04 03:22 종료",
    title: "효돈천(쇠소깍) 범람 대응 — 경계 3단계 발령 및 주민 대피 안내",
    grade: "심각 (Lv.4)",
    duration: "4시간 38분",
    area: "효돈천 쇠소깍 일원 1.2km",
    approver: "홍길동 팀장",
    actionCount: "12건 완료",
  },
  {
    id: "inc-2",
    level: "warning",
    levelLabel: "경계",
    domain: "coast",
    domainLabel: "연안 위험",
    endedAt: "2026-09-03 18:55 종료",
    title: "함덕해수욕장 익수 위험 — 해경 출동 및 현장 통제",
    grade: "경계 (Lv.3)",
    duration: "1시간 12분",
    area: "함덕해수욕장 1구역",
    approver: "김제주 담당",
    actionCount: "5건 완료",
  },
  {
    id: "inc-3",
    level: "caution",
    levelLabel: "주의",
    domain: "aqua",
    domainLabel: "양식장 위험",
    endedAt: "2026-09-02 11:40 종료",
    title: "대정 일과 고수온 주의 — e-SOP 주의 단계 승인 및 어가 안내",
    grade: "주의 (Lv.2)",
    duration: "6시간 00분",
    area: "대정읍 일과리 양식장 8개소",
    approver: "이한라 담당",
    actionCount: "8건 완료",
  },
  {
    id: "inc-4",
    level: "warning",
    levelLabel: "경계",
    domain: "river",
    domainLabel: "하천 범람",
    endedAt: "2026-08-31 22:17 종료",
    title: "효돈천(돈내코) 수위 급상승 — 경계 2단계 차단기 작동 및 현장 출동",
    grade: "경계 (Lv.3)",
    duration: "2시간 51분",
    area: "효돈천 돈내코 계곡 0.8km",
    approver: "홍길동 팀장",
    actionCount: "9건 완료",
  },
  {
    id: "inc-5",
    level: "danger",
    levelLabel: "심각",
    domain: "coast",
    domainLabel: "연안 위험",
    endedAt: "2026-08-30 07:03 종료",
    title: "삼양해수욕장 방파제 위험구역 진입 — 현장 경보 및 해경 공조 출동",
    grade: "심각 (Lv.4)",
    duration: "0시간 47분",
    area: "삼양해수욕장 방파제 전구간",
    approver: "김제주 담당",
    actionCount: "4건 완료",
  },
  {
    id: "inc-6",
    level: "caution",
    levelLabel: "주의",
    domain: "aqua",
    domainLabel: "양식장 위험",
    endedAt: "2026-08-28 14:20 종료",
    title: "한경 연안 저염분수 주의 — 48시간 예측 기반 어가 맞춤 안내",
    grade: "주의 (Lv.2)",
    duration: "3시간 25분",
    area: "한경면 연안 양식장 5개소",
    approver: "이한라 담당",
    actionCount: "6건 완료",
  },
]

export const incidentDetailSummary = {
  domainLabel: "하천 범람",
  location: "효돈천 쇠소깍 일원",
  detectedAt: "2026-09-04 09:14",
  endedAt: "2026-09-04 17:42",
  maxGrade: "3단계 (심각)",
  confidence: "91%",
  approver: "김민준 팀장",
  status: "종료 완료",
}

export const incidentTimeline: IncidentTimelineEntry[] = [
  { time: "09:14", stage: "관심", content: "수위 센서 임계값 근접 감지", owner: "시스템 자동" },
  { time: "09:42", stage: "주의", content: "1단계 발령 승인", owner: "김민준 팀장" },
  { time: "11:20", stage: "경계", content: "2단계 상향 승인 · 차단기 작동", owner: "김민준 팀장" },
  { time: "13:05", stage: "심각", content: "3단계 상향 승인 · 주민 대피 안내 발송", owner: "김민준 팀장" },
  { time: "16:10", stage: "회복", content: "수위 하강 확인 · 경계 해제 검토", owner: "박현장 반장" },
  { time: "17:42", stage: "종료", content: "상황 종료 승인", owner: "김민준 팀장" },
]

export const incidentImpact = {
  river: { label: "하천 범람", floodedSection: "효돈천 쇠소깍 320m 구간", radius: "약 1.2km", households: "약 80세대" },
  coast: { label: "연안 위험", location: "해당 없음", ripCurrent: "해당 없음" },
  aqua: { label: "양식장 위험", farmCount: "해당 없음", arrivalZone: "해당 없음" },
}

export const incidentSopApprovals: IncidentSopApproval[] = [
  { stage: "1단계 · 주의", content: "관심 → 주의 상향 승인", approver: "김민준 팀장", time: "09:42", note: "자동 감지 기반" },
  { stage: "2단계 · 경계", content: "차단기 작동 · 현장 통제 승인", approver: "김민준 팀장", time: "11:20", note: "센서 교차검증 완료" },
  { stage: "3단계 · 심각", content: "주민 대피 안내 발송 승인", approver: "김민준 팀장", time: "13:05", note: "대상 80세대" },
  { stage: "해제", content: "종료 조건 충족 확인 후 승인", approver: "김민준 팀장", time: "17:42", note: "수위 30분 이상 안정" },
]

export const incidentAgencyActions: IncidentAgencyAction[] = [
  { agency: "서귀포소방서", action: "현장 출동 및 주민 안내", dispatchedAt: "11:25", result: "완료", confirmedBy: "박현장 반장" },
  { agency: "서귀포경찰서", action: "도로 통제 및 대피 유도", dispatchedAt: "13:10", result: "완료", confirmedBy: "최통제 팀장" },
  { agency: "제주도청 재난안전과", action: "상황실 총괄 지휘", dispatchedAt: "09:42", result: "완료", confirmedBy: "김민준 팀장" },
]

export const incidentAttachments: IncidentAttachment[] = [
  { id: "att1", name: "CCTV 탐지 마스킹 이미지 (쇠소깍_CAM02)", time: "2026-09-04 09:18" },
  { id: "att2", name: "수위 센서 시계열 데이터 (쇠소깍_HD02)", time: "2026-09-04 09:22" },
  { id: "att3", name: "강우레이더 스냅샷", time: "2026-09-04 10:05" },
  { id: "att4", name: "GIS 영향 범위 캡처", time: "2026-09-04 11:30" },
  { id: "att5", name: "현장 출동 보고서 (소방서)", time: "2026-09-04 14:55" },
]
