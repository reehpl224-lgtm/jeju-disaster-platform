import { useEffect, useState, type ReactNode } from "react"
import { useDragScroll } from "../../hooks/useDragScroll"
import { onTabListKeyDown } from "./tabKeys"

/**
 * 가로 탭 바 — 마우스로 눌러 좌우로 끌면 스크롤된다(useDragScroll). 훅을 이 컴포넌트 안에 가둬서 사용하는 쪽이
 * ref 객체를 렌더 중에 건드리지 않게 한다(react/refs lint 경고 원인이었음).
 * 탭이 넘쳐 가려진 쪽에는 ‹ › 화살표 버튼을 보여 준다(누르면 그 방향으로 한 뼘 이동) — 숨은 탭이 있다는 표시.
 */
export function DragScrollTabs({ children, label }: { children: ReactNode; label?: string }) {
  const { ref, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onPointerCancel, onClickCapture } = useDragScroll<HTMLDivElement>()
  const [edge, setEdge] = useState({ left: false, right: false })

  // 숨은 탭이 있는지 — 스크롤·크기 변화·탭 목록 변화가 있을 때마다 다시 잰다
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const left = el.scrollLeft > 2
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
      setEdge((p) => (p.left === left && p.right === right ? p : { left, right }))
    }
    measure()
    el.addEventListener("scroll", measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", measure)
      ro.disconnect()
    }
  }, [ref, children])

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.6), behavior: "smooth" })
  }

  return (
    <div className="tabs-wrap">
      {edge.left && (
        <button type="button" className="tabs-arrow tabs-arrow--left" aria-label="앞쪽 숨은 탭 보기" onClick={() => scrollBy(-1)}>
          ‹
        </button>
      )}
      <div
        className="tabs"
        role="tablist"
        aria-label={label}
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
        onKeyDown={(e) => onTabListKeyDown(e, "horizontal")}
      >
        {children}
      </div>
      {edge.right && (
        <button type="button" className="tabs-arrow tabs-arrow--right" aria-label="뒤쪽 숨은 탭 보기" onClick={() => scrollBy(1)}>
          ›
        </button>
      )}
    </div>
  )
}
