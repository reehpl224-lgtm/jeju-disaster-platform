import { CATEGORY_LABEL, type SpCategory } from "../../data/sidePanelSamples"
import type { EventFilters } from "./useEventFilters"

export function EventFilterBar({ f, rangeText }: { f: EventFilters; rangeText: string }) {
  return (
    <>
      <div className="sp-row">
        <label className="sp-field" style={{ flex: "1 1 0" }}>
          <select aria-label="유형" value={f.cat ?? "all"} onChange={(e) => f.setCat(e.target.value === "all" ? null : (e.target.value as SpCategory))}>
            <option value="all">전체</option>
            {(Object.keys(CATEGORY_LABEL) as SpCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="sp-iconbtn" aria-label="필터 설정(준비 중)" title="필터 설정 — 준비 중" disabled>
          ⚙
        </button>
        <button type="button" className="sp-iconbtn" aria-label="검색" aria-pressed={f.searchOpen} onClick={() => f.setSearchOpen(!f.searchOpen)}>
          ⌕
        </button>
      </div>
      {f.searchOpen && (
        <label className="sp-field">
          <input value={f.query} onChange={(e) => f.setQuery(e.target.value)} placeholder="검색 (제목·위치·지역)" aria-label="검색어" />
        </label>
      )}
      <div className="sp-field" aria-label="조회 기간">
        <span style={{ flex: "1 1 0" }}>{rangeText}</span>
        <span style={{ color: "var(--foreground-subtle)" }}>▦</span>
      </div>
      <div className="sp-checks">
        <label className="sp-check">
          <input type="checkbox" checked={f.issued} onChange={(e) => f.setIssued(e.target.checked)} /> 발령
        </label>
        <label className="sp-check">
          <input type="checkbox" checked={f.lifted} onChange={(e) => f.setLifted(e.target.checked)} /> 해제
        </label>
      </div>
    </>
  )
}
