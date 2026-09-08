import type { HeatLevelInfo, HeatRouteTip, HeatShelter } from "../types/heat"

/**
 * 폭염 위기단계 — 기상청 폭염특보 공식 기준(참고용)을 사용. 주의보: 체감온도 33℃ 이상 2일 이상
 * 지속 예상. 경보: 체감온도 35℃ 이상 2일 이상 지속 예상. 실제 발령은 기상청 발표를 따른다.
 */
export const heatLevelInfo: HeatLevelInfo = {
  level: "warning",
  label: "폭염주의보",
  feelsLikeC: 34.2,
  criteria: "기상청 폭염특보 기준 — 체감온도 33℃ 이상 2일 이상 지속 시 주의보, 35℃ 이상 시 경보",
  updatedAt: "14:00",
}

/** "무더위 쉼터를 몰라서 못 간다"는 현장 지적 반영 — 경로당·마을회관 등 실제 쉼터 유형으로 구성 */
export const heatShelters: HeatShelter[] = [
  { id: "hs-1", name: "이도1동 경로당", region: "제주시", address: "제주시 이도1동", type: "경로당", capacity: 30 },
  { id: "hs-2", name: "삼도2동 마을회관", region: "제주시", address: "제주시 삼도2동", type: "마을회관", capacity: 40 },
  { id: "hs-3", name: "한경면 복지회관", region: "제주시", address: "제주시 한경면", type: "복지관", capacity: 60 },
  { id: "hs-4", name: "대정읍 경로당", region: "서귀포시", address: "서귀포시 대정읍", type: "경로당", capacity: 25 },
  { id: "hs-5", name: "표선면 마을회관", region: "서귀포시", address: "서귀포시 표선면", type: "마을회관", capacity: 35 },
]

/** 열섬지도 기반 "시원한 길/더운 길" 안내 — MVP는 정밀 지도 대신 대표 구간 리스트로 표현 */
export const heatRouteTips: HeatRouteTip[] = [
  { id: "hr-1", kind: "cool", name: "삼성혈 녹지길", detail: "가로수 그늘 구간 70% 이상, 체감온도 -2~3℃" },
  { id: "hr-2", kind: "cool", name: "한천 산책로 그늘구간", detail: "하천변 그늘 지속, 벤치·물놀이터 인접" },
  { id: "hr-3", kind: "hot", name: "탑동 해변로 노출 구간", detail: "아스팔트 노출 구간 장시간 보행 주의" },
  { id: "hr-4", kind: "hot", name: "신제주 로터리 일대", detail: "그늘 부족, 오후 2~5시 체감온도 상승 구간" },
]
