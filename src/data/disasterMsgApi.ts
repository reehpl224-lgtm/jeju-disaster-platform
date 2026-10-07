/**
 * 긴급재난문자(제주 수신분) — 행정안전부 재난안전데이터공유플랫폼 DSSP-IF-00247에서 scripts/fetch-disaster-msgs.mjs로 받아 둔
 * 파일(public/data/disaster-msgs-jeju.json)을 읽는다. 실시간 API가 아닌 이유(Vercel IP에서 키가 거부됨)는 스크립트 머리말 참고.
 * 문자는 새로 오므로 스크립트를 다시 실행해 파일을 갱신해야 최신이 된다.
 */
export interface DisasterMsg {
  id: string
  /** ISO(+09:00) */
  at: string
  region: string
  /** 안전안내 | 긴급재난 | 위급재난 */
  step: string
  /** 재난 구분(기타·호우·태풍·화재 등) */
  kind: string
  text: string
}

export interface DisasterMsgSnapshot {
  messages: DisasterMsg[]
  /** 파일을 받아 둔 시각 */
  fetchedAt: string
}

export async function fetchDisasterMessages(): Promise<DisasterMsgSnapshot> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/disaster-msgs-jeju.json`, { cache: "no-store" })
  // 파일이 없을 때 개발 서버는 index.html을 200으로 돌려주므로 JSON 응답인지도 본다
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) throw new Error("받아 둔 재난문자 파일이 없습니다")
  const file = (await res.json()) as { messages?: DisasterMsg[]; fetchedAt?: string }
  return { messages: Array.isArray(file.messages) ? file.messages : [], fetchedAt: String(file.fetchedAt ?? "") }
}
