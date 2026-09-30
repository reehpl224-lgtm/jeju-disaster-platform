import type { RiverResourceItem } from "../types/riverRun"

/**
 * 하천 파일럿 가상 인력·장비 — 고정된 소규모 세트(재현 가능해야 하므로 매 실행마다 랜덤 생성하지 않음).
 * 수량·배치 위치는 시험 가정이며 실제 기관 보유량이나 현장 설치 사실을 뜻하지 않는다(§2-4).
 * 실제 연락처·발송 기능은 붙이지 않는다.
 */
export const riverResources: RiverResourceItem[] = [
  { id: "res-truck-donnaeko", kind: "출동차", label: "서귀포소방서 출동차(돈내코 담당)", location: "돈내코", capacity: 1 },
  { id: "res-truck-soesokkak", kind: "출동차", label: "서귀포소방서 출동차(쇠소깍 담당)", location: "쇠소깍", capacity: 1 },
  { id: "res-crew-donnaeko", kind: "통제 인력", label: "현장 통제 인력(돈내코)", location: "돈내코", capacity: 2 },
  { id: "res-crew-soesokkak", kind: "통제 인력", label: "현장 통제 인력(쇠소깍)", location: "쇠소깍", capacity: 2 },
  { id: "res-gate-donnaeko", kind: "차단기", label: "하상도로 차단기(돈내코)", location: "돈내코", capacity: 1 },
  { id: "res-gate-soesokkak", kind: "차단기", label: "하상도로 차단기(쇠소깍)", location: "쇠소깍", capacity: 1 },
]
