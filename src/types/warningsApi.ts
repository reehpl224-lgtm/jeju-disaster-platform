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
}

export interface WarningsResponse {
  windowStart: string
  windowEnd: string
  entries: WarningEntry[]
}
