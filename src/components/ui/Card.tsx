import type { PropsWithChildren, ReactNode } from "react"

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  /** 실제로 연동해서 가져올 수 없는 완전 가상 시나리오 더미데이터 — 제목 앞에 "*" 표시(실시간 API·KHOA 실측 스냅샷·UI 쇼케이스는 제외) */
  dummy?: boolean
}

export function Card({ title, subtitle, action, className = "", dummy, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-lg border border-white/20 bg-panel p-4 md:px-6 md:py-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            {title && (
              <h2 className="text-base font-bold text-white">
                {dummy && (
                  <span aria-hidden title="실제로 연동해서 가져올 수 없는 완전 가상 시나리오 더미데이터입니다">
                    *{" "}
                  </span>
                )}
                {title}
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
