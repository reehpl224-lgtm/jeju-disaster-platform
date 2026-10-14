import { LEGACY_CONTACTS } from "../../data/legacyContacts"

/** 시스템 담당자 한 줄 — 기관 담당·관리기업 담당(모두 가상 값) */
export function LegacyContactLine({ id }: { id: string }) {
  const c = LEGACY_CONTACTS[id]
  if (!c) return null
  return (
    <p className="mt-0.5 text-[11px] text-white/45">
      담당 {c.agency.dept} {c.agency.name} {c.agency.phone} · 관리기업 {c.company.name} {c.company.person} {c.company.phone} <span className="text-white/30">(가상 값)</span>
    </p>
  )
}
