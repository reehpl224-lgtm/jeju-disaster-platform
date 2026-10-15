import type { ServiceId } from "./rolesLogic"

/**
 * e-SOP 절차 정의 — 요구사항 'e-SOP 절차 정의'. 재난 유형(서비스 9종) × 위험 단계(주의·경계·심각 — 정상은 발령 없음)마다
 * 상황 전파 대상·대응 부서·현장 조치를 처리 순서대로 적은 표. 초기값은 임의의 샘플이고, 권한자가 고쳐 쓴다(이 브라우저에만 저장).
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

/** 초기값(샘플) — 단계가 오를수록 전파 범위와 조치가 넓어진다 */
export function defaultSteps(svc: ServiceId, level: EsopLevel): EsopStep[] {
  const s = SCOPE[svc]
  const rows: Record<EsopLevel, [string, string, string][]> = {
    warning: [
      ["재난상황실 운영자", OPS, `${s.watch} 변동 확인, 관련 부서에 상황 공유`],
      ["현장 시설 운영자", s.dept, `${s.scope} 현장 점검, 담당자 대기`],
    ],
    alert: [
      ["재난상황실 운영자·관련 부서 팀장", OPS, "상황판단 회의 소집, 대응 인력 비상 대기"],
      ["행정시 상황실·읍면동", s.dept, `${s.scope} 출입 통제, 안전 안내 문자 발송`],
      ["소방·경찰·해경(필요 시)", AGENCY, `${s.scope} 순찰, 출동 대기`],
    ],
    danger: [
      ["관리자·의사결정자", OPS, "대피 권고·명령 승인 요청"],
      ["행정시 상황실·읍면동", s.dept, `${s.scope} 주민·이용객 대피 안내, 인원 확인`],
      ["소방·경찰·해경", AGENCY, "구조·통제 현장 투입"],
      ["행정안전부·도지사·행정시장", OPS, "재난 보고체계 순서대로 상황 보고"],
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
