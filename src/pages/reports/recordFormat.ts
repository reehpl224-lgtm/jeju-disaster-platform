import { DOMAINS } from "../../components/layout/domainSidebarUtils"

export const serviceTitle = (id: string) => DOMAINS.find((d) => d.prefix === `/${id}`)?.title ?? id
export const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
export const minutesText = (m: number | null) => (m == null ? "-" : m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`)
