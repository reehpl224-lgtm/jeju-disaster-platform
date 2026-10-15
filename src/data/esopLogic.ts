import type { ServiceId } from "./rolesLogic"

/**
 * e-SOP 절차 정의 — 요구사항 'e-SOP 절차 정의'. 재난 유형(서비스 9종) × 위험 단계(주의·경계·심각 — 정상은 발령 없음)마다
 * 상황 전파 대상·대응 부서·현장 조치를 처리 순서대로 적은 표. 초기값은 도 재난대응 매뉴얼의 단계별 조치목록을 일반화한 것이고, 권한자가 고쳐 쓴다(이 브라우저에만 저장).
 * 절차 정의표는 단계 진행 화면(실증 3종)과 별개로 모든 서비스에 있다.
 */
export type EsopLevel = "warning" | "alert" | "danger"
export const ESOP_STAGES: { level: EsopLevel; label: string }[] = [
  { level: "warning", label: "주의" },
  { level: "alert", label: "경계" },
  { level: "danger", label: "심각" },
]

export interface EsopStep {
  id: string
  /** 상황 전파 대상 */
  target: string
  /** 대응 부서 */
  dept: string
  /** 현장 조치 사항 */
  action: string
}
/** 저장 형태 — 고친 (서비스:단계)만 담고, 없으면 초기값을 쓴다 */
export type EsopDefs = Record<string, EsopStep[]>
export const esopKey = (svc: ServiceId | string, level: EsopLevel) => `${svc}:${level}`

const SCOPE: Record<ServiceId, { scope: string; watch: string; dept: string }> = {
  "heavy-rain": { scope: "저지대·하천변", watch: "호우 특보·우량", dept: "자연재난과" },
  typhoon: { scope: "해안·항포구·선박", watch: "태풍 진로·강풍", dept: "자연재난과" },
  heat: { scope: "무더위쉼터·취약계층", watch: "폭염 특보·체감온도", dept: "보건·복지 소관 부서" },
  wildfire: { scope: "산림·입산 구역", watch: "건조·강풍 특보", dept: "산림 소관 부서" },
  tsunami: { scope: "해안 저지대·방파제", watch: "해일 특보·지진 정보", dept: "자연재난과" },
  snow: { scope: "도로·한라산 탐방로", watch: "대설 특보·적설", dept: "도로 소관 부서" },
  river: { scope: "효돈천 하천변·산책로", watch: "하천 유량비", dept: "하천 소관 부서" },
  aqua: { scope: "양식장", watch: "수온·염분", dept: "수산 소관 부서" },
  coast: { scope: "해수욕장·연안 시설", watch: "파고·월파", dept: "해양 소관 부서" },
}

const OPS = "재난상황실"
const AGENCY = "유관기관"

/**
 * 초기값 — 도 재난대응 매뉴얼의 단계별 조치목록(징후감지·초기대응 → 비상대응 → 수습복구)과 협업기능 체계를 일반화해 옮긴 것이다.
 * 주의=비상1단계(초기대응), 경계=비상2단계(비상대응 시작), 심각=비상3단계(비상대응 최고). 단계가 오를수록 전파 범위와 조치가 넓어진다.
 * 특정 부서·인명·시설 목록은 담지 않고 협업기능 이름(재난상황관리반 등)으로만 적는다. 권한자가 고쳐 쓰면 그 값이 우선한다.
 */
export function defaultSteps(svc: ServiceId, level: EsopLevel): EsopStep[] {
  const s = SCOPE[svc]
  const rows: Record<EsopLevel, [string, string, string][]> = {
    warning: [
      ["재난상황실 운영자", "재난상황관리반", `${s.watch} 징후 파악(일시·장소·현상·원인·피해 가능성)과 초기 상황판단회의 개최`],
      ["소관 부서·행정시·유관기관", "재난상황관리반", "징후 전파와 비상근무 사전 예고(문서·문자·SNS), 필요 시 상급기관 보고(먼저 유·무선, 뒤에 서면)"],
      ["현장 시설 운영자·읍면동", s.dept, `${s.scope} 취약지역 예찰과 안전실태 점검, 예경보시설 점검`],
      ["교통대책 담당·자치경찰", "교통대책반", "상습 침수·위험 구간 교통통제 준비와 우회 안내 확인"],
      ["대변인", "재난수습홍보반", "도민 행동요령 홍보(재난문자·SNS)와 언론 모니터링·오보 대응"],
    ],
    alert: [
      ["재난상황실 운영자·관련 부서 팀장", "재난상황관리반", "상황판단회의로 위기경보 단계 결정, 대책본부 상황총괄반 가동과 협업기능별 실무반 편성"],
      ["협업기능별 실무반", "재난상황관리반", "대처상황 보고서 작성·전파(하루 4회 05·10·17·22시, 마감 2시간 전)"],
      ["행정시 상황실·읍면동", s.dept, `${s.scope} 출입통제와 위험지역 사전대피 권고(재해약자 우선), 대피소 개방 준비`],
      ["시설응급복구·재난관리자원 담당", "시설응급복구반", "응급복구 인력·장비·자재 보유 현황 파악과 동원 준비"],
      ["교통대책 담당·자치경찰", "교통대책반", "교통통제와 대체교통 운영, 재난문자로 통제 안내"],
      ["소방·경찰·해경·해병대 등(필요 시)", AGENCY, "파견 요청과 순찰·출동 대기"],
      ["대변인", "재난수습홍보반", "재난문자·재난방송 송출 요청과 브리핑 창구 일원화"],
    ],
    danger: [
      ["관리자·의사결정자", OPS, "위험구역 설정과 대피명령·강제대피 승인(발령 권한자 결정)"],
      ["행정시 상황실·읍면동", s.dept, `${s.scope} 주민·이용객 대피명령 안내(재난문자·방송·앰프·방문)와 전원 대피 확인`],
      ["소방·경찰·해경", AGENCY, "구조·구급, 현장통제선 설치, 불응자 강제대피 협조"],
      ["재난현장 통합지원본부", "재난상황관리반", "통합지원본부 설치와 긴급구조통제단 가동 요청"],
      ["의료방역·긴급생활안정 담당", "의료방역반", "현장응급의료소 설치, 이재민 구호와 임시주거시설 확보"],
      ["행정안전부·도지사·행정시장", OPS, "재난 보고체계 순서대로 상황 보고, 피해 현황 NDMS 입력, 필요 시 재난사태 선포 건의와 중앙 지원 요청"],
      ["대변인", "재난수습홍보반", "재난문자·재난방송 송출 요청과 현장 브리핑(확인된 사실만)"],
    ],
  }
  return rows[level].map(([target, dept, action], i) => ({ id: `${svc}-${level}-${i + 1}`, target, dept, action }))
}

export const stepsOf = (defs: EsopDefs, svc: ServiceId, level: EsopLevel): EsopStep[] => defs[esopKey(svc, level)] ?? defaultSteps(svc, level)

/** 처리 순서 바꾸기 — 범위를 벗어나면 그대로 */
export function moveStep<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}

/** 서비스 카드 집계 → 현재 단계 — 건수가 있는 가장 높은 단계. 없으면 undefined */
export function currentLevel(counts: Partial<Record<EsopLevel, number>>): EsopLevel | undefined {
  return [...ESOP_STAGES].reverse().find((s) => (counts[s.level] ?? 0) > 0)?.level
}
