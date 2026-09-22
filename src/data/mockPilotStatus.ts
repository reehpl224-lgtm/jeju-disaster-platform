/**
 * 3대 실증서비스 구현 현황 — 기능별 1차년도 구현 가능성과 데이터 출처(레거시 포함) 정리.
 *
 * 근거 자료(모두 저장소 밖 원본, 수치를 새로 지어내지 않음):
 *  - 착수보고회 및 구축 사업 추진 회의 회의록(2026-09-15, Notion) — "착수보고"
 *  - 실증 3사 착수보고 발표자료(소다시스템·지오시스템리서치·올포랜드, PDF 슬라이드 판독) — "발표자료"
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
  year1: { label: "1차년도 가능", level: "info", desc: "착수보고·발표자료 기준 올해 확보되는 데이터·인프라로 구현 가능" },
  conditional: { label: "조건부", level: "caution", desc: "인허가·기관 협의·판정 규칙 확정 등 선행 조건 필요" },
  later: { label: "2차년도 이후", level: "offline", desc: "1차년도 범위 밖 — 발표자료 일정상 2027년 이후" },
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

/** 실증사 발표자료의 성과지표(KPI) — 1차년도(2026)·2차년도(2027) 목표치 그대로 */
export interface PilotKpi {
  label: string
  year1: string
  year2: string
}

export interface PilotService {
  id: "river" | "aqua" | "coast"
  title: string
  href: string
  partner: string
  goal: string
  kpis: PilotKpi[]
  features: PilotFeature[]
  legacy: LegacyUse[]
  decisions: string[]
}

export const PILOT_SERVICES: PilotService[] = [
  {
    id: "river",
    title: "하천범람 예측·경보",
    href: "/river",
    partner: "소다시스템 컨소시엄 (세종대·에이티비스)",
    goal: "제주 건천 수문 특성에 특화된 AI로 1시간 선행 범람 예측, 관리자 승인 즉시 5초 이내 현장 직결 경보",
    kpis: [
      { label: "예보 선행시간", year1: "≤1시간 (과거 4개년 시뮬레이션 검증)", year2: "≤1시간 (6개소 실시간 우기 실측)" },
      { label: "다중채널 경보 시간", year1: "≤5초 (테스트베드 프로토타입 시험)", year2: "≤5초 (스마트폴 다채널 실증)" },
      { label: "실시간 데이터 수집률", year1: "≥90% (기존 수문망 연계 어댑터)", year2: "≥90% (6개소 전 거점 연계)" },
      { label: "융합 AI 데이터", year1: "3종 생성", year2: "3종 AX 허브 카탈로그 등록" },
      { label: "인프라 설치·운영", year1: "상류(돈내코 등) 3개소 설치·통신 검증", year2: "중·하류 3개소 추가(스마트폴 포함)" },
      { label: "예측 정확도", year1: "≥85% (ETRI 학습데이터 모의검증)", year2: "≥85% (신규 실측 재학습·공인인증)" },
    ],
    features: [
      { id: "r1", title: "실시간 수위·강우 모니터링", status: "demo", sources: ["legacy", "live-api", "new-infra"], basis: "현업 면담 — 실시간 강우·수위, 임계치 초과 알람", note: "기상청 AWS 우량은 실연동, 수위는 시연용", href: "/river/analysis" },
      { id: "r2", title: "하천수위 × 조위 연계 시계열(쇠소깍)", status: "demo", sources: ["live-api", "dummy"], basis: "현업 면담 Q15 · 발표자료 — 조위·조석을 입력 데이터로 사용", note: "모슬포 조위 KHOA 실연동 스냅샷", href: "/river/analysis" },
      { id: "r3", title: "돌발 강우 AI 조기경고(담당자 확인 후 발령)", status: "demo", sources: ["live-api", "dummy"], basis: "현업 면담 5번 — 예보 초과 돌발 폭우", href: "/river/analysis" },
      { id: "r4", title: "10·30·60분 다중 선행 예측 + 단계 전환 예상시각(ETA)", status: "year1", sources: ["partner"], basis: "발표자료 — Dual-Branch(시계열 예측 + AE/VAE 이상징후) 앙상블 위험 점수", note: "출력 형식을 상황 분석 화면에 미리보기로 표시", href: "/river/analysis" },
      { id: "r5", title: "1시간 선행 범람 예측(정확도 85%↑)", status: "year1", sources: ["partner", "legacy"], basis: "발표자료 KPI — 1차년도는 ETRI 학습데이터(2011~2023) 모의검증, 실측 검증은 2차년도" },
      { id: "r6", title: "서귀포시 자동 우량경보망 FEP 연계 + 4단계 실시간 QA", status: "year1", sources: ["legacy"], basis: "발표자료 — 기존 노후 우량망을 어댑터로 실시간 연계, 오작동·노이즈 격리", note: "레거시를 AI 입력으로 쓰는 1차년도 핵심 작업" },
      { id: "r7", title: "효돈천 AIoT 5종 복합 계측망(비접촉 레이더 수위·유속, 기상, 강우, CCTV)", status: "year1", sources: ["new-infra"], basis: "발표자료 — 1분 주기 LTE 전송, 통신 장애 시 72시간 엣지 버퍼링", note: "전체 6개소(스마트폴 포함) — 1차년도 상류 3개소, 2차년도 중·하류 3개소" },
      { id: "r8", title: "5초 직결 현장 경보(고출력 앰프·다국어 DID)", status: "conditional", sources: ["new-infra"], basis: "발표자료 — 관리자 승인 → 스마트폴 제어 → ACK 수신까지 5초", note: "1차년도는 테스트베드 시험, 스마트폴 현장 실증은 2차년도", href: "/river/alert" },
      { id: "r9", title: "e-SOP 6단계 흐름(자동 인지 → SOP 호출 → 체크리스트 → 관리자 승인 → 스마트폴 연계 → 이력)", status: "demo", sources: ["dummy"], basis: "발표자료 — 복합판단 기반 4단계 위험기준 + 실행형 e-SOP", note: "앱 단계를 안전·경계·대피·중대피 4단계로 변경 완료(2026-09-22)", href: "/river/control" },
      { id: "r10", title: "NGSI-LD 표준화 · 융합 AI 데이터 3종 AX 허브 등록", status: "year1", sources: ["partner", "legacy"], basis: "발표자료 — 1차 3종 생성, 2차 카탈로그 정식 등록" },
      { id: "r11", title: "컨트롤타워 전용 위젯(10/30/60분 위험도 차트·2D/3D 위험지도)·sLLM 연동", status: "later", sources: ["partner"], basis: "발표자료 일정 — 2027년 AX 플랫폼 전용 시각화 위젯 개발·이관" },
      { id: "r12", title: "행정시 자체 장비 흡수 표출(제주시 하천 유속측정계 등)", status: "later", sources: ["legacy"], basis: "현업 면담 — 현재 도청 미연계, 제조사별 협의 필요" },
    ],
    legacy: [
      { id: "rl1", name: "재난 예·경보시스템 (자동침수경보·하천모니터링·자동우량정보)", use: "수위·우량 실측과 경보 이력 — 범람 판단의 1차 입력", status: "연계 진행중", level: "safe" },
      { id: "rl2", name: "서귀포시 자동 우량 경보시스템 (약 20년 운영)", use: "FEP 어댑터로 실시간 연계 — 강우 입력, 장기적으로 5종 AIoT로 단계 대체", status: "1차년도 연계", level: "info" },
      { id: "rl3", name: "레거시 침수정보센서 135개소 (제주시 66 · 서귀포시 69)", use: "AIoT 계측망 설치 전 수위 참고, 설치 후 교차검증", status: "연계 진행중", level: "safe" },
      { id: "rl4", name: "ETRI 효돈천 정밀 수문 데이터 (2011~2023, 12년)", use: "AI 학습 데이터 — 1차년도 모의검증의 기준", status: "실증사 보유", level: "info" },
      { id: "rl5", name: "조기경보시스템", use: "범람 경보의 현장 전파 채널", status: "협의 중", level: "caution" },
    ],
    decisions: [
      "기존 수위·강우 기준(제2효례교)에 신규 유속 계측·AI 예측을 결합하는 단계 판단 규칙(실증사가 고도화 예정)",
      "데이터 리스트의 계획홍수량(Q%) 기준과 수위 기준의 관계 — 30~50% 공백 구간 포함",
    ],
  },
  {
    id: "aqua",
    title: "저염분수·고수온 예측·경보",
    href: "/aqua",
    partner: "지오시스템리서치 컨소시엄 (진우소프트이노베이션·제주대)",
    goal: "수치모델(ROMS·NEMO) + AI 하이브리드로 저염분수 유입 유무·시점·도달 위치를 24~48시간 앞서 예측, 어가 다채널 경보",
    kpis: [
      { label: "예측 정합도", year1: "≥85% (과거사례 재현)", year2: "≥90% (실시간 운영)" },
      { label: "공간해상도", year1: "8km 재현장 (ROMS·NEMO)", year2: "1km 이하 (AI 초해상화)" },
      { label: "예측 선행시간", year1: "정밀 48시간 · 경향 120시간", year2: "하계(7~9월) 실시간 실증" },
      { label: "외부데이터 연계", year1: "5종 이상 · AI 학습데이터셋 3종", year2: "8종 · 수집 성공률 99%" },
      { label: "신규 수온·염분 센서(추가제안)", year1: "2지점 설치 100% · 자료수신율 70%", year2: "수신율 80% · 연속관측 10개월" },
      { label: "경보 전파", year1: "e-SOP → 어가 단말 5초 이내(SLA)", year2: "어민 경보 실증" },
    ],
    features: [
      { id: "a1", title: "해양관측부이 수온·염분 실측", status: "demo", sources: ["live-api"], basis: "KHOA 공공API 실연동(확인 시점 스냅샷)", href: "/aqua/monitoring" },
      { id: "a2", title: "위험등급 자동 판정", status: "demo", sources: ["dummy"], basis: "발표자료·사업계획서 4단계(정상·주의·경계·심각)", note: "관측지점 임계치는 근사값 — 수요처 협의 후 확정", href: "/aqua" },
      { id: "a3", title: "AI 하이브리드 예측(정밀 48시간·경향 120시간, 정합도 85%)", status: "year1", sources: ["partner", "live-api"], basis: "발표자료 — ROMS·NEMO 앙상블 + U-Net 계열, 1차년도 12월 초기모델", href: "/aqua/prediction" },
      { id: "a4", title: "1km 이하 초해상화 예측", status: "later", sources: ["partner"], basis: "발표자료 — 1차년도는 8km 재현, 1km 고도화는 2차년도", note: "화면의 '공간해상도 1km 이하'는 최종 목표" },
      { id: "a5", title: "위성 수괴 탐지·독립 검증(GOCI-II 일 4회 · SMAP)", status: "year1", sources: ["partner", "live-api"], basis: "발표자료 — 26 psu 미만·26~28·28~30 구간 분류, 학습에 쓰지 않는 독립 검증", href: "/aqua/data" },
      { id: "a6", title: "양쯔강 유출량 · 기상 재분석(GFS·CMEMS) 입력", status: "year1", sources: ["partner"], basis: "발표자료 — 저염분수 유입의 선행 인자", href: "/aqua/data" },
      { id: "a7", title: "OOD 대비 수치모델 시뮬레이션 학습", status: "year1", sources: ["partner"], basis: "착수보고 — 과거에 없던 극단 상황 대비", href: "/aqua/data" },
      { id: "a8", title: "신규 수온·염분 센서 2지점 × 3층(연직) — 해상풍력 구조물", status: "conditional", sources: ["new-infra"], basis: "발표자료 추가제안 — 표층 1m·중층 50%·저층 30%, 10분 간격 LTE", note: "추가제안이라 확정 여부 확인 필요 · 회의의 '연직 관측 권고'와 연결", href: "/aqua/data" },
      { id: "a9", title: "해상 센서 운영 관리(파울링 세척·예비 센서·24시간 복구)", status: "conditional", sources: ["new-infra"], basis: "발표자료·착수보고 — 월 1회 점검, 고장 시 즉시 교체", href: "/aqua/monitoring" },
      { id: "a10", title: "대응 가이드(취수 조절·액체산소·조기 출하·가두리 이동) + 취수구 도달 ETA · XAI 근거", status: "year1", sources: ["partner"], basis: "발표자료 — 단계별 대응 시나리오·e-SOP 체크리스트 팝업", href: "/aqua/response" },
      { id: "a11", title: "양식가 경보 전파·수신 확인", status: "demo", sources: ["dummy"], basis: "착수보고 — 양식가 전파 체계", href: "/aqua/alerts" },
      { id: "a12", title: "어가 다채널 경보(카카오 알림톡·LBS 푸시) · 해역 타겟팅", status: "conditional", sources: ["partner"], basis: "발표자료 — 경보 승인 후 5초 이내 병렬 전파", note: "발송 승인권자·채널 확정 필요", href: "/aqua/alerts" },
      { id: "a13", title: "경보 대상 확대(제주 연안 생물 등)", status: "later", sources: ["dummy"], basis: "착수보고 — 검토 요청", href: "/aqua/alerts" },
    ],
    legacy: [
      { id: "al1", name: "도 레거시 시스템 (면담 목록 7종)", use: "저염분수·고수온을 직접 관측하는 도 레거시 시스템은 없음 — 공공 API·실증사 데이터 중심", status: "해당 없음", level: "offline" },
      { id: "al2", name: "제주도 해양수산연구원 고수온·저염분수 유입 예측시스템", use: "기존 운영 예측정보(ROMS 계열, 최대 120시간)와 관측자료 — 수요처 협조·성능 비교 기준", status: "수요처 협조", level: "info" },
      { id: "al3", name: "국립해양조사원(KHOA) 해양관측부이·조위관측소", use: "실측 수온·염분 — 예측 검증 기준", status: "실연동", level: "safe" },
      { id: "al4", name: "1996년 이후 저염분수 피해 이력", use: "과거사례 재현 검증(1차년도 정합도 85%)의 기준 사례", status: "자료 확보", level: "info" },
      { id: "al5", name: "제주도 재난관리시스템", use: "경보 발령 시 상황 등록 연계", status: "협의 중", level: "caution" },
    ],
    decisions: [
      "관측지점 단계 임계치 — 사업계획서는 해역 접근 위치 기준이며 '수요처 협의 후 확정'(현재 앱은 28·26·24psu 근사)",
      "신규 센서 2지점 설치(추가제안) 확정 여부와 경보 발송 승인권자",
    ],
  },
  {
    id: "coast",
    title: "연안 안전관리",
    href: "/coast",
    partner: "올포랜드 컨소시엄 (엘티메트릭·진우소프트이노베이션)",
    goal: "AI CCTV + 해양·기상 관측 + 이안류 예측을 융합해 24시간 자동 감지, 5초 이내 다중채널 전파로 골든타임 확보",
    kpis: [
      { label: "인프라 설치·운영", year1: "2개소 (함덕·삼양)", year2: "2개소 추가 (수요지 포함)" },
      { label: "연안사고 사전 감지율", year1: "≥90% (지정 위험 모의연출)", year2: "≥90% 유지·확대 검증" },
      { label: "위험 감지 정확도", year1: "≥80% (AI v1.0 Baseline)", year2: "≥85% (최종)" },
      { label: "융합형 AI 데이터", year1: "3종 이상 v1.0", year2: "3종 이상 고도화" },
      { label: "대응 시간 단축", year1: "Baseline 확보 · 20% 단축 검증", year2: "30% 이상 단축" },
      { label: "다중채널 경보 전송", year1: "≤5초", year2: "≤5초 유지" },
    ],
    features: [
      { id: "c1", title: "AI CCTV 위험 탐지(YOLO·ESOD 사람 인식, MobileSeg 위험구역, 이안류 전조)", status: "year1", sources: ["new-infra", "partner"], basis: "발표자료 — 표류·익수·인원 밀집 의심 탐지", note: "화면은 시연용 이벤트로 구성됨", href: "/coast/events" },
      { id: "c2", title: "지정 위험 모의연출 기반 사전 감지율 90% 검증", status: "year1", sources: ["partner"], basis: "착수보고·발표자료 — 12월 Ground Truth 대비 검증", href: "/coast/monitoring" },
      { id: "c3", title: "Edge 비식별화(얼굴·번호판 블러, 원본 미전송, 보관 30일)", status: "year1", sources: ["new-infra"], basis: "발표자료 — 촬영 고지부터 파기까지 생애주기 통제", href: "/coast/monitoring" },
      { id: "c4", title: "4대 위험요인(해양·기상 / 공간 / 이용객 노출도 / 행동) 기반 4단계 판단", status: "year1", sources: ["partner", "live-api"], basis: "발표자료 — 관심(상시 감시)·주의(집중 감시)·경계(현장 안내)·심각(긴급경보·통제·구조)", note: "단계별 임계치는 실증 후 보정", href: "/coast" },
      { id: "c5", title: "해양·기상 관측 연계(기상청 부이 3·KHOA 조위·제주해협 부이) + LDAPS·RWW3 예측", status: "year1", sources: ["live-api"], basis: "발표자료 — 10분 간격 관측 5개소 연계", note: "현재 화면은 KHOA 부이 스냅샷만", href: "/coast/monitoring" },
      { id: "c6", title: "VLM(Gemma3) 상황 해석 — 10분마다 상황 문장 생성·해경 알림", status: "year1", sources: ["partner"], basis: "발표자료 — 안전/경계/위험 영역별 사람 현황 보고" },
      { id: "c7", title: "현장 경보(스마트폴 음성·LED, 한·중·일)", status: "conditional", sources: ["new-infra"], basis: "착수보고·발표자료", note: "스마트폴 설치·공유수면 점용허가 선행", href: "/coast/alerts" },
      { id: "c8", title: "다중채널 5초 전파(카카오 알림톡·LBS 앱 푸시) · 해경·소방 전파", status: "conditional", sources: ["legacy", "partner"], basis: "발표자료 — e-SOP 발령 승인 후 동시 전파", note: "소방안전본부 시스템 미연계 — 기관 협의 필요", href: "/coast/dispatch" },
      { id: "c9", title: "현장 공조·출동 요청·종료 보고 흐름", status: "demo", sources: ["dummy"], basis: "e-SOP 대응 흐름", href: "/coast/dispatch" },
      { id: "c10", title: "협재 등 추가 실증지 확대 · 야간·비개장기 실증", status: "later", sources: ["new-infra"], basis: "발표자료 — 2차년도 추가 수요지 조사 후 확정" },
      { id: "c11", title: "기존 도 CCTV 연계 활용(해수욕장 인근)", status: "later", sources: ["legacy"], basis: "현업 면담 — 연계 수준 제공, 영상 반출 불가" },
    ],
    legacy: [
      { id: "cl1", name: "연안 사고 영상 등 레거시 학습 데이터", use: "보유 자료 없음 — 모의(액션) 데이터로 학습·검증", status: "없음", level: "offline" },
      { id: "cl2", name: "함덕·삼양 종합상황실 기존 CCTV·방송 스피커 (삼양 LiDAR 포함)", use: "신규 AI CCTV와 촬영 영역 보완, 기존 방송 설비로 현장 안내", status: "사용 협의 완료", level: "safe" },
      { id: "cl3", name: "도 자체관제 CCTV 약 1.2만 대", use: "해수욕장 인근 기존 CCTV 확인 — 영상 30일 순환·반출 불가, 연계 수준만", status: "연계 검토", level: "caution" },
      { id: "cl4", name: "소방안전본부 시스템", use: "사고 시 출동 연계 — 소관 부서가 달라 별도 협의", status: "미연계", level: "offline" },
      { id: "cl5", name: "민방위경보시스템", use: "광역 경보 방송 — 중앙 시스템과만 연계", status: "미연계", level: "offline" },
    ],
    decisions: [
      "4대 위험요인 결합 방식과 단계별 임계치(실증 후 보정 전 초기값)",
      "함덕·삼양 현장 맞춤 시나리오와 카메라 설치 위치(50~170m) 확정",
    ],
  },
]

/** 공통 레거시 — 특정 서비스가 아니라 컨트롤타워 전체에 걸리는 시스템 */
export const COMMON_LEGACY: LegacyUse[] = [
  { id: "g1", name: "제주도재난안전대책본부", use: "주의보 이상 발령 시 본부 가동 — 3개 서비스 경보와 연동", status: "협의 중", level: "caution" },
  { id: "g2", name: "공공데이터 API 개방", use: "개인정보 영향이 없는 기상 데이터부터 개방 검토(도)", status: "검토", level: "info" },
]
