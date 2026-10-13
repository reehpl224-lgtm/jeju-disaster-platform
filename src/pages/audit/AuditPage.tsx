import { useMemo, useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { audit, clearAudit, useAuditLog } from "../../data/auditLog"
import { AUDIT_CATEGORIES, auditCsv, type AuditCategory } from "../../data/auditLogic"
import type { RiskLevel } from "../../types/domain"

const CATEGORY_LEVEL: Record<AuditCategory, RiskLevel> = { 접속: "info", "데이터 처리": "caution", "시스템 변경": "warning" }
const sel = "rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
const at = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })

/**
 * 운영 > 이용 이력 — 요구사항 '이용 이력 로그': 접속(로그인·로그아웃·역할 전환·접근 거부), 데이터 처리(지시·조치 기록·패널 입력·엑셀 적용·내려받기),
 * 시스템 변경(역할·권한, e-SOP 정의)을 누가 언제 했는지 기록하고 조회한다. 기록은 이 브라우저에만 저장되고 서버 감사 로그가 아니다(최근 1,000건).
 */
export function AuditPage() {
  const log = useAuditLog()
  const [cat, setCat] = useState<AuditCategory | "all">("all")
  const [q, setQ] = useState("")
  const shown = useMemo(
    () =>
      [...log]
        .reverse()
        .filter((a) => (cat === "all" || a.category === cat) && (!q.trim() || `${a.by} ${a.action} ${a.target ?? ""}`.includes(q.trim()))),
    [log, cat, q],
  )
  const download = () => {
    const blob = new Blob(["﻿", auditCsv(shown.slice().reverse())], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "이용이력.csv"
    a.click()
    URL.revokeObjectURL(a.href)
    audit("데이터 처리", "이용 이력 CSV 내려받기", `${shown.length}건`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">이용 이력</h1>
        <p className="mt-1 text-sm text-white/50">접속, 데이터 처리, 시스템 변경 이력을 기록합니다 — 이 브라우저에만 저장되며 최근 1,000건까지 보관합니다.</p>
      </div>

      <Card
        title={`이력 ${shown.length}건`}
        subtitle={cat === "all" && !q ? undefined : `전체 ${log.length}건 중`}
        action={
          <div className="flex gap-2">
            <button type="button" onClick={download} disabled={shown.length === 0} className="h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40">
              CSV 내려받기
            </button>
            <button
              type="button"
              onClick={() => window.confirm("이 브라우저에 저장된 이용 이력을 모두 지웁니다.") && clearAudit()}
              disabled={log.length === 0}
              className="h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
            >
              비우기
            </button>
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select value={cat} onChange={(e) => setCat(e.target.value as AuditCategory | "all")} className={sel} aria-label="구분">
            <option value="all">전체 구분</option>
            {AUDIT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="사용자·내용·대상으로 검색"
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
          />
        </div>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {shown.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-xs text-white/35">{at(a.at)}</span>
              <RiskBadge level={CATEGORY_LEVEL[a.category]} label={a.category} />
              <span className="text-white/80">
                {a.action}
                {a.target && <span className="ml-2 text-xs text-white/40">{a.target}</span>}
                {a.count > 1 && <span className="ml-2 text-xs text-white/40">×{a.count}</span>}
              </span>
              <span className="ml-auto text-xs text-white/40">{a.by}</span>
            </li>
          ))}
          {shown.length === 0 && <li className="py-8 text-center text-sm text-white/30">{log.length === 0 ? "기록된 이력이 없습니다 — 로그인·지시·설정 변경 등이 여기에 쌓입니다." : "조건에 맞는 이력이 없습니다."}</li>}
        </ul>
      </Card>
    </div>
  )
}
