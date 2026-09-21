import type { PropsWithChildren, ReactNode } from "react"

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function Card({ title, subtitle, action, className = "", children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-lg border border-white/20 bg-panel p-4 md:px-6 md:py-5 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-bold text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
