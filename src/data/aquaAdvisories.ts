import type { RiskLevel } from "../types/domain"

/** 보드 우측 "특보 요약"에 한 줄로 나오는 항목 — 기상청 특보와 수산과학원 특보가 같은 모양을 쓴다 */
export interface AdvisoryItem {
  key: string
  level: RiskLevel
  /** 예: "고수온 주의보" */
  label: string
  region: string
  /** 표시용 발표 시각 */
  time: string
}

/**
 * 저염분 고수온 특보 — 국립수산과학원 고수온 특보는 아직 연동 전이라 화면 확인용 임의 샘플을 둔다.
 * 연동하면 이 배열을 API 응답(AdvisoryItem[])으로 바꾸면 되고, 특보가 없는 상태를 보려면 빈 배열로 둔다.
 * 샘플은 기관 발표가 아니며 화면에도 "연동 전 샘플"로 표시된다.
 */
export const aquaAdvisories: AdvisoryItem[] = [
  { key: "sample-1", level: "warning", label: "고수온 주의보", region: "제주 동부 연안", time: "샘플" },
]
