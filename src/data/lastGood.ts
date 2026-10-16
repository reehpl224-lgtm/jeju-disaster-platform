/**
 * 호출이 실패해도 직전에 성공한 값을 돌려주는 감싸개 — 기상청 쪽이 가끔 504를 줘도 화면이 "데이터 없음"·샘플로 깜빡이지 않게 한다.
 * 실패하면 먼저 한 번 더 시도하고(retries), 그래도 안 되면 maxAgeMs 안의 직전 성공 값을 쓴다. 처음부터 실패하면(직전 값이 없으면) 오류를 그대로 던진다.
 * 인자별로 따로 보관한다(같은 함수를 다른 인자로 부르면 서로 섞이지 않는다).
 */
export function withLastGood<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  { maxAgeMs = 15 * 60 * 1000, retries = 1, retryDelayMs = 1000 }: { maxAgeMs?: number; retries?: number; retryDelayMs?: number } = {},
): (...args: A) => Promise<T> {
  const last = new Map<string, { at: number; value: T }>()
  return async (...args: A) => {
    const key = JSON.stringify(args)
    let error: unknown
    for (let i = 0; i <= retries; i++) {
      try {
        const value = await fn(...args)
        last.set(key, { at: Date.now(), value })
        return value
      } catch (e) {
        error = e
        if (i < retries) await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      }
    }
    const prev = last.get(key)
    if (prev && Date.now() - prev.at < maxAgeMs) return prev.value
    throw error
  }
}
