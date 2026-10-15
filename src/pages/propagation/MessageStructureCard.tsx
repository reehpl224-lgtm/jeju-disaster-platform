import { useMemo, useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { ESOP_STAGES, type EsopLevel } from "../../data/esopLogic"
import {
  COMMON_RULE, MSG_KINDS, MSG_SERVICES, buildMessage, channelOf, checkLength, msgDefaultRegion, msgRule, msgTypeName, type MsgKind,
} from "../../data/messageTemplates"
import type { ServiceId } from "../../data/rolesLogic"

const sel = "rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
const hhmm = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })

/**
 * 상황 전파 업무 메시지 구조 — 요구사항 '상황 전파'. 재난 유형·단계·문안 종류를 고르면 구조에 맞는 문안을 만들고
 * 채널별 글자 수(휴대폰 90자·DMB 400자·재난방송 500자)를 점검한다. 구조를 보이는 예시이며 실제 발송은 하지 않는다.
 */
export function MessageStructureCard() {
  const [svc, setSvc] = useState<ServiceId>("heavy-rain")
  const [level, setLevel] = useState<EsopLevel>("alert")
  const [kind, setKind] = useState<MsgKind>("bulletin")
  const [region, setRegion] = useState("")
  const [at, setAt] = useState(hhmm)
  const [edited, setEdited] = useState<string | null>(null)

  const built = useMemo(() => buildMessage(svc, kind, level, region, at), [svc, kind, level, region, at])
  const text = edited ?? built
  const checks = checkLength(text)
  const k = MSG_KINDS.find((x) => x.id === kind)
  const reset = () => setEdited(null)

  return (
    <Card title="업무 메시지 구조 — 재난문자 문안" subtitle="유형·단계·문안 종류에 맞춰 문안을 만들고 채널별 글자 수를 점검합니다(실제 발송 없음)" dummy>
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} aria-label="재난 유형" value={svc} onChange={(e) => { setSvc(e.target.value as ServiceId); reset() }}>
          {MSG_SERVICES.map((s) => (
            <option key={s} value={s}>
              {msgTypeName(s)}
            </option>
          ))}
        </select>
        <select className={sel} aria-label="단계" value={level} onChange={(e) => { setLevel(e.target.value as EsopLevel); reset() }}>
          {ESOP_STAGES.map((s) => (
            <option key={s.level} value={s.level}>
              {s.label}
            </option>
          ))}
        </select>
        <select className={sel} aria-label="문안 종류" value={kind} onChange={(e) => { setKind(e.target.value as MsgKind); reset() }}>
          {MSG_KINDS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input className={`${sel} w-44`} aria-label="지역" placeholder={msgDefaultRegion(svc)} value={region} onChange={(e) => { setRegion(e.target.value); reset() }} />
        <input className={`${sel} w-24`} aria-label="시각" value={at} onChange={(e) => { setAt(e.target.value); reset() }} />
        <RiskBadge level={channelOf(kind) === "긴급재난" ? "alert" : "info"} label={`채널 ${channelOf(kind)}`} />
      </div>

      <textarea
        aria-label="문안"
        className={`${sel} mt-3 min-h-24 w-full resize-y leading-relaxed`}
        value={text}
        onChange={(e) => setEdited(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {checks.map((c) => (
          <span key={c.id} className={`rounded-full border px-3 py-1 text-xs font-semibold ${c.ok ? "border-accent/40 text-accent" : "border-risk-danger/60 text-risk-danger"}`}>
            {c.label} {c.len}/{c.max}자 {c.ok ? "" : "— 초과"}
          </span>
        ))}
        {edited !== null && (
          <button type="button" className="rounded-full border border-border-subtle px-3 py-1 text-xs text-white/60 hover:bg-inset" onClick={reset}>
            문안 다시 만들기
          </button>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-1 text-xs text-white/45">
        <li>문안 구조: [기관] 시각 지역 상황. 행동 지시 — {k?.note}</li>
        <li>송출 기준: {msgRule(svc)}</li>
        <li>{COMMON_RULE}</li>
      </ul>
    </Card>
  )
}
