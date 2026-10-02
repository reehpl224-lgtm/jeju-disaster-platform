import type { HeatShelter } from "../types/heat"
import type { khoaBuoyMarineConditions } from "./mockKhoaBuoy"

/**
 * 원본 mock이 비어 있어 화면 틀이 안 보이는 항목의 임의 샘플 — 실데이터 연동 전 레이아웃 확인용.
 * 원본(mockKhoaBuoy.ts·mockHeat.ts)에 값이 하나라도 들어오면 샘플은 자동으로 사라지고, 샘플이 보이는 동안에는
 * 화면에 "샘플 데이터" 안내(SampleNote)와 이름의 "(샘플)"이 붙는다. 기관 관측값·시설 정보가 아니다.
 */
export const sampleBuoys: typeof khoaBuoyMarineConditions = [
  { id: "sample-b1", stationName: "관측부이 A(샘플)", stationCode: "SAMPLE", lat: 0, lng: 0, windDirDeg: 0, windSpeedMs: 8.2, pressureHpa: 1008, waveHeightM: 1.4, wavePeriodSec: 6.5, observedAt: "0000-00-00 --:--" },
  { id: "sample-b2", stationName: "관측부이 B(샘플)", stationCode: "SAMPLE", lat: 0, lng: 0, windDirDeg: 0, windSpeedMs: 6.1, pressureHpa: 1010, waveHeightM: 0.9, wavePeriodSec: 5.8, observedAt: "0000-00-00 --:--" },
  { id: "sample-b3", stationName: "관측부이 C(샘플)", stationCode: "SAMPLE", lat: 0, lng: 0, windDirDeg: 0, windSpeedMs: 9.7, pressureHpa: 1006, waveHeightM: 2.1, wavePeriodSec: 7.2, observedAt: "0000-00-00 --:--" },
]

export const sampleShelters: HeatShelter[] = [
  { id: "sample-s1", name: "무더위쉼터 A(샘플)", region: "제주시", address: "주소 미정(샘플)", type: "경로당", capacity: 20 },
  { id: "sample-s2", name: "무더위쉼터 B(샘플)", region: "서귀포시", address: "주소 미정(샘플)", type: "마을회관", capacity: 35 },
  { id: "sample-s3", name: "무더위쉼터 C(샘플)", region: "제주시", address: "주소 미정(샘플)", type: "복지관", capacity: 60 },
]
