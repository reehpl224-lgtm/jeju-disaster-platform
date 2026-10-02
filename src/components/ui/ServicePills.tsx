import { Link } from "react-router-dom"
import { DOMAINS } from "../layout/domainSidebarUtils"

const pillCls = "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold"

/** 운영 화면(데이터 시스템 연계현황·e-SOP 대응)의 서비스 선택 버튼 — "전체" + 9개 서비스, 선택은 ?system=<id>로 유지 */
export function ServicePills({ basePath, current }: { basePath: string; current?: string }) {
  return (
    <nav aria-label="서비스 구분" className="flex flex-wrap gap-2">
      {[{ prefix: "", title: "전체", icon: "" }, ...DOMAINS].map((d) => {
        const active = (current ?? "") === d.prefix
        return (
          <Link
            key={d.prefix}
            to={d.prefix ? `${basePath}?system=${d.prefix.slice(1)}` : basePath}
            aria-current={active ? "page" : undefined}
            className={`${pillCls} ${active ? "border-accent bg-accent-soft text-accent" : "border-white/20 text-white/70 hover:bg-white/10"}`}
          >
            {d.icon && <span aria-hidden="true">{d.icon}</span>}
            {d.title}
          </Link>
        )
      })}
    </nav>
  )
}
