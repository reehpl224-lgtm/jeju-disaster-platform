/**
 * 실측 데이터 — 국립해양조사원(KHOA) 해양관측부이 실시간 API(data.go.kr, TW_0075·KG_0021·KG_0028).
 * mockAqua.ts의 khoaLiveObservations(수온·염분)와 같은 2026-09-09 확인 시점 스냅샷이며, 여기서는
 * 연안·태풍 메뉴에서 쓰는 파고·풍속·기압 필드를 추가로 담는다(정적 프로토타입이라 재조회 없음).
 */
/** 2026-09-29 초기화 — 스냅샷도 비웠다(사용자 요청: 실시간 API만 유지). 다시 넣을 땐 API 응답을 관측 시각(observedAt)과 함께 그대로 옮길 것 */
export const khoaBuoyMarineConditions: {
  id: string
  stationName: string
  stationCode: string
  lat: number
  lng: number
  windDirDeg: number
  windSpeedMs: number
  pressureHpa: number
  waveHeightM: number
  wavePeriodSec: number
  observedAt: string
}[] = []
