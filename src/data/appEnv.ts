/**
 * 스테이징(모의 데이터) 빌드 여부 — `npm run build:staging`(vite --mode staging)에서
 * VITE_DATA_MODE=simulation일 때만 참. 켜지면 특보·강우·해양·태풍 실시간 API 호출을 막고
 * 모의값으로 대체한다(동네예보는 재난 판정에 쓰이지 않는 참고값이라 제외 — staging-scenario-review 문서 §5).
 */
// import.meta.env는 Vite가 주입한다 — node --test로 .ts를 직접 돌리는 테스트 실행기에는 없어 optional chaining으로 방어한다.
export const IS_SIMULATION_MODE = import.meta.env?.VITE_DATA_MODE === "simulation"

/**
 * 같은 계정의 GitHub Pages 등으로 배포하면 스테이징과 기존 사이트의 origin이 같을 수 있어
 * localStorage 키·BroadcastChannel 이름·상세 창(window.open target) 이름에 접두어를 붙여 분리한다.
 */
export function scopedKey(key: string): string {
  return IS_SIMULATION_MODE ? `staging-${key}` : key
}
