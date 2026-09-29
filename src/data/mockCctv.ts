import type { CctvCamera, CctvCoverageSummary } from "../types/domain"

/**
 * 레거시시스템 현황 조사 면담(2026-09-07, 자연재난과) Q22 근거 — 실제 운영 규모는
 * 도 자체관제 약 1.2만대(불법주정차 포함 1.8만대), 자치경찰단 ITS는 예산·라이선스 문제로
 * 일부만 연계. 아래 목록은 3개 실증 서비스 대상지 + 대표 도심 카메라로 구성한 대표 사례이며,
 * 전체 대수와는 다르다(양식장 "대표 N개소" 표기와 동일한 방식).
 *
 * retentionNote: "1차년도 사용 가능 레거시 데이터 현황" 문서(2026-09-28)로 신규 확인 — 원본
 * 영상은 30일 순환 저장 후 자동 삭제되어 과거 영상이 없고, 컨트롤타워엔 실시간 스트리밍
 * 링크(URL) 형태로만 표출 가능하다. 비전 AI 학습용 과거 영상 데이터셋도 확보 불가능.
 */
export const cctvCoverageSummary: CctvCoverageSummary = {
  ownOperatedTotal: 12000,
  includingIllegalParkingTotal: 18000,
  itsLinkedCount: 340,
  itsTotalCount: 1200,
  representativeCount: 0,
  retentionNote: "원본 영상은 30일 순환 저장 후 자동 삭제 — 과거 영상 없음, 실시간 스트리밍 링크(URL)로만 표출 가능(비전 AI 학습용 과거 데이터셋 확보 불가)",
}

/** 대표 카메라 목록 — 2026-09-29 초기화로 비움(시나리오가 채운다). 실제 운영 규모는 위 cctvCoverageSummary 참고 */
export const cctvCameras: CctvCamera[] = []
