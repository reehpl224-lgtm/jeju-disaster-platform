/**
 * 기상청 API허브 호출 공통 — 특보·태풍·해양 프록시가 같이 쓴다.
 * API허브가 가끔 504(시간 초과)·빈 응답을 줘서(2026-10-16 실측: 호출 6~10번에 1~2번) 그대로 502로 넘기면 화면이 "데이터 없음"으로 깜빡인다.
 * 그래서 ① 5xx·네트워크 오류·시간 초과는 짧게 쉬었다 다시 시도하고(4xx는 다시 해도 같아 바로 실패),
 * ② 끝까지 안 되면 직전에 받은 정상 값을 일정 시간(maxAgeMs) 안에서 stale 표시와 함께 돌려준다.
 */
export interface UpstreamOptions {
  attempts?: number
  /** 한 번 호출의 시간 제한(ms) */
  timeoutMs?: number
  /** 다시 시도하기 전 쉬는 시간(ms) — 시도 횟수만큼 늘어난다 */
  backoffMs?: number
  /** 시험용으로 바꿔 끼운다 */
  fetchImpl?: typeof fetch
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** 성공하면 본문 바이트를 돌려준다(인코딩은 부르는 쪽이 푼다). 끝까지 실패하면 마지막 오류를 던진다 */
export async function fetchUpstream(url: string, opts: UpstreamOptions = {}): Promise<ArrayBuffer> {
  const { attempts = 3, timeoutMs = 7000, backoffMs = 400, fetchImpl = fetch } = opts
  let last: Error = new Error("기상청 API허브 호출 실패")
  for (let i = 0; i < attempts; i++) {
    let retryable = true
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) })
      const buf = await res.arrayBuffer()
      if (res.ok) return buf
      last = new Error(`기상청 API허브 응답 오류: HTTP ${res.status} — ${new TextDecoder("utf-8").decode(buf).slice(0, 200)}`)
      retryable = res.status >= 500
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
    }
    if (!retryable) break
    if (i < attempts - 1) await sleep(backoffMs * (i + 1))
  }
  throw last
}

/** 키별 직전 정상 값 — 서버리스 인스턴스 메모리에 두는 최선 보관이라 인스턴스가 바뀌면 비어 있을 수 있다 */
export function staleCache<T>(maxAgeMs: number) {
  const last = new Map<string, { at: number; value: T }>()
  return {
    set(key: string, value: T) {
      last.set(key, { at: Date.now(), value })
    },
    get(key: string): { value: T; ageSec: number } | null {
      const hit = last.get(key)
      if (!hit || Date.now() - hit.at > maxAgeMs) return null
      return { value: hit.value, ageSec: Math.round((Date.now() - hit.at) / 1000) }
    },
  }
}
