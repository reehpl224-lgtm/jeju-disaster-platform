import type { CctvCamera } from "../types/domain"

/**
 * 도 통합관제센터(도 자체 관제) CCTV 샘플 — 스테이징 전용. '일반' 분야(하천·월파·적설·해안관측에 속하지 않는 도심·관광지 관제용)에 해당한다.
 * 도 CCTV 시스템(약 12,000대)은 섬엔지니어링 협의·공문 승인 뒤 목록을 받을 예정이라, 그 전까지 분야 목록을 확인하려고 임의의 카메라를 둔다.
 * 위치는 근사값이고 영상 주소는 없다. 프로토타입·로컬에는 넣지 않는다(실제 목록이 오면 이 파일과 cctvLive.ts의 호출만 지운다).
 */
export const PROVINCE_SAMPLE_PREFIX = "province-sample-"

const SPOTS: [string, number, number][] = [
  ["제주도청 정문", 33.4891, 126.4983],
  ["종합상황실 앞 교차로", 33.4896, 126.4989],
  ["동문시장 입구", 33.5129, 126.5287],
  ["탑동 광장", 33.5183, 126.5231],
  ["서귀포 매일올레시장", 33.2487, 126.5633],
  ["중문관광단지 입구", 33.2559, 126.4128],
  ["성산일출봉 주차장", 33.4586, 126.9422],
]

export function provinceSampleCctv(): CctvCamera[] {
  return SPOTS.map(([place, lat, lng], i) => ({
    id: `${PROVINCE_SAMPLE_PREFIX}${i + 1}`,
    name: place,
    address: "도 통합관제센터 CCTV (샘플)",
    domain: "general",
    operator: "도 자체관제",
    status: "online",
    lastFrameAt: "",
    lat,
    lng,
  }))
}
