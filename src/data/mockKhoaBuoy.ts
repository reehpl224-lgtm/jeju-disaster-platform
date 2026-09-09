/**
 * 실측 데이터 — 국립해양조사원(KHOA) 해양관측부이 실시간 API(data.go.kr, TW_0075·KG_0021·KG_0028).
 * mockAqua.ts의 khoaLiveObservations(수온·염분)와 같은 2026-09-09 확인 시점 스냅샷이며, 여기서는
 * 연안·태풍 메뉴에서 쓰는 파고·풍속·기압 필드를 추가로 담는다(정적 프로토타입이라 재조회 없음).
 */
export const khoaBuoyMarineConditions = [
  {
    id: "khoa-tw0075",
    stationName: "중문해수욕장",
    stationCode: "TW_0075",
    lat: 33.2345,
    lng: 126.40955,
    windDirDeg: 92,
    windSpeedMs: 9.4,
    pressureHpa: 1011.6,
    waveHeightM: 1.0,
    wavePeriodSec: 6.9,
    observedAt: "2026-09-09 15:00",
  },
  {
    id: "khoa-kg0021",
    stationName: "제주남부",
    stationCode: "KG_0021",
    lat: 32.09041,
    lng: 126.96586,
    windDirDeg: 37,
    windSpeedMs: 11.3,
    pressureHpa: 1011.2,
    waveHeightM: 2.88,
    wavePeriodSec: 7.8,
    observedAt: "2026-09-09 14:00",
  },
  {
    id: "khoa-kg0028",
    stationName: "제주해협",
    stationCode: "KG_0028",
    lat: 33.70011,
    lng: 126.5905,
    windDirDeg: 84,
    windSpeedMs: 7.6,
    pressureHpa: 1012.7,
    waveHeightM: 2.14,
    wavePeriodSec: 8.5,
    observedAt: "2026-09-09 14:00",
  },
]
