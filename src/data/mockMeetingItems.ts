import type { RiskLevel } from "../types/domain"

/**
 * 기후해양재난 AX 실증서비스 착수보고회 및 구축 사업 추진 회의(2026-09-15) 회의록에서 가져온 항목.
 * 회의에서 논의·요청된 "계획/검토" 사항이며 실제 측정값이 아니다 — 수치·성능 결과는 넣지 않고 진행 상태만 표기한다.
 */
export interface PlanItem {
  id: string
  title: string
  detail: string
  status: string
  level: RiskLevel
}

export const MEETING_SOURCE = "출처: 착수보고회 회의록 (2026-09-15)"

// ── 저염분수·고수온 ──
export const aquaPlannedData: PlanItem[] = [
  { id: "ap1", title: "연직(수심별) 수온·염분 관측", detail: "표층 관측뿐 아니라 수심에 따른 연직 수온·염분 관측 데이터를 검증에 반영하도록 권고", status: "연계 예정", level: "info" },
  { id: "ap2", title: "OOD 대비 시뮬레이션 학습 데이터", detail: "미래 유량 급증 등 과거에 없던 극단 상황(Out of Distribution)에 대비해 수치모델 기반 인위적 시뮬레이션 데이터를 생성·학습", status: "구축 예정", level: "info" },
]

export const aquaSensorOps: PlanItem[] = [
  { id: "as1", title: "통신 간섭(Interference)", detail: "풍력발전기 주변 센서 설치 시 통신 간섭 차단 대책 수립", status: "대책 수립 중", level: "caution" },
  { id: "as2", title: "부식·오염(파울링)", detail: "해상 센서의 부식·오염 관리 방안 마련", status: "대책 수립 중", level: "caution" },
  { id: "as3", title: "예비 센서 세트", detail: "부식·오염에 대비한 예비 센서 세트 수급", status: "수급 예정", level: "info" },
]

export const aquaAlertTargets: PlanItem[] = [
  { id: "at1", title: "양식가", detail: "양식가 대상 경보 전파 체계 (문자·재난안전앱·현장 단말·상황판)", status: "적용", level: "safe" },
  { id: "at2", title: "제주 연안 내 생물 등 전파 대상 확대", detail: "양식가 외에 제주 연안 내 생물 등으로 경보 전파 대상을 넓히는 방안 검토 요청", status: "검토 중", level: "caution" },
]

// ── 연안 안전관리 ──
export const coastVerification: PlanItem[] = [
  { id: "cv1", title: "성능 검증 방식", detail: "겨울철(12월) 착수라 실제 해수욕장 사고 연출이 어려워, 모의 상황 연출·시뮬레이션으로 감지율·미탐률을 검증", status: "계획 확정", level: "info" },
  { id: "cv2", title: "함덕 해수욕장 시나리오", detail: "표류·익수 사고 발생 확률이 비교적 낮은 특성을 반영해 현장 맞춤형으로 재조정", status: "재조정 필요", level: "caution" },
  { id: "cv3", title: "협재 해수욕장 시나리오", detail: "회의에서는 함덕·삼양 기준으로 재조정이 논의됨 — 1차년도 실증지가 함덕·협재로 확정(2026-09-22)되어 협재 기준으로 수립 필요", status: "재조정 필요", level: "caution" },
]

export const coastInstallReview: PlanItem[] = [
  { id: "ci1", title: "카메라 위치·성능", detail: "해안가–상황실 거리 50~170m를 고려해 감지용 카메라 고배율 줌, 화질·픽셀 확보 및 설치 위치 재검토", status: "사전 검증 필요", level: "caution" },
  { id: "ci2", title: "Edge 개인정보 비식별화", detail: "Edge 단계(Jetson 등 디바이스)에서 모자이크 등 비식별화를 즉시 처리", status: "적용 계획", level: "info" },
  { id: "ci3", title: "전원·통신선 토목 협의", detail: "스마트폴·CCTV 전원 및 통신선 연결 관련 토목 공사 사전 협의 추진", status: "협의 추진", level: "caution" },
]

export const coastAlertChannels: PlanItem[] = [
  { id: "cc1", title: "LED 경광", detail: "사고 감지 시 현장 LED 경보", status: "구축 예정", level: "info" },
  { id: "cc2", title: "지향성 스피커", detail: "위험 구역 방향으로 음성 안내", status: "구축 예정", level: "info" },
  { id: "cc3", title: "3개 국어 음성 안내", detail: "한국어·중국어·일본어", status: "구축 예정", level: "info" },
  { id: "cc4", title: "관제자 알림", detail: "관제 화면 알림으로 담당자 확인", status: "구축 예정", level: "info" },
]

export const coastSmsRelay: PlanItem[] = [
  { id: "cs1", title: "해경 실시간 SMS 전파", detail: "사고 감지 시 관계 기관(해경)에 실시간 SMS 전파", status: "체계 점검", level: "caution" },
  { id: "cs2", title: "소방 실시간 SMS 전파", detail: "사고 감지 시 관계 기관(소방)에 실시간 SMS 전파", status: "체계 점검", level: "caution" },
]

// ── 하천범람 ──
export const riverPipeline: PlanItem[] = [
  { id: "rp1", title: "ETRI 수문 빅데이터 (12년 치)", detail: "4개월의 짧은 사업 기간 내 성과 확보를 위해 기존 보유 정밀 수문 빅데이터와 논문 검증 AI 엔진을 즉시 투입", status: "활용", level: "safe" },
  { id: "rp2", title: "LDB 표준 변환", detail: "ETRI 수문 빅데이터 및 현장 측정 데이터를 LDB 표준으로 변환", status: "진행 중", level: "caution" },
  { id: "rp3", title: "AX 허브 융합 데이터셋 등록", detail: "LDB 표준으로 변환한 3종 융합 데이터셋을 AX 허브에 등록", status: "등록 예정", level: "info" },
]

export const riverHydrology: PlanItem[] = [
  { id: "rh1", title: "건천", detail: "평소 물이 흐르지 않다가 강우 시 급격히 유량이 늘어나는 제주 하천 특성", status: "모델 반영", level: "info" },
  { id: "rh2", title: "급경사", detail: "경사가 급해 유출이 빠른 제주 하천 특성", status: "모델 반영", level: "info" },
  { id: "rh3", title: "조석 영향", detail: "쇠소깍 감조구간은 밀물 시간대 조위가 수위에 영향 (위 수위×조수 연계 차트 참고)", status: "모델 반영", level: "info" },
]

export const riverFieldAlertGoal: PlanItem[] = [
  { id: "rf1", title: "현장 직접 경보 5초 이내", detail: "범람 예측 시 5초 이내에 현장으로 직접 경보하고 관계 기관에 전파하는 것이 사업 목표", status: "응답시간 검증 예정", level: "info" },
]

/** AI 범람 예측 출력 항목 — 소다시스템 착수보고 발표자료의 NGSI-LD 엔티티(FloodRiskPrediction·WaterResourceObservation) 예시.
 *  status 자리는 발표자료에 적힌 "예시값"이며 효돈천의 현재 관측·예측값이 아니다 */
export const riverPredictionOutput: PlanItem[] = [
  { id: "po1", title: "선행시간별 예측 (10·30·60분)", detail: "선행시간마다 위험등급을 따로 산출 — 1시간 선행 목표의 세부 단위", status: "10/30/60분", level: "info" },
  { id: "po2", title: "단계 전환 예상 시각 (ETA)", detail: "현재 등급에서 다음 등급으로 넘어가기까지 남은 시간 — 선제 통제 판단 근거", status: "예시 30분", level: "info" },
  { id: "po3", title: "예측 신뢰도", detail: "예측 결과와 함께 제공 — 담당자가 발령 여부를 판단할 때 참고", status: "예시 88.5%", level: "info" },
  { id: "po4", title: "이상 점수 (LSTM-AE)", detail: "센서 시계열의 평소와 다른 패턴 정도 — 센서 이상·돌발 상황 탐지", status: "예시 0.78", level: "info" },
  { id: "po5", title: "관측 입력 (수위·유속·강우)", detail: "Edge 계측 → 4단계 품질검사(QA) 통과 후 입력", status: "예시 1.85m·2.40m/s·45mm/h", level: "info" },
  { id: "po6", title: "현장 경보 채널", detail: "예측 단계 상향 시 현장 방송과 DID 전광판으로 직접 경보", status: "방송 + DID", level: "info" },
]

// ── 공통(데이터 시스템) ──
export const commonSchedule: PlanItem[] = [
  { id: "cm1", title: "데이터 연동 규격 사전 정의 문서", detail: "실증 컨소시엄에 전달 (회의 다음 날까지)", status: "전달 예정", level: "info" },
  { id: "cm2", title: "협의체 회의", detail: "추석 이후 10월 초~중순, 지자체(안전건강실 등) 및 관계 기관 대상", status: "개최 예정", level: "info" },
]

export const consortiumRoles: PlanItem[] = [
  { id: "cr1", title: "이노뎁", detail: "물리 인프라, 클라우드 실행 환경, 보안 및 망 분리 구축", status: "담당", level: "offline" },
  { id: "cr2", title: "딥토닉", detail: "실증 지원, AX 허브 아키텍처, sLLM/AI 모델 개발 및 표준화", status: "담당", level: "offline" },
  { id: "cr3", title: "무한정보기술", detail: "레거시 연계 현황 조사, 통합 상황판 UI/UX 설계 및 서비스 프로토타입", status: "담당", level: "offline" },
  { id: "cr4", title: "메티스정보", detail: "공공/실증 데이터 수집 정제, 품질 관리 체계 및 파이프라인 최적화", status: "담당", level: "offline" },
]
