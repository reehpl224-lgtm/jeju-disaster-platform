import type { KeyboardEvent } from "react"

/**
 * 탭 목록(role="tablist")의 키보드 조작 — WAI-ARIA 탭 패턴. 방향키로 이웃 탭으로 이동(끝에서 순환)하고,
 * Home/End로 처음·끝으로 간다. 이동한 탭은 바로 선택(click)된다. 가로 탭은 ←/→, 세로 레일은 ↑/↓.
 */
export function onTabListKeyDown(e: KeyboardEvent<HTMLElement>, orientation: "horizontal" | "vertical") {
  const [prev, next] = orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"]
  if (![prev, next, "Home", "End"].includes(e.key)) return
  const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'))
  const i = tabs.findIndex((t) => t === document.activeElement)
  if (i < 0 || tabs.length === 0) return
  const n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === next ? 1 : -1) + tabs.length) % tabs.length
  e.preventDefault()
  tabs[n].focus()
  tabs[n].click()
}
