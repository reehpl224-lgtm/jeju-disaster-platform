/** 기상청 API허브 기상특보 자료(wrn_met_data.php) 실시간 연동 — kma-weather-proxy(Vercel)의 /api/warnings 경유 */

export interface WarningEntry {
  tmFc: string // 발표시각(KST, YYYYMMDDHHmm)
  tmEf: string // 발효시각(KST, YYYYMMDDHHmm)
  regId: string
  regionLabel: string // "제주시" | "서귀포시"
  wrn: string // 특보종류 코드
  wrnLabel: string // 강풍/호우/폭염 등
  lvl: string // 기상청 LVL "1"예비특보|"2"주의보|"3"경보 — 이름·등급은 data/warningLevel.ts로 정한다
  lvlLabel: string // (프록시가 붙인 이름 — 쓰지 않는다)
  /** 발표 구분(CMD) — 1 발표 · 2 대치 · 3 해제 · 4 대치해제 · 5 연장 · 6 변경 · 7 변경해제. 옛 프록시 응답엔 없다 */
  cmd?: string
  grd?: string
  /** resolveWarnings가 채운다 — active 발효 중 · released 해제됨 · changed 다른 수준으로 바뀌어 끝남. 없으면 발효 여부를 모른다 */
  state?: "active" | "released" | "changed"
  /** 해제·변경으로 끝난 발표 시각(KST, YYYYMMDDHHmm) */
  endAt?: string
  /** 변경으로 끝났을 때 바뀐 수준(LVL) */
  changedLvl?: string
}

export interface WarningsResponse {
  windowStart: string
  windowEnd: string
  entries: WarningEntry[]
}
