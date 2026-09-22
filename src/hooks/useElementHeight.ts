import { useEffect, useRef, useState } from "react"

/**
 * 요소의 실측 높이(px)를 추적한다 — 텍스트가 줄바꿈되어 높이가 늘어나는 좁은 화면에서도
 * 그 위에 겹칠 수 있는 다른 오버레이의 여백을 정확히 계산하기 위해 사용.
 */
export function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, height] as const
}
