import type { IncidentRecord } from "../types/reports"

/** 이력·보고서 — 2026-09-29 초기화로 비움(사용자 요청). 종료된 사건이 없으면 목록도 비어 있다 */
export const reportsSummary = { total: 0, lastUpdated: "-" }

/**
 * levelLabel/grade 텍스트("주의"·"경계"·"심각")와 level(RiskLevel) 값이 항상 같은 등급을 가리켜야 함
 * — riskStyles 기준 주의=warning, 경계=alert, 심각=danger.
 */
export const incidentRecords: IncidentRecord[] = []
