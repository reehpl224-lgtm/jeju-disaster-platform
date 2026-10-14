/**
 * 레거시 시스템 담당자 — 현황 정보 요청표(2026-09-20)의 '기관 담당(부서·성명·연락처)'·'관리기업 담당(기업명·성명·연락처)' 칸 모양을 따른 임의 값.
 * 이름과 전화번호는 모두 가상이다(실명·실제 번호가 아님 — 공개 저장소·사이트이므로). 실제 담당자는 연계 협의가 끝난 뒤 넣고, 인사이동은 AI 추진단이 현행화한다(면담).
 * 시스템 id는 mockHeavyRain.ts의 legacySystems와 같다.
 */
export interface LegacyContact {
  agency: { dept: string; name: string; phone: string }
  company: { name: string; person: string; phone: string }
}

const SEOM = "섬엔지니어링"
export const LEGACY_CONTACTS: Record<string, LegacyContact> = {
  "ls-ews": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-flood-mgmt": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-rain-alert": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-alert-dispatch": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "확인 필요", phone: "—" } },
  "ls-prov-cctv": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-snow": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-quake": { agency: { dept: "제주도 자연재난과", name: "한도윤", phone: "064-000-1101" }, company: { name: SEOM, person: "윤서진", phone: "064-000-2101" } },
  "ls-flood-warn": { agency: { dept: "제주시 안전총괄과", name: "강예린", phone: "064-000-1201" }, company: { name: SEOM, person: "오민재", phone: "064-000-2201" } },
  "ls-river-mon": { agency: { dept: "제주시 안전총괄과", name: "강예린", phone: "064-000-1201" }, company: { name: SEOM, person: "오민재", phone: "064-000-2201" } },
  "ls-river-flow": { agency: { dept: "제주시 안전총괄과", name: "강예린", phone: "064-000-1201" }, company: { name: SEOM, person: "오민재", phone: "064-000-2201" } },
  "ls-sgp-rain": { agency: { dept: "서귀포시 안전총괄과", name: "문지호", phone: "064-000-1301" }, company: { name: SEOM, person: "배하준", phone: "064-000-2301" } },
}
