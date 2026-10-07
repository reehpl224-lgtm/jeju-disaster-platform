import { useState } from "react"
import type { SpCategory, SpEvent } from "../../data/sidePanelSamples"

/** L1·L2가 같이 쓰는 필터(유형 · 검색 · 기간 · 발령/해제) — 값은 패널마다 따로 가진다 */
export function useEventFilters() {
  const [cat, setCat] = useState<SpCategory | null>(null)
  const [issued, setIssued] = useState(true)
  const [lifted, setLifted] = useState(true)
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const q = query.trim()
  /** 발령/해제·검색어로 거른다(유형은 패널이 칩과 함께 따로 쓴다) */
  const pass = (e: SpEvent) => (e.status === "발령" ? issued : lifted) && (!q || e.title.includes(q) || e.detail.includes(q))
  return { cat, setCat, issued, setIssued, lifted, setLifted, query, setQuery, searchOpen, setSearchOpen, pass }
}
export type EventFilters = ReturnType<typeof useEventFilters>
