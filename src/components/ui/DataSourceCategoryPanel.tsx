import { RiskBadge } from "./RiskBadge"
import type { DataSourceCategory, ServiceDataSources } from "../../data/mockDataSourceCategories"

/** RiskBadge의 기존 색상 토큰을 재사용 — 실제 위험등급이 아니라 데이터 출처 구분 용도 */
const CATEGORY_META: Record<DataSourceCategory, { level: "safe" | "caution" | "info" | "offline"; label: string }> = {
  available: { level: "safe", label: "① 현재 사용 가능" },
  legacy: { level: "caution", label: "② 제주 레거시(미적용)" },
  requestable: { level: "info", label: "③ 요청 가능(실증서비스)" },
  missing: { level: "offline", label: "④ 현재 없는 데이터" },
}

const CATEGORY_ORDER: DataSourceCategory[] = ["available", "legacy", "requestable", "missing"]

/**
 * 서비스별 데이터 출처를 4단계(사용 가능/제주 레거시/요청 가능/없음)로 구분해 보여주는 패널.
 * 근거: docs/data-sources-by-service.md(2026-09-28) — 새 수치를 만들지 않고 그대로 옮김.
 */
export function DataSourceCategoryPanel({ sources }: { sources: ServiceDataSources }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CATEGORY_ORDER.map((cat) => {
        const items = sources[cat]
        const meta = CATEGORY_META[cat]
        return (
          <div key={cat} className="rounded-lg border border-border-subtle p-3">
            <RiskBadge level={meta.level} label={meta.label} solid />
            {items.length === 0 ? (
              <p className="mt-2.5 text-xs text-white/30">해당 없음</p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.id} className="text-xs">
                    <p className="font-medium text-white/80">{item.label}</p>
                    {item.note && <p className="mt-0.5 text-white/40">{item.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
