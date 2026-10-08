import { useId, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { DragScrollTabs } from "./DragScrollTabs"
import { onTabListKeyDown } from "./tabKeys"
import type { RiskLevel } from "../../types/domain"
import { riskStyles } from "../ui/riskStyles"

/** demo-10 클론의 위험등급 배지(.risk) — label을 안 주면 등급 이름을 그대로 쓴다 */
export function Risk({
  level,
  label,
  solid,
}: {
  level: RiskLevel
  label?: string
  solid?: boolean
}) {
  return <span className={`risk risk--${level}${solid ? " risk--solid" : ""}`}>{label ?? riskStyles[level].label}</span>
}

export interface DockTab {
  key: string
  label: string
  content: ReactNode
  /** 실제로 연동해서 가져올 수 없는 완전 가상 더미데이터 탭 — 라벨 앞에 "*" 표시 */
  dummy?: boolean
}

/**
 * 패널 + 세로 탭 레일 (클론의 .dock). 레일이 붙는 쪽 모서리만 각지게 — 원본 규칙.
 * rail="right"면 좌측 패널 오른쪽에, rail="left"면 우측 패널 왼쪽에 레일이 붙는다.
 */
export function SideTabsDock({
  tabs,
  rail,
  activeKey,
  onSelect,
  headExtra,
  topContent,
  dense,
  equal,
}: {
  tabs: DockTab[]
  rail: "left" | "right"
  activeKey: string
  onSelect: (key: string) => void
  headExtra?: ReactNode
  /** 탭과 무관하게 항상 보이는 영역(제목 줄 아래, 탭 콘텐츠 위) — 예: 지도 분야 필터 칩 */
  topContent?: ReactNode
  dense?: boolean
  /** 탭 높이를 모두 같게(글자 수와 무관) */
  equal?: boolean
}) {
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0]
  const panelSide = rail === "right" ? "left" : "right"
  const panelId = `${useId()}-panel`
  return (
    <aside className={`dock ${panelSide === "left" ? "dock--left" : "dock--right"}`}>
      <section className={`panel panel--${panelSide}`} id={panelId} role="tabpanel" aria-label={active?.label}>
        <div className="panel__head">
          <h2 className="panel__title">
            {active?.dummy && (
              <span aria-hidden title="실제로 연동해서 가져올 수 없는 완전 가상 더미데이터입니다">
                *{" "}
              </span>
            )}
            {active?.label}
          </h2>
          {headExtra}
        </div>
        {topContent}
        <div className="panel__scroll">{active?.content}</div>
      </section>
      <div className={`rail rail--${rail}${dense ? " rail--dense" : ""}${equal ? " rail--equal" : ""}`} role="tablist" aria-orientation="vertical" aria-label="패널 탭" onKeyDown={(e) => onTabListKeyDown(e, "vertical")}>
        {tabs.map((tab) => (
          // 세로쓰기(writing-mode) 글자는 보조기기가 이름을 못 읽는 경우가 있어 aria-label로 이름을 명시한다
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-label={tab.label}
            aria-controls={panelId}
            aria-selected={tab.key === active?.key}
            onClick={() => onSelect(tab.key)}
          >
            <span aria-hidden>{tab.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

/** 가로 언더라인 탭이 들어간 우측 패널 (GIS 상황의 타임라인/특보/예보 패널) */
export function HorizontalTabsDock({
  tabs,
  filters,
  activeKey,
  onSelect,
}: {
  tabs: DockTab[]
  filters?: ReactNode
  activeKey: string
  onSelect: (key: string) => void
}) {
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0]
  const baseId = useId()
  return (
    <aside className="dock dock--right">
      <section className="panel panel--right" style={{ borderRadius: "1rem" }}>
        <DragScrollTabs label="패널 탭">
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
              {tab.dummy && (
                <span aria-hidden title="실제로 연동해서 가져올 수 없는 완전 가상 더미데이터입니다">
                  *{" "}
                </span>
              )}
              {tab.label}
            </button>
          ))}
        </DragScrollTabs>
        {filters}
        <div className="panel__scroll" id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active?.key}`}>
          {active?.content}
        </div>
      </section>
    </aside>
  )
}

interface StripCard {
  id: string
  title: string
  icon: string
  href: string
  kind?: "legacy" | "pilot"
  counts: { warning: number; alert: number; danger: number; caution?: number }
}

const STRIP_TIERS = [
  { key: "caution", level: "caution" },
  { key: "warning", level: "warning" },
  { key: "alert", level: "alert" },
  { key: "danger", level: "danger" },
] as const

function dominant(counts: StripCard["counts"]): RiskLevel {
  if (counts.danger > 0) return "danger"
  if (counts.alert > 0) return "alert"
  if (counts.warning > 0) return "warning"
  if ((counts.caution ?? 0) > 0) return "caution"
  return "safe"
}

/** 하단 재난 유형(서비스) 카드 스트립 — 머리(링크) + 등급별 건수 바디 */
export function ServiceStrip({ cards, currentId }: { cards: StripCard[]; currentId?: string }) {
  return (
    <div className="strip" id="service-status-cards">
      <ul>
        {cards.map((card) => {
          const top = dominant(card.counts)
          // 관심 등급은 카드가 실제로 그 값을 가진(양식장 등) 경우에만 줄을 만든다
          const tiers = STRIP_TIERS.filter((t) => t.key !== "caution" || card.counts.caution !== undefined)
          return (
            <li key={card.id} className={card.id === currentId ? "is-current" : undefined}>
              <Link className="strip__head" to={card.href} title={`${card.title} 화면`}>
                {top !== "safe" && <span className={`dot dot--${top}`} title={`현재 최고 등급: ${riskStyles[top].label}`} />}
                <p>
                  {card.icon} {card.title}
                </p>
                {card.kind && (
                  <span className={`strip__kind strip__kind--${card.kind}`}>{card.kind === "pilot" ? "실증AX" : "레거시"}</span>
                )}
                <span className="arrow" aria-hidden>
                  ↗
                </span>
              </Link>
              <ul className="strip__body">
                {tiers.map((t) => {
                  const n = card.counts[t.key] ?? 0
                  return (
                    <li key={t.key}>
                      <span>{riskStyles[t.level].label}</span>
                      <span className={`n${n > 0 ? ` on-${t.level}` : ""}`}>{String(n).padStart(2, "0")}</span>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function StripToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="strip-toggle" aria-label="하단 패널 열기/닫기" aria-expanded={open} onClick={onToggle}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ transform: open ? undefined : "rotate(180deg)" }}
      >
        <path d="M5 9l7 6 7-6" />
      </svg>
    </button>
  )
}

export function MessengerFab({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="fab" aria-label="방재메신저" title="방재메신저" onClick={onClick}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
      </svg>
    </button>
  )
}
