import type { CctvCamera } from "../types/domain"

/**
 * 서귀포시 재난감시 CCTV 샘플 — 스테이징 전용.
 * 요구사항 '서귀포시 CCTV 연계 대상 목록'(하천 34·월파 25·물놀이 14·적설 7)의 목록 자료가 2026년 10월 중순 도착할 예정이라,
 * 그 전까지 화면 구성을 확인하려고 같은 대수의 가짜 카메라를 둔다. 위치는 서귀포 하천·해안·한라산 도로 부근의 근사값이고 영상 주소는 없다.
 * 프로토타입·로컬에는 넣지 않는다(실제 목록이 오면 이 파일과 cctvLive.ts의 호출만 지운다).
 */
type Spec = { domain: CctvCamera["domain"]; kind: string; count: number; spots: [string, number, number][] }

const SPECS: Spec[] = [
  {
    domain: "river",
    kind: "하천 감시",
    count: 34,
    spots: [
      ["천지연", 33.2468, 126.5547], ["정방", 33.2458, 126.5712], ["동홍천", 33.2623, 126.589], ["서홍천", 33.2594, 126.5478],
      ["연외천", 33.254, 126.539], ["강정천", 33.261, 126.48], ["악근천", 33.2698, 126.4655], ["예래천", 33.2615, 126.4305],
      ["효돈천", 33.2755, 126.6168], ["창고천", 33.3, 126.704],
    ],
  },
  {
    domain: "coast",
    kind: "월파 감시",
    count: 25,
    spots: [
      ["모슬포항", 33.2145, 126.2512], ["화순항", 33.2325, 126.3395], ["대포항", 33.2315, 126.4272], ["서귀포항", 33.2395, 126.5628],
      ["남원포구", 33.2755, 126.7205], ["위미항", 33.2745, 126.6665], ["표선항", 33.3225, 126.8365], ["사계포구", 33.2305, 126.3055],
    ],
  },
  {
    domain: "general",
    kind: "물놀이 안전감시",
    count: 14,
    spots: [
      ["중문색달해변", 33.2448, 126.4125], ["표선해변", 33.3262, 126.8315], ["쇠소깍", 33.254, 126.6205], ["사계해변", 33.2272, 126.3125],
      ["하례리 계곡", 33.3, 126.6075],
    ],
  },
  {
    domain: "snow",
    kind: "적설 감시",
    count: 7,
    spots: [["1100도로", 33.3625, 126.4615], ["516도로", 33.34, 126.575], ["산록남로", 33.3115, 126.5015], ["성판악", 33.3855, 126.6215]],
  },
]

export const SEOGWIPO_SAMPLE_PREFIX = "seogwipo-sample-"

export function seogwipoSampleCctv(): CctvCamera[] {
  return SPECS.flatMap((s) =>
    Array.from({ length: s.count }, (_, i) => {
      const [place, lat, lng] = s.spots[i % s.spots.length]
      const round = Math.floor(i / s.spots.length)
      // 같은 장소의 카메라가 한 점에 겹치지 않게 조금씩 비껴 놓는다
      const dLat = round * 0.0021 + (i % 2) * 0.0007
      const dLng = round * 0.0026 - (i % 3) * 0.0006
      return {
        id: `${SEOGWIPO_SAMPLE_PREFIX}${s.domain}-${i + 1}`,
        name: `${place} ${s.kind} ${String(round + 1).padStart(2, "0")}`,
        address: `서귀포시 ${s.kind} CCTV (샘플)`,
        domain: s.domain,
        operator: "서귀포시",
        status: i % 11 === 10 ? "offline" : "online",
        lastFrameAt: "",
        lat: +(lat + dLat).toFixed(5),
        lng: +(lng + dLng).toFixed(5),
      } satisfies CctvCamera
    }),
  )
}
