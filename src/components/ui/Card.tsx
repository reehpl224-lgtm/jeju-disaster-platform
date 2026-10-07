import type { PropsWithChildren, ReactNode } from "react"

import { SourceTag } from "./SourceTag"
import type { DataSource } from "./dataSource"

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  /** 실제로 연동해서 가져올 수 없는 완전 가상 더미데이터 — 제목 앞에 "*" 표시(실시간 API·KHOA 실측 스냅샷·UI 쇼케이스는 제외) */
  dummy?: boolean
  /** 실시간 API / 실측 스냅샷 표식(기준 시각 포함) — dummy와 함께 쓰지 않는다 */
  source?: DataSource
}

export function Card({ title, subtitle, action, className = "", dummy, source, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-lg border border-white/20 bg-panel p-4 md:px-6 md:py-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-base font-bold text-white">
                {dummy && (
                  <span aria-hidden title="실제로 연동해서 가져올 수 없는 완전 가상 더미데이터입니다">
                    *{" "}
                  </span>
                )}
                {title}
                {source && <SourceTag source={source} />}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
