import { useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { aquaBrief, coastBrief, heatBrief, heavyRainBrief, riverBrief, typhoonBrief, type BriefRole, type BriefTask } from "../domain/leaderBriefs"
import type { RiskLevel } from "../../types/domain"

/**
 * 통합 결재함 — 재난안전과 팀장 시나리오의 "결재 대기 목록(팀장 전용)" 갭.
 * 6개 서비스 팀장 브리핑(leaderBriefs.ts)의 "결재·지시" 항목을 한 표로 모은다. 새 데이터는 없고 브리핑을 그대로
 * 합치므로, 서비스 상황을 시나리오로 바꾸면 여기도 같이 바뀐다. 동작(승인·발송 등)은 각 서비스 상세 화면에서 한다.
 */

const SERVICES = [
  { id: "heavy-rain", label: "호우", icon: "☔", brief: heavyRainBrief },
  { id: "typhoon", label: "태풍", icon: "🌀", brief: typhoonBrief },
  { id: "heat", label: "폭염 대응", icon: "🔆", brief: heatBrief },
  { id: "river", label: "하천범람", icon: "🏞️", brief: riverBrief },
  { id: "aqua", label: "저염분 고수온", icon: "🌡️", brief: aquaBrief },
  { id: "coast", label: "연안 안전관리", icon: "🌊", brief: coastBrief },
]
const RANK: RiskLevel[] = ["safe", "info", "offline", "caution", "warning", "alert", "danger"]
const ROLES: BriefRole[] = ["승인", "지시", "결재", "확인"]

export function ApprovalsPage() {
  const [role, setRole] = useState<BriefRole | "all">("all")
  const [service, setService] = useState<string>("all")

  const groups = SERVICES.map((s) => ({ ...s, b: s.brief() }))
  const rows = groups
    .flatMap((g) => g.b.tasks.map((t) => ({ ...t, svc: g })))
    // 급한 것부터: 상태 등급 높은 순, 같으면 승인·지시가 앞
    .sort((a, z) => RANK.indexOf(z.level) - RANK.indexOf(a.level) || ROLES.indexOf(a.role) - ROLES.indexOf(z.role))
  const shown = rows.filter((r) => (role === "all" || r.role === role) && (service === "all" || r.svc.id === service))
  const idle = groups.filter((g) => g.b.tasks.length === 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">통합 결재함</h1>
        <p className="mt-1 text-sm text-white/50">
          6개 서비스의 결재·지시·확인 대기를 한곳에 — 급한 순서대로 정렬, 항목을 누르면 해당 서비스의 처리 화면으로 이동
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="전체" value={rows.length} active={role === "all"} onClick={() => setRole("all")} />
        {ROLES.map((r) => (
          <Tile key={r} label={r} value={rows.filter((x) => x.role === r).length} active={role === r} onClick={() => setRole(role === r ? "all" : r)} />
        ))}
      </div>

      <Card title="대기 항목" subtitle="AI 판정은 보조 — 단계 상향·경보 발령은 팀장이 확인·승인" dummy>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/40">서비스</span>
          {[{ id: "all", label: "전체" }, ...groups.map((g) => ({ id: g.id, label: `${g.icon} ${g.label} ${g.b.tasks.length}` }))].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setService(service === s.id ? "all" : s.id)}
              className={`rounded-full border px-3 py-1 font-semibold transition ${service === s.id ? "border-accent bg-accent-soft text-accent" : "border-border-subtle text-white/50 hover:bg-inset"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-lg border border-border-subtle p-4 text-sm text-white/50">조건에 맞는 대기 항목이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
            {shown.map((r) => (
              <Row key={`${r.svc.id}-${r.role}-${r.title}`} task={r} svcLabel={`${r.svc.icon} ${r.svc.label}`} />
            ))}
          </ul>
        )}
      </Card>

      {idle.length > 0 && (
        <Card title="대기 없는 서비스" subtitle="현재 결재·지시할 항목이 없습니다">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {idle.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium text-white/80">
                  {g.icon} {g.label}
                </span>
                <span className="flex items-center gap-3 text-xs text-white/40">
                  {g.b.idle}
                  <RiskBadge level={g.b.level} label={g.b.badge} />
                  <Link to={`/${g.id}/dashboard`} className="font-bold text-accent hover:underline">
                    대시보드 →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Tile({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border p-3 text-left transition ${active ? "border-accent bg-accent-soft" : "border-white/20 bg-panel hover:bg-inset"}`}
    >
      <p className="text-[11px] font-medium text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${value > 0 ? "text-white" : "text-white/30"}`}>{value}</p>
    </button>
  )
}

function Row({ task: t, svcLabel }: { task: BriefTask; svcLabel: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-white/85">
          <span className="mr-2 rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/60">{t.role}</span>
          <span className="mr-2 text-xs font-semibold text-white/45">{svcLabel}</span>
          {t.title}
        </p>
        {t.detail && <p className="mt-0.5 text-xs text-white/40">{t.detail}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <RiskBadge level={t.level} label={t.status} />
        <Link to={t.to} className="text-xs font-bold text-accent hover:underline">
          {t.role} 화면 →
        </Link>
      </div>
    </li>
  )
}
