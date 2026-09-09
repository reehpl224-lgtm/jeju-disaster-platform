/** 기상청 API허브 태풍정보(typ_lst.php/typ_now.php) 실시간 연동 — kma-weather-proxy(Vercel)의 /api/typhoon 경유 */

export interface TyphoonNameEntry {
  year: string
  seq: string
  /** 이름 사용 시작 시각 (UTC, YYYYMMDDHHmm) */
  tmStUtc: string
  /** 이름 사용 종료 시각 (UTC, YYYYMMDDHHmm) */
  tmEdUtc: string
  nameKo: string
  nameEn: string
  note: string
}

/** typ_now.php(현재 진행 중인 태풍의 실시간 위치/기압/풍속+예측) 한 행 */
export interface TyphoonNowEntry {
  ft: string // "0"=분석, "1"=예측
  year: string
  typ: string // 태풍번호
  seq: string // 발표번호
  typTmUtc: string // 분석시각 (UTC)
  ftTmUtc: string // 예측시각 (UTC)
  lat: string
  lon: string
  dir: string // 진행방향(16방위기호)
  speedKmh: string
  pressureHpa: string
  maxWindMs: string
  rad15Km: string
  rad25Km: string
}
