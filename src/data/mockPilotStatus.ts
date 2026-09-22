/**
 * 3대 실증서비스 구현 현황 — 기능별 1차년도 구현 가능성과 데이터 출처(레거시 포함) 정리.
 *
 * 근거 자료(모두 저장소 밖 원본, 수치를 새로 지어내지 않음):
 *  - 착수보고회 및 구축 사업 추진 회의 회의록(2026-09-15, Notion) — "착수보고"
 *  - 실증 3사 발표자료(소다시스템·지오시스템리서치·올포랜드) — "발표자료"
 *  - 현업요구사항_정리_자연재난과_20260907.md / 레거시시스템 현황 조사 면담 결과서_20260907 — "현업 면담"
 *  - 플랫폼 데이터 리스트_사이트구성 점검.md(2026-09-07) — "데이터 점검"
 *
 * 상태는 "지금 화면에 있는지"와 "올해 실제로 가능한지"를 구분하기 위한 것이며, 구현(시연)은
 * 프로토타입 화면이 있다는 뜻이지 실데이터로 운영 중이라는 뜻이 아니다.
 */

export type PilotStatus = "demo" | "year1" | "conditional" | "later"
export type DataSourceTag = "live-api" | "legacy" | "new-infra" | "partner" | "dummy"

export const PILOT_STATUS_META: Record<PilotStatus, { label: string; level: "safe" | "info" | "caution" | "offline"; desc: string }> = {
  demo: { label: "구현(시연)", level: "safe", desc: "프로토타입 화면이 있음 — 데이터는 시연용 또는 실연동 스냅샷" },
  year1: { label: "1차년도 가능", level: "info", desc: "착수보고 기준 올해 확보되는 데이터·인프라로 구현 가능" },
  conditional: { label: "조건부", level: "caution", desc: "인허가·기관 협의·판정 규칙 확정 등 선행 조건 필요" },
  later: { label: "2차년도 이후", level: "offline", desc: "1차년도 범위 밖 — 연계 확장 단계에서 검토" },
}

export const SOURCE_META: Record<DataSourceTag, { label: string; className: string }> = {
  "live-api": { label: "실연동 API", className: "border-accent/40 text-accent" },
  legacy: { label: "레거시 연계", className: "border-risk-caution/50 text-risk-caution" },
  "new-infra": { label: "신규 인프라", className: "border-risk-info/60 text-[#6fa8e0]" },
  partner: { label: "실증사 보유", className: "border-white/30 text-white/70" },
  dummy: { label: "시연용 더미", className: "border-white/15 text-white/40" },
}

export interface PilotFeature {
  id: string
  title: string
  status: PilotStatus
  sources: DataSourceTag[]
  basis: string
  note?: string
  href?: string
}

export interface LegacyUse {
  id: string
  name: string
  use: string
  status: string
  level: "safe" | "caution" | "offline" | "info"
}

export interface PilotService {
  id: "river" | "aqua" | "coast"
  title: string
  href: string
  partner: string
  goal: string
  features: PilotFeature[]
  legacy: LegacyUse[]
  decisions: string[]
}

export const PILOT_SERVICES: PilotService[] = [
  {
    id: "river",
    title: "하천범람 예측·경보",
    href: "/river",
    partner: "소다시스템",
    goal: "제주 수문 특성(건천·급경사·조석)에 특화된 AI로 1시간 선행 범람 예측, 5초 이내 현장 직접 경보",
    features: [
      { id: "r1", title: "실시간 수위·강우 모니터링", status: "demo", sources: ["legacy", "live-api", "new-infra"], basis: "현업 면담 — 실시간 강우·수위, 임계치 초과 알람", note: "기상청 AWS 우량은 실연동, 수위는 시연용", href: "/river/analysis" },
      { id: "r2", title: "하천수위 × 조위 연계 시계열(쇠소깍)", status: "demo", sources: ["live-api", "dummy"], basis: "현업 면담 Q15", note: "모슬포 조위 KHOA 실연동 스냅샷", href: "/river/analysis" },
      { id: "r3", title: "돌발 강우 AI 조기경고(담당자 확인 후 발령)", status: "demo", sources: ["live-api", "dummy"], basis: "현업 면담 5번 — 예보 초과 돌발 폭우", href: "/river/analysis" },
      { id: "r4", title: "10·30·60분 다중 선행 예측 + 단계 전환 예상시각", status: "year1", sources: ["partner"], basis: "발표자료 — FloodRiskPrediction 출력 항목", note: "출력 형식을 상황 분석 화면에 미리보기로 표시", href: "/river/analysis" },
      { id: "r5", title: "1시간 선행 범람 예측(정합도 85%↑)", status: "year1", sources: ["partner", "legacy"], basis: "착수보고 — ETRI 수문 빅데이터 12년 치·검증 엔진 즉시 투입" },
      { id: "r6", title: "효돈천 AIoT 계측망 7개소 · 스마트폴 3개소", status: "year1", sources: ["new-infra"], basis: "착수보고 — 현장 설치 가속화", note: "설치 전까지 수위 입력은 레거시 침수정보센서 기준" },
      { id: "r7", title: "현장 직접 경보 5초 이내(방송·DID)", status: "conditional", sources: ["new-infra"], basis: "착수보고 사업 목표", note: "스마트폴 설치 완료 후 응답시간 검증", href: "/river/alert" },
      { id: "r8", title: "e-SOP 단계 승인·현장 통제·출동 요청", status: "demo", sources: ["dummy"], basis: "발표자료 e-SOP 4단계", href: "/river/control" },
      { id: "r9", title: "LDB 표준 변환 · AX 허브 융합 데이터셋 등록", status: "year1", sources: ["partner", "legacy"], basis: "착수보고 — 3종 융합 데이터셋" },
      { id: "r10", title: "행정시 자체 장비 흡수 표출(서귀포 자동우량경보·제주시 하천 유속측정계)", status: "later", sources: ["legacy"], basis: "현업 면담 — 현재 도청 미연계, 제조사별 협의 필요" },
    ],
    legacy: [
      { id: "rl1", name: "재난 예·경보시스템 (자동침수경보·하천모니터링·자동우량정보)", use: "수위·우량 실측과 경보 이력 — 범람 판단의 1차 입력", status: "연계 진행중", level: "safe" },
      { id: "rl2", name: "레거시 침수정보센서 135개소 (제주시 66 · 서귀포시 69)", use: "AIoT 계측망 설치 전 수위 입력, 설치 후 교차검증", status: "연계 진행중", level: "safe" },
      { id: "rl3", name: "ETRI 정밀 수문 빅데이터 (12년 치)", use: "AI 학습 데이터 — LDB 표준 변환 후 AX 허브 등록", status: "실증사 보유", level: "info" },
      { id: "rl4", name: "조기경보시스템", use: "범람 경보의 현장 전파 채널", status: "협의 중", level: "caution" },
      { id: "rl5", name: "자치경찰단 교통정보센터", use: "하천변 도로 통제·교통 CCTV", status: "미연계", level: "offline" },
    ],
    decisions: [
      "위기단계 30~50% 구간이 비어 있음 — 의도인지 누락인지 확정",
      "계획홍수량(Q%) 기준과 수위 기준의 결합 규칙",
      "감조구간(쇠소깍) 조위 보정 판정 규칙",
    ],
  },
  {
    id: "aqua",
    title: "저염분수·고수온 예측·경보",
    href: "/aqua",
    partner: "지오시스템리서치",
    goal: "수치모델·위성·관측부이를 융합한 AI로 저염분수·고수온 이동·확산 예측(공간해상도 1km 이하), 다채널 경보",
    features: [
      { id: "a1", title: "해양관측부이 수온·염분 실측", status: "demo", sources: ["live-api"], basis: "KHOA 공공API 실연동(확인 시점 스냅샷)", href: "/aqua/monitoring" },
      { id: "a2", title: "위험등급 자동 판정(국립수산과학원 기준)", status: "demo", sources: ["dummy"], basis: "플랫폼 데이터 리스트", note: "원본 임계값 표기 일부 역순 — 공식 기준 확정 필요", href: "/aqua" },
      { id: "a3", title: "AI 확산 예측(1km 이하 · 정합도 85%↑)", status: "year1", sources: ["partner", "live-api"], basis: "착수보고 — RAMS·NEMO·GOCI·SMAP·부이 융합 학습", href: "/aqua/prediction" },
      { id: "a4", title: "OOD 대비 수치모델 시뮬레이션 학습", status: "year1", sources: ["partner"], basis: "착수보고 — 과거에 없던 극단 상황 대비", href: "/aqua/data" },
      { id: "a5", title: "연직(수심별) 수온·염분 검증", status: "conditional", sources: ["new-infra"], basis: "착수보고 권고", note: "연직 관측 데이터 연계 필요", href: "/aqua/data" },
      { id: "a6", title: "해상 센서 운영 관리(통신 간섭·파울링·예비 센서)", status: "conditional", sources: ["new-infra"], basis: "착수보고 — 풍력발전기 주변 설치", href: "/aqua/monitoring" },
      { id: "a7", title: "양식가 대상 경보 전파·수신 확인", status: "demo", sources: ["dummy"], basis: "착수보고 — 양식가 전파 체계", href: "/aqua/alerts" },
      { id: "a8", title: "경보 대상 확대(제주 연안 생물 등)", status: "later", sources: ["dummy"], basis: "착수보고 — 검토 요청", href: "/aqua/alerts" },
    ],
    legacy: [
      { id: "al1", name: "도 레거시 시스템 (면담 목록 7종)", use: "저염분수·고수온을 직접 관측하는 도 레거시 시스템은 없음 — 공공 API·실증사 데이터 중심", status: "해당 없음", level: "offline" },
      { id: "al2", name: "국립해양조사원(KHOA) 해양관측부이·조위관측소", use: "실측 수온·염분 — 예측 검증 기준", status: "실연동", level: "safe" },
      { id: "al3", name: "기상청 API허브 해양관측 · GOCI-II 해색", use: "파고·수온 실시간 참고, 저염분수 확산 범위", status: "실연동", level: "safe" },
      { id: "al4", name: "제주도 재난관리시스템", use: "경보 발령 시 상황 등록 연계", status: "협의 중", level: "caution" },
    ],
    decisions: [
      "염분 정상 기준(30.0 vs 31.0 psu)과 역순 표기된 경계·심각 구간 확정",
      "수온 28℃ 도달·지속일수의 경계값 포함 여부",
      "경보 발령 승인권자와 양식가 발송 채널",
    ],
  },
  {
    id: "coast",
    title: "연안 안전관리",
    href: "/coast",
    partner: "올포랜드",
    goal: "CCTV·해양·기상 데이터를 멀티모달 AI로 융합해 24시간 위험 감지(사전 감지율 90%↑·정확도 85%↑), 골든타임 단축",
    features: [
      { id: "c1", title: "AI CCTV 위험 탐지(익수·위험구역·이안류·월파)", status: "year1", sources: ["new-infra", "partner"], basis: "착수보고 — 스마트폴 지능형 CCTV", note: "화면은 시연용 이벤트로 구성됨", href: "/coast/events" },
      { id: "c2", title: "모의 상황 연출 기반 감지율·미탐률 검증", status: "year1", sources: ["partner"], basis: "착수보고 — 12월 착수로 실제 사고 연출 불가", href: "/coast/monitoring" },
      { id: "c3", title: "Edge 개인정보 비식별화(모자이크)", status: "year1", sources: ["new-infra"], basis: "착수보고 — Jetson 등 Edge 즉시 처리", href: "/coast/monitoring" },
      { id: "c4", title: "현장 경보(LED·지향성 스피커·한·중·일 음성)", status: "conditional", sources: ["new-infra"], basis: "착수보고", note: "스마트폴 설치·공유수면 점용허가 선행", href: "/coast/alerts" },
      { id: "c5", title: "해경·소방 실시간 SMS 전파", status: "conditional", sources: ["legacy"], basis: "착수보고", note: "소방안전본부 시스템 미연계 — 기관 협의 필요", href: "/coast/dispatch" },
      { id: "c6", title: "파고·풍속·조위 다중지표 위험 판정", status: "conditional", sources: ["live-api"], basis: "데이터 점검 — 지표 결합 규칙 없음", note: "KHOA 부이 파고·풍속은 실연동 스냅샷", href: "/coast" },
      { id: "c7", title: "현장 공조·출동 요청·종료 보고 흐름", status: "demo", sources: ["dummy"], basis: "e-SOP 대응 흐름", href: "/coast/dispatch" },
      { id: "c8", title: "기존 도 CCTV 연계 활용(해수욕장 인근)", status: "later", sources: ["legacy"], basis: "현업 면담 — 연계 수준 제공, 영상 반출 불가" },
    ],
    legacy: [
      { id: "cl1", name: "연안 사고 영상 등 레거시 학습 데이터", use: "보유 자료 없음 — 모의(액션) 데이터로 학습·검증", status: "없음", level: "offline" },
      { id: "cl2", name: "도 자체관제 CCTV 약 1.2만 대", use: "해수욕장 인근 기존 CCTV 확인 — 영상은 30일 순환·반출 불가, 연계 수준만", status: "연계 검토", level: "caution" },
      { id: "cl3", name: "소방안전본부 시스템", use: "사고 시 출동 연계 — 소관 부서가 달라 별도 협의", status: "미연계", level: "offline" },
      { id: "cl4", name: "민방위경보시스템", use: "광역 경보 방송 — 중앙 시스템과만 연계", status: "미연계", level: "offline" },
    ],
    decisions: [
      "파고·풍속·조위 중 몇 개 초과 시 단계 상향인지 결합 규칙",
      "위험구역 잔류·AI 객체 감지 건수의 이벤트 코드·심각도 정의",
      "함덕·삼양 현장 맞춤 시나리오와 카메라 설치 위치(50~170m) 확정",
    ],
  },
]

/** 공통 레거시 — 특정 서비스가 아니라 컨트롤타워 전체에 걸리는 시스템 */
export const COMMON_LEGACY: LegacyUse[] = [
  { id: "g1", name: "제주도재난안전대책본부", use: "주의보 이상 발령 시 본부 가동 — 3개 서비스 경보와 연동", status: "협의 중", level: "caution" },
  { id: "g2", name: "공공데이터 API 개방", use: "개인정보 영향이 없는 기상 데이터부터 개방 검토(도)", status: "검토", level: "info" },
]
