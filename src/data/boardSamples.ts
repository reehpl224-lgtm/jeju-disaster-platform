import { IS_STAGING } from "./appMode"
import type { BoardRoute, BoardService, BoardStateId } from "./boardTypes"
import { HEAT, HEAVY_RAIN, RIVER, TYPHOON } from "./boardSamplesA"
import { SNOW, TSUNAMI, WILDFIRE } from "./boardSamplesB"
import { AQUA, COAST } from "./boardSamplesC"

/** 처음 보이는 상태 — 프로토타입·로컬은 평시(값 없음), 스테이징은 샘플 "진행" 상태 */
export const SB_DEFAULT_STATE: BoardStateId = IS_STAGING ? "progress" : "calm"

/** 서비스 보드 시안 데이터 — 서비스 id(DomainBoardPage의 domain)로 찾는다 */
export const BOARD_SERVICES: Record<string, BoardService> = {
  river: RIVER,
  "heavy-rain": HEAVY_RAIN,
  typhoon: TYPHOON,
  heat: HEAT,
  wildfire: WILDFIRE,
  tsunami: TSUNAMI,
  snow: SNOW,
  aqua: AQUA,
  coast: COAST,
}

/** 보드 패널의 링크가 가는 기존 상세 화면 — 서비스마다 메뉴 이름이 달라 한곳에서 푼다 */
export function boardRoute(s: BoardService, route: BoardRoute): string {
  const b = s.base
  switch (route) {
    case "alert":
      return s.id === "aqua" || s.id === "coast" ? `${b}/alerts` : `${b}/alert`
    case "dispatch":
      return `${b}/dispatch`
    case "control":
      return `${b}/control`
    case "analysis":
      return s.id === "aqua" ? `${b}/prediction` : s.id === "coast" ? `${b}/events` : `${b}/analysis`
    case "closure":
      return `${b}/closure`
    case "esop":
      return "/esop"
    case "data":
      return `${b}/data`
    default:
      return `${b}/dashboard`
  }
}
