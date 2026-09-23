import type { ReactNode } from "react"
import { Link } from "react-router-dom"
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
}: {
  tabs: DockTab[]
  rail: "left" | "right"
  activeKey: string
  onSelect: (key: string) => void
  headExtra?: ReactNode
  /** 탭과 무관하게 항상 보이는 영역(제목 줄 아래, 탭 콘텐츠 위) — 예: 지도 분야 필터 칩 */
  topContent?: ReactNode
  dense?: boolean
}) {
  const active = tabs.find((t) => t.key === activeKey) ?? tabs[0]
  const panelSide = rail === "right" ? "left" : "right"
  return (
    <aside className={`dock ${panelSide === "left" ? "dock--left" : "dock--right"}`}>
      <section className={`panel panel--${panelSide}`}>
        <div className="panel__head">
          <h2 className="panel__title">{active?.label}</h2>
          {headExtra}
        </div>
        {topContent}
        <div className="panel__scroll">{active?.content}</div>
      </section>
      <div className={`rail rail--${rail}${dense ? " rail--dense" : ""}`} role="tablist" aria-orientation="vertical">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active?.key}
            onClick={() => onSelect(tab.key)}
          >
            <span>{tab.label}</span>
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
  return (
    <aside className="dock dock--right">
      <section className="panel panel--right" style={{ borderRadius: "1rem" }}>
        <div className="tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === active?.key}
              onClick={() => onSelect(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {filters}
        <div className="panel__scroll">{active?.content}</div>
      </section>
    </aside>
  )
}

interface StripCard {
  id: string
  title: string
  icon: string
  href: string
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
