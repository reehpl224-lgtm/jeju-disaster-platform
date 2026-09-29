import type { ReactNode } from "react"
import { useDragScroll } from "../../hooks/useDragScroll"
import { onTabListKeyDown } from "./tabKeys"

/**
 * 가로 탭 바 — 마우스로 눌러 좌우로 끌면 스크롤된다(useDragScroll). 훅을 이 컴포넌트 안에 가둬서 사용하는 쪽이
 * ref 객체를 렌더 중에 건드리지 않게 한다(react/refs lint 경고 원인이었음).
 */
export function DragScrollTabs({ children, label }: { children: ReactNode; label?: string }) {
  const { ref, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onPointerCancel, onClickCapture } = useDragScroll<HTMLDivElement>()
  return (
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
  )
}
