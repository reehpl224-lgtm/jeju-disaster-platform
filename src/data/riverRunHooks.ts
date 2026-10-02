import { useSyncExternalStore } from "react"
import { getRunState, subscribe } from "./riverRunState"

/** 하천 시나리오 실행 상태를 구독한다 — 같은 창의 다른 컴포넌트, 다른 창(BroadcastChannel) 변경에도 재렌더링된다 */
export function useRiverRun() {
  // 세 번째 인자는 서버 렌더(테스트의 renderToString)용 — 클라이언트 동작은 그대로다
  return useSyncExternalStore(subscribe, getRunState, getRunState)
}
