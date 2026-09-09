/** 기상청 API허브 태풍정보(typ_lst.php) 실시간 연동 — kma-weather-proxy(Vercel)의 /api/typhoon 경유 */

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
