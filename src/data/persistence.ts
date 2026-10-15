/**
 * 저장 어댑터 — 데이터 저장소(역할·e-SOP·대응 기록·이용 이력·연계 오류·시나리오)가 값을 읽고 쓰는 유일한 출입구.
 * 지금은 브라우저(localStorage)에 JSON 문자열로 저장한다. DB를 붙일 때는 앱 시작 시 setPersistence()로 서버 연동 어댑터를 끼운다
 * (읽기는 동기라서 앱을 그리기 전에 서버 값을 미리 받아 메모리에 두고, 쓰기는 그 메모리를 고친 뒤 서버로 보내면 된다). docs/db/README.md 참고.
 */
export interface Persistence {
  /** 저장된 JSON 문자열(없으면 null) */
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const browser: Persistence = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
}

let current: Persistence = browser
export const persistence: Persistence = {
  getItem: (key) => current.getItem(key),
  setItem: (key, value) => current.setItem(key, value),
  removeItem: (key) => current.removeItem(key),
}
export function setPersistence(next: Persistence) {
  current = next
}
