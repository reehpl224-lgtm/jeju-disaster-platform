import type { DutyContact } from "../../types/domain"
import { dutyContacts } from "../../data/mockContacts"

interface DutyContactPanelProps {
  /** 생략하면 전체(총괄 포함) 표시. 도메인 홈에서는 해당 도메인 + 총괄만 표시. */
  domain?: DutyContact["domain"]
}

export function DutyContactPanel({ domain }: DutyContactPanelProps) {
  const contacts = domain
    ? dutyContacts.filter((c) => c.domain === domain || c.domain === "general")
    : dutyContacts

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border-subtle">
        {contacts.map((contact) => (
          <li key={contact.id} className="py-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-white/85">{contact.role}</p>
              <span className="text-white/35">{contact.name}</span>
            </div>
            <p className="mt-0.5 text-white/40">{contact.org}</p>
            <p className="mt-1 text-white/60">{contact.phone}</p>
            <p className="mt-0.5 text-white/35">{contact.channel}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-border-subtle bg-inset p-2.5 text-[11px] text-white/35">
        <p>인사이동 시 AI추진단이 접수해 현행화합니다.</p>
        <p className="mt-1">최종 현행화 {contacts[0]?.updatedAt}</p>
      </div>
    </div>
  )
}
