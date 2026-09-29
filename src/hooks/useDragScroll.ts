import { useRef } from "react"

/**
 * 가로로 넘치는 탭 바(.panel .tabs 등)를 마우스로 눌러 좌우 드래그하면 스크롤(스와이프)되게 하는 훅.
 * 터치/펜은 브라우저 기본 스크롤을 그대로 쓰고, 마우스 드래그만 보강한다.
 * 드래그가 있었으면 버튼의 onClick이 실수로 터지지 않도록 클릭을 막는다.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const dragging = useRef(false)
  const moved = useRef(false)
  const start = useRef({ x: 0, scrollLeft: 0 })

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return
    const el = ref.current
    if (!el) return
    dragging.current = true
    moved.current = false
    start.current = { x: e.clientX, scrollLeft: el.scrollLeft }
    // 여기서 바로 setPointerCapture 하면 이후 click이 탭 버튼이 아니라 탭 바로 가서 탭이 눌리지 않는다 —
    // 실제로 끌기 시작(3px 초과)한 뒤에만 붙잡는다(onPointerMove)
  }

  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current
    if (!dragging.current || !el) return
    const dx = e.clientX - start.current.x
    if (!moved.current && Math.abs(dx) > 3) {
      moved.current = true
      el.setPointerCapture(e.pointerId)
      el.style.userSelect = "none"
    }
    if (moved.current) el.scrollLeft = start.current.scrollLeft - dx
  }

  function endDrag() {
    dragging.current = false
    const el = ref.current
    if (el) el.style.userSelect = ""
    // 드래그 후에는 보통 곧바로 click 이벤트가 뒤따라와 onClickCapture가 moved 플래그를 소비하지만,
    // (예: 포인터를 바깥에서 떼는 등) click이 아예 안 오는 경우를 대비해 다음 틱에 플래그를 정리한다 —
    // 그래야 이후의 무관한 클릭까지 막아버리는 일이 없다.
    if (moved.current) {
      setTimeout(() => {
        moved.current = false
      }, 0)
    }
  }

  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerLeave: endDrag,
    onPointerCancel: endDrag,
    onClickCapture,
  }
}
