/**
 * 태풍 정보 — 레거시시스템 현황 조사 면담(2026-09-07) 근거: "태풍 관련 정보는 자체 실측 장비는
 * 없음: 전량 기상청 정보 수신." 호우(침수센서·우량계 등 자체 관측망)와 달리, 태풍은 자체 시스템이
 * 아니라 기상청이 발표하는 태풍 정보를 그대로 수신·표출하는 성격이라 별도 타입으로 분리했다.
 * 표시 항목(이름/상태/위치/이동속도/기압/최대풍속)은 도청이 참고 자료로 제시한 실제 벤더 데모
 * (AGENTS.md §2-④, demo-10.muhanit.kr)의 태풍 정보 카드 형식을 따른다.
 */
export interface TyphoonReport {
  id: string
  name: string
  status: "예비특보" | "태풍주의보" | "태풍경보" | "특보 해제"
  issuedAt: string
  location: string
  speedKmh: number
  pressureHpa: number
  maxWindMs: number
}
