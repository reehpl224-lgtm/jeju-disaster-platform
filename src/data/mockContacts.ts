import type { DutyContact } from "../types/domain"

/**
 * 담당자·연락처 안내 데모 데이터 — 레거시시스템 현황 조사 면담(2026-09-07) Q4·Q27 근거.
 * 이름·연락처는 실제 담당자가 아닌 데모용 가상 인물이다(기존 데모 로그인 "홍길동"과 동일한 성격).
 * 인사이동 시 실제 값은 AI추진단이 접수해 현행화하는 운영 방식으로 면담에서 합의됨.
 */
export const dutyContacts: DutyContact[] = [
  {
    id: "contact-general-01",
    domain: "general",
    role: "자연재난과 총괄",
    name: "이도현 주무관",
    org: "제주특별자치도 자연재난과",
    phone: "064-710-0000",
    channel: "유선 · 카카오톡 단톡방(풍수방)",
    updatedAt: "2026-09-07",
  },
  {
    id: "contact-aqua-01",
    domain: "aqua",
    role: "양식장 대응 담당",
    name: "박서연 주무관",
    org: "제주특별자치도 해양수산과",
    phone: "064-710-0011",
    channel: "유선 · 네이버웍스",
    updatedAt: "2026-09-07",
  },
  {
    id: "contact-coast-01",
    domain: "coast",
    role: "연안 안전 담당",
    name: "정민준 주무관",
    org: "제주특별자치도 해양수산과",
    phone: "064-710-0022",
    channel: "유선 · 카카오톡 단톡방(정전방)",
    updatedAt: "2026-09-07",
  },
  {
    id: "contact-river-01",
    domain: "river",
    role: "하천 범람 대응 담당",
    name: "최지우 주무관",
    org: "제주특별자치도 자연재난과",
    phone: "064-710-0033",
    channel: "유선 · 카카오톡 단톡방(풍수방)",
    updatedAt: "2026-09-07",
  },
]
