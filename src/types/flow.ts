/**
 * 3대 실증서비스(하천·저염분 고수온·연안)의 업무 흐름 — 감지 → 확인 → 판단 → 경보 → 대응 → 종료.
 * 서비스마다 화면(대시보드·상황 분석·경보 발송·…)이 이 순서를 따라 이어진다. 각 서비스 mock 데이터가
 * "지금 어느 단계까지 왔는지"를 FlowProgress로 직접 들고 있어, 시나리오를 바꾸면 흐름 표시도 같이 바뀐다.
 */
export const FLOW_STEPS = ["감지", "확인", "판단", "경보", "대응", "종료"] as const
export type FlowStep = (typeof FLOW_STEPS)[number]

/**
 * 단계별 진행 값 — 완료 시각("HH:MM"), "진행 중"·"승인 대기"(지금 이 단계), "보류"(일부러 건너뜀, 예: 관심 단계는
 * 대외 경보를 내지 않음). 값이 없으면 아직 오지 않은 단계.
 */
export type FlowProgress = Partial<Record<FlowStep, string>>
