import { useId, type ReactNode } from "react"
import { DragScrollTabs } from "../board/DragScrollTabs"
import { SpSample } from "./primitives"

export interface SpDockTab {
  key: string
  label: string
  content: ReactNode
  /** 머리 제목 — 생략하면 탭 이름(좌측 패널과 같다). 방재메신저·안전뉴스처럼 디자인이 다른 제목을 쓰는 탭만 지정 */
  headTitle?: string
  /** 제목 옆 "샘플" 표식 */
  sample?: boolean
}

/**
 * 종합상황 우측 패널 — 제목 줄 + 가로 언더라인 탭 10개(상황전파 · 센서정보 · 센서 추이 · 대응현황 · 담당자 · 보고서 · 자산현황 ·
 * AI 분석 · 방재메신저 · 안전뉴스). 제목 위치는 좌측 패널과 같다.
 */
export function SummaryRightDock({ tabs, activeKey, onSelect }: { tabs: SpDockTab[]; activeKey: string; onSelect: (key: string) => void }) {
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0]
  const baseId = useId()
  return (
    <aside className="dock dock--right">
      <section className="panel panel--right" style={{ borderRadius: "1rem" }}>
        {/* 좌측 패널과 같은 구성 — 제목 줄 위, 그 아래 탭 줄 */}
        <div className="panel__head">
          <h2 className="panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {active?.headTitle ?? active?.label}
            {active?.sample && <SpSample />}
          </h2>
        </div>
        <DragScrollTabs label="대응 패널 탭">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`${baseId}-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-controls={`${baseId}-panel`}
              aria-selected={tab.key === active?.key}
              onClick={() => onSelect(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </DragScrollTabs>
        <div className="panel__scroll" id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active?.key}`}>
          {active?.content}
        </div>
      </section>
    </aside>
  )
}
