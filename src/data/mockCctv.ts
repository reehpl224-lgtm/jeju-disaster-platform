import type { CctvCamera, CctvCoverageSummary } from "../types/domain"

/**
 * 레거시시스템 현황 조사 면담(2026-09-07, 자연재난과) 근거 — 도 자체관제 약 1.2만대,
 * 불법주정차 포함 약 1.8만대. 현재 조회 중인 제주시 감시 CCTV API 3종과는 운영 주체·범위가
 * 다르며, 두 수치는 포함 관계여서 합산하지 않는다. ITS의 정확한 대수는 원문에서 확인되지 않았다.
 *
 * retentionNote: "1차년도 사용 가능 레거시 데이터 현황" 문서(2026-09-28)로 신규 확인 — 원본
 * 영상은 30일 순환 저장 후 자동 삭제되어 과거 영상이 없고, 컨트롤타워엔 실시간 스트리밍
 * 링크(URL) 형태로만 표출 가능하다. 비전 AI 학습용 과거 영상 데이터셋도 확보 불가능.
 */
export const cctvCoverageSummary: CctvCoverageSummary = {
  ownOperatedApproxTotal: 12000,
  includingIllegalParkingApproxTotal: 18000,
  sourceDate: "2026-09-07",
  retentionNote: "원본 영상은 30일 순환 저장 후 자동 삭제 — 과거 영상 없음, 실시간 스트리밍 링크(URL)로만 표출 가능(비전 AI 학습용 과거 데이터셋 확보 불가)",
}

/** 제주시 공공데이터 API가 채우는 조회 목록 — 도 전체 운영 규모와 별개 */
export const cctvCameras: CctvCamera[] = []
