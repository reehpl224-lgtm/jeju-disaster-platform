import { useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { StatTiles } from "../../components/ui/StatTiles"
import {
  COMMON_LEGACY,
  PILOT_SERVICES,
  PILOT_STATUS_META,
  SOURCE_META,
  type LegacyUse,
  type PilotStatus,
} from "../../data/mockPilotStatus"

const STATUS_ORDER: PilotStatus[] = ["demo", "year1", "conditional", "later"]

function LegacyList({ items }: { items: LegacyUse[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
          <div>
            <p className="font-medium text-white/85">{item.name}</p>
            <p className="mt-0.5 text-xs text-white/40">{item.use}</p>
          </div>
          <RiskBadge level={item.level} label={item.status} />
        </li>
      ))}
    </ul>
  )
}

export function PilotStatusPage() {
  const [filter, setFilter] = useState<PilotStatus | "all">("all")
  const all = PILOT_SERVICES.flatMap((s) => s.features)
  const count = (st: PilotStatus) => all.filter((f) => f.status === st).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">실증서비스 구현 현황</h1>
        <p className="mt-1 text-sm text-white/50">
          하천범람 · 저염분수·고수온 · 연안 안전관리 기능별 1차년도 구현 가능성과 데이터 출처(레거시 포함) — 근거: 착수보고회
          회의록(2026-09-15), 실증 3사 발표자료, 현업 면담(2026-09-07)
        </p>
      </div>

      <StatTiles
        items={STATUS_ORDER.map((st) => ({
          label: PILOT_STATUS_META[st].label,
          value: `${count(st)}건`,
          sub: PILOT_STATUS_META[st].desc,
          tone: PILOT_STATUS_META[st].level,
        }))}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-white/40">상태</span>
        {(["all", ...STATUS_ORDER] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`rounded-full border px-3 py-1 font-semibold transition ${
              filter === st ? "border-accent text-accent" : "border-white/20 text-white/60 hover:border-accent"
            }`}
          >
            {st === "all" ? `전체 ${all.length}` : `${PILOT_STATUS_META[st].label} ${count(st)}`}
          </button>
        ))}
        <span className="ml-3 font-semibold text-white/40">데이터 출처</span>
        {Object.values(SOURCE_META).map((s) => (
          <span key={s.label} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${s.className}`}>
            {s.label}
          </span>
        ))}
      </div>

      {PILOT_SERVICES.map((svc) => {
        const rows = svc.features.filter((f) => filter === "all" || f.status === filter)
        return (
          <Card
            key={svc.id}
            title={svc.title}
            subtitle={`실증사 ${svc.partner} · ${svc.goal}`}
            action={
              <Link to={svc.href} className="text-xs font-semibold text-accent hover:underline">
                서비스 화면 →
              </Link>
            }
          >
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <p className="mb-2 text-xs font-bold text-white/60">기능별 구현 가능성</p>
                {rows.length === 0 ? (
                  <p className="py-4 text-xs text-white/35">선택한 상태의 기능이 없습니다.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-white/40">
                        <th className="font-medium">기능</th>
                        <th className="w-32 whitespace-nowrap font-medium">상태</th>
                        <th className="font-medium">데이터 출처</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((f) => (
                        <tr key={f.id} className="border-t border-border-subtle align-top">
                          <td>
                            {f.href ? (
                              <Link to={f.href} className="font-medium text-white/85 hover:text-accent">
                                {f.title}
                              </Link>
                            ) : (
                              <span className="font-medium text-white/85">{f.title}</span>
                            )}
                            <p className="mt-0.5 text-[11px] text-white/35">
                              {f.basis}
                              {f.note && ` · ${f.note}`}
                            </p>
                          </td>
                          <td className="whitespace-nowrap">
                            <RiskBadge level={PILOT_STATUS_META[f.status].level} label={PILOT_STATUS_META[f.status].label} />
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {f.sources.map((src) => (
                                <span key={src} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${SOURCE_META[src].className}`}>
                                  {SOURCE_META[src].label}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold text-white/60">레거시·기존 데이터 활용</p>
                  <LegacyList items={svc.legacy} />
                </div>
                <div className="rounded-lg border border-risk-caution/30 bg-risk-caution/5 p-3">
                  <p className="text-xs font-bold text-risk-caution">운영 전 확정 필요</p>
                  <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-[11px] text-white/60">
                    {svc.decisions.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )
      })}

      <Card title="공통 레거시 연계" subtitle="특정 서비스가 아니라 컨트롤타워 전체에 걸리는 시스템 — 전체 목록은 데이터 시스템 연계현황 참고">
        <LegacyList items={COMMON_LEGACY} />
        <Link to="/data-systems" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
          데이터 시스템 연계현황 →
        </Link>
      </Card>

      <p className="text-[11px] text-white/35">
        "구현(시연)"은 프로토타입 화면이 있다는 뜻이며 실데이터로 운영 중이라는 뜻이 아닙니다. 상태는 착수보고 시점 계획 기준이고
        실증사 일정에 따라 바뀔 수 있습니다.
      </p>
    </div>
  )
}
