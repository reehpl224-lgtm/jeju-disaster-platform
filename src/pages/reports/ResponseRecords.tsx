import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { clearResponseLog, useResponseLog } from "../../data/responseLog"
import { logsOf, ordersOf, summarize } from "../../data/responseLogic"
import { SAMPLE_INCIDENT_IDS, useResponseView } from "../../data/sampleResponseLog"
import { fmt, minutesText, serviceTitle } from "./recordFormat"

const sel = "rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"

/**
 * 이력·보고서 조회 위쪽의 '대응 기록' — 서비스 보드에서 남긴 지시·조치·메모가 사건(공통 사건 ID) 단위로 쌓인 이력을 조회하고,
 * 사건 수·평균 대응 시간·지시 완료율 같은 사후분석용 요약을 본다(요구사항 '조치 이력 기록·조회'·'이력의 사후분석 활용').
 * 기록은 이 브라우저에만 저장된다.
 */
export function ResponseRecords() {
  const store = useResponseView()
  const mine = useResponseLog()
  const [svc, setSvc] = useState("all")
  const [status, setStatus] = useState<"all" | "open" | "closed">("all")
  const [q, setQ] = useState("")
  const sum = useMemo(() => summarize(store), [store])
  const rows = useMemo(
    () =>
      [...store.incidents]
        .reverse()
        .filter((i) => (svc === "all" || i.serviceId === svc) && (status === "all" || (status === "open" ? !i.closedAt : !!i.closedAt)))
        .filter((i) => !q.trim() || i.id.includes(q.trim()) || logsOf(store, i.id).some((l) => l.text.includes(q.trim()))),
    [store, svc, status, q],
  )
  const stats: [string, string][] = [
    ["사건", `${sum.incidents}건 (진행 ${sum.open})`],
    ["평균 대응 시간", minutesText(sum.avgMinutes)],
    ["지시", `${sum.orders}건`],
    ["지시 완료율", sum.doneRate == null ? "-" : `${sum.doneRate}%`],
    ["실패 건", `${sum.failed}건`],
  ]

  return (
    <Card
      title="대응 기록 (지시·조치 이력)"
      subtitle="서비스 보드에서 남긴 지시·조치·메모를 사건 ID 단위로 모아 봅니다 — 이 브라우저에만 저장"
      action={
        mine.incidents.length > 0 ? (
          <button
            type="button"
            onClick={() => window.confirm("이 브라우저에 저장된 대응 기록을 모두 지웁니다.") && clearResponseLog()}
            className="h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10"
          >
            기록 비우기
          </button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
            <p className="text-[11px] text-white/35">{k}</p>
            <p className="text-sm font-bold text-white/85">{v}</p>
          </div>
        ))}
      </div>
      {Object.keys(sum.byService).length > 0 && (
        <p className="mt-2 text-xs text-white/40">
          서비스별 사건: {Object.entries(sum.byService).map(([id, n]) => `${serviceTitle(id)} ${n}건`).join(" · ")}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={svc} onChange={(e) => setSvc(e.target.value)} className={sel} aria-label="서비스">
          <option value="all">전체 서비스</option>
          {DOMAINS.map((d) => (
            <option key={d.prefix} value={d.prefix.slice(1)}>
              {d.title}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={sel} aria-label="진행 상태">
          <option value="all">전체 상태</option>
          <option value="open">진행 중</option>
          <option value="closed">종료</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="사건 ID·기록 내용으로 검색"
          className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
        />
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-border-subtle">
        {rows.map((i) => {
          const orders = ordersOf(store, i.id)
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
              <RiskBadge level={i.closedAt ? "safe" : "warning"} label={i.closedAt ? "종료" : "진행 중"} />
              <Link to={`/reports/records/${i.id}`} className="font-bold text-white/85 hover:text-accent hover:underline">
                {i.id}
              </Link>
              {SAMPLE_INCIDENT_IDS.has(i.id) && <span className="rounded-full border border-white/20 px-2 text-[10px] text-white/50">샘플</span>}
              <span className="text-xs text-white/40">
                {serviceTitle(i.serviceId)} · {fmt(i.openedAt)}
                {i.closedAt && ` → ${fmt(i.closedAt)}`} · 지시 {orders.length}건(완료 {orders.filter((o) => o.status === "완료").length}) · 기록 {logsOf(store, i.id).length}건
              </span>
              <Link to={`/reports/records/${i.id}`} className="ml-auto text-xs font-bold text-accent hover:underline">
                이력 보기 →
              </Link>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="py-6 text-center text-sm text-white/30">
            {store.incidents.length === 0 ? "기록된 사건이 없습니다 — 서비스 보드에서 지시·조치를 남기면 여기에 쌓입니다." : "조건에 맞는 사건이 없습니다."}
          </li>
        )}
      </ul>
    </Card>
  )
}
