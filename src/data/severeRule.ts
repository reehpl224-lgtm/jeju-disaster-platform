import type { ServiceId } from "./rolesLogic"

/**
 * 레거시 4종 '심각' 자동 판정 규칙 — 임의값(2026-10-15, 논의중).
 * 도 매뉴얼에 심각 수치 기준이 없어 "경계 상태가 일정 시간 이어지고 최대 임계치에 이르면 심각"으로 가정한다.
 * 현업 확인 후 확정되면 이 파일의 숫자만 고친다. 호우·태풍만 적용하고 해일·대설은 확정 전이라 비워 둔다.
 * 표시는 기존 심각(비상3단계)과 같고, 상황판단회의의 수동 발령을 대체하지 않는다.
 */
export interface SevereMetrics {
  /** 최근 1시간 강수량(mm) */
  rain1h?: number
  /** 최근 3시간 강수량(mm) */
  rain3h?: number
  /** 태풍 최대풍속(m/s) */
  windMs?: number
}

interface SevereRule {
  /** 경계 유지 시간(분) — 이 시간 이상 경계가 이어져야 심각 후보 */
  holdMin: number
  /** 최대 임계치 도달 여부 */
  peak: (m: SevereMetrics) => boolean
  /** 임계치 도달 기준 설명(화면 문구) */
  peakText: string
}

// 호우: 기상청 극한호우(긴급재난문자) 기준 — 1시간 50mm와 3시간 90mm 동시, 또는 1시간 72mm 이상
// 태풍: 강도 '매우 강' 이상(최대풍속 44m/s 이상)
export const SEVERE_RULES: Partial<Record<ServiceId, SevereRule>> = {
  "heavy-rain": {
    holdMin: 180,
    peak: (m) => (m.rain1h ?? 0) >= 72 || ((m.rain1h ?? 0) >= 50 && (m.rain3h ?? 0) >= 90),
    peakText: "최근 1시간 72mm 이상, 또는 1시간 50mm와 3시간 90mm 동시",
  },
  typhoon: {
    holdMin: 360,
    peak: (m) => (m.windMs ?? 0) >= 44,
    peakText: "최대풍속 44m/s 이상(강도 '매우 강')",
  },
}

/** 임계치 아래로 내려온 뒤 이 시간(분) 넘게 유지되면 경계로 내린다 */
export const SEVERE_RELEASE_MIN = 30

export const severeCriteriaText = (svc: ServiceId): string | null => {
  const r = SEVERE_RULES[svc]
  if (!r) return null
  return `경계가 ${r.holdMin / 60}시간 이상 이어지고 ${r.peakText}에 이르면 자동 심각 · 임계치 아래로 ${SEVERE_RELEASE_MIN}분 넘게 유지되면 경계로 하향 (임의값·논의중, 수동 발령은 별도)`
}

/**
 * 심각 여부 — alertMin: 경계가 이어진 시간(분), belowMin: 임계치 아래로 내려온 뒤 지난 시간(분).
 * 이미 심각이던 건은 임계치 아래로 SEVERE_RELEASE_MIN 이내이면 유지한다.
 */
export function isSevere(svc: ServiceId, o: { alertMin: number; metrics: SevereMetrics; wasSevere?: boolean; belowMin?: number }): boolean {
  const r = SEVERE_RULES[svc]
  if (!r || o.alertMin < r.holdMin) return false
  if (r.peak(o.metrics)) return true
  return !!o.wasSevere && (o.belowMin ?? 0) <= SEVERE_RELEASE_MIN
}
