import type { TyphoonReport } from "../types/typhoon"

/**
 * 기상청 발표 태풍 정보 — 자체 실측 장비 없이 전량 기상청 자료를 수신하는 구조이므로, 하천/호우처럼
 * "관측망 현황"이 없다. 발표 시각 역순으로 최신 정보가 먼저 온다. 다른 mock 데이터와 동일한 시간대
 * (2026-09-08 오후)로 맞췄다.
 */
export const typhoonReports: TyphoonReport[] = [
  {
    id: "ty-1",
    name: "제24호 크로반",
    status: "태풍경보",
    issuedAt: "2026-09-08 14:00",
    location: "일본 오키나와 북동쪽 약 210km 부근 해상",
    speedKmh: 24,
    pressureHpa: 985,
    maxWindMs: 28,
  },
  {
    id: "ty-2",
    name: "제24호 크로반",
    status: "태풍주의보",
    issuedAt: "2026-09-08 09:00",
    location: "일본 오키나와 동쪽 약 340km 부근 해상",
    speedKmh: 20,
    pressureHpa: 990,
    maxWindMs: 24,
  },
  {
    id: "ty-3",
    name: "제24호 크로반",
    status: "예비특보",
    issuedAt: "2026-09-07 21:00",
    location: "일본 오키나와 동남동쪽 약 480km 부근 해상",
    speedKmh: 18,
    pressureHpa: 994,
    maxWindMs: 21,
  },
]

export const typhoonSource = {
  note: "자체 실측 장비 없음 — 기상청 발표 자료를 전량 수신해 그대로 표출합니다.",
  relatedLegacySystem: "민방위경보시스템 (중앙 시스템과만 연계, 도 자체 연계 없음)",
}
