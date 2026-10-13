import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { incidentCsv, logsOf, ordersOf, type LogKind, type OrderStatus } from "../../data/responseLogic"
import { SAMPLE_INCIDENT_IDS, useResponseView } from "../../data/sampleResponseLog"
import type { RiskLevel } from "../../types/domain"
import { fmt, minutesText, serviceTitle } from "./recordFormat"

const STATUS_LEVEL: Record<OrderStatus, RiskLevel> = { 지시: "info", 전달: "caution", "수행 중": "warning", 완료: "safe", 실패: "alert" }
const KINDS: LogKind[] = ["감지", "판단", "지시", "조치", "결과", "전파", "메모", "종료"]

/** 사건 이력 상세 — 요구사항 '조치 이력 기록·조회': 한 사건의 지시·조치 결과와 시간순 이력, CSV·PDF 내보내기(사후분석용) */
export function IncidentLogPage() {
  const { incidentId } = useParams()
  const store = useResponseView()
  const [kind, setKind] = useState<LogKind | "all">("all")
  const incident = store.incidents.find((i) => i.id === incidentId)
  if (!incident) return <Navigate to="/reports" replace />

  const orders = ordersOf(store, incident.id)
  const logs = logsOf(store, incident.id)
  const shown = logs.filter((l) => kind === "all" || l.kind === kind)
  const minutes = incident.closedAt ? Math.round((new Date(incident.closedAt).getTime() - new Date(incident.openedAt).getTime()) / 60000) : null
  const download = () => {
    const blob = new Blob(["﻿", incidentCsv(store, incident.id)], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${incident.id}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const tiles: [string, string][] = [
    ["서비스", serviceTitle(incident.serviceId)],
    ["시작", fmt(incident.openedAt)],
    ["종료", incident.closedAt ? fmt(incident.closedAt) : "진행 중"],
    ["대응 시간", minutesText(minutes)],
    ["지시", `${orders.length}건 (완료 ${orders.filter((o) => o.status === "완료").length} · 실패 ${orders.filter((o) => o.status === "실패").length})`],
    ["기록", `${logs.length}건`],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/reports" className="text-xs font-semibold text-white/40 hover:text-accent">
            ← 이력·보고서 조회로
          </Link>
          <h1 className="mt-1 text-xl font-bold text-white">사건 이력 · {incident.id}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/50">
            <RiskBadge level={incident.closedAt ? "safe" : "warning"} label={incident.closedAt ? "종료" : "진행 중"} />
            {SAMPLE_INCIDENT_IDS.has(incident.id) && <span className="rounded-full border border-white/20 px-2 text-[10px]">샘플</span>}
            <Link to={`/${incident.serviceId}`} className="text-accent hover:underline">
              {serviceTitle(incident.serviceId)} 서비스 보드 →
            </Link>
          </p>
        </div>
        <div className="print-hide flex gap-2">
          <button type="button" onClick={download} className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">
            이력 내려받기 (CSV)
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10">
            PDF로 저장
          </button>
        </div>
      </div>

      <Card title="사건 요약">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {tiles.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
              <p className="text-[11px] text-white/35">{k}</p>
              <p className="text-sm font-medium text-white/85">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="대응 지시와 조치 결과">
        {orders.length === 0 ? (
          <p className="text-sm text-white/40">이 사건에 등록된 지시가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs text-white/35">
                  <th className="pb-2 font-medium">지시 내용</th>
                  <th className="pb-2 font-medium">담당자</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 font-medium">처리 경과</th>
                  <th className="pb-2 font-medium">조치 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {orders.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="py-2 font-medium text-white/80">{o.title}</td>
                    <td className="py-2 text-white/60">
                      {o.assignee || "-"}
                      {o.dept && <span className="block text-xs text-white/35">{o.dept}</span>}
                    </td>
                    <td className="py-2">
                      <RiskBadge level={STATUS_LEVEL[o.status]} label={o.status} />
                    </td>
                    <td className="py-2 text-xs text-white/40">{o.events.map((e) => `${e.status} ${fmt(e.at)}`).join(" → ")}</td>
                    <td className="py-2 text-white/60">{o.result || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="시간순 이력" subtitle="감지부터 종료까지 사건 ID로 묶인 기록 (기록자 포함)">
        <div className="mb-2 flex flex-wrap gap-2">
          {(["all", ...KINDS] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === k ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"}`}
            >
              {k === "all" ? "전체" : k}
              {k !== "all" && ` ${logs.filter((l) => l.kind === k).length}`}
            </button>
          ))}
        </div>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {shown.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <span className="w-24 shrink-0 text-xs text-white/35">{fmt(l.at)}</span>
              <span className="shrink-0 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-semibold text-white/60">{l.kind}</span>
              <p className="text-white/70">{l.text}</p>
              <span className="ml-auto text-xs text-white/35">{l.by}</span>
            </li>
          ))}
          {shown.length === 0 && <li className="py-4 text-sm text-white/30">해당 구분의 기록이 없습니다.</li>}
        </ul>
      </Card>
    </div>
  )
}
