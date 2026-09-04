import type { PropsWithChildren, ReactNode } from "react"

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function Card({ title, subtitle, action, className = "", children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
