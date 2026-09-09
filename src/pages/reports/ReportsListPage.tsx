import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { incidentRecords, reportsSummary } from "../../data/mockReports"
import type { IncidentDomain } from "../../types/reports"

const DOMAIN_FILTERS: { id: IncidentDomain | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "river", label: "하천 범람" },
  { id: "coast", label: "연안 위험" },
  { id: "aqua", label: "양식장 위험" },
]

const PERIOD_OPTIONS = [
  { id: "7d", label: "최근 7일", days: 7 },
  { id: "30d", label: "최근 30일", days: 30 },
  { id: "90d", label: "최근 90일", days: 90 },
  { id: "all", label: "전체 기간", days: null },
] as const
type PeriodId = (typeof PERIOD_OPTIONS)[number]["id"]

/** 대응 단계(주의/경계/심각) — 데이터에 실제 존재하는 값만 옵션으로 노출 */
const STAGE_OPTIONS = ["전체", ...Array.from(new Set(incidentRecords.map((r) => r.levelLabel)))]

/** 담당자 — 하드코딩하면 실제 승인자 이름과 어긋날 수 있어 데이터에서 직접 뽑음(예: "김민준 팀장" 누락 방지) */
const ASSIGNEE_OPTIONS = ["전체", ...Array.from(new Set(incidentRecords.map((r) => r.approver)))]

const SORT_OPTIONS = [
  { id: "endedAt", label: "종료 일시 최신순" },
  { id: "duration", label: "대응 시간 긴 순" },
] as const
type SortId = (typeof SORT_OPTIONS)[number]["id"]

/** "2026-09-04 17:42 종료" → Date. 이 앱의 기준 "오늘"은 mockDashboard.lastSyncedAt과 동일한 2026-09-04. */
function parseEndedAt(endedAt: string): Date {
  const [datePart, timePart] = endedAt.replace(" 종료", "").split(" ")
  return new Date(`${datePart}T${timePart}:00`)
}
const REFERENCE_TODAY = new Date("2026-09-04T23:59:59")

/** "8시간 28분" → 508(분). 정렬용. */
function parseDurationMinutes(duration: string): number {
  const hourMatch = duration.match(/(\d+)\s*시간/)
  const minMatch = duration.match(/(\d+)\s*분/)
  return (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minMatch ? Number(minMatch[1]) : 0)
}

export function ReportsListPage() {
  const [domainFilter, setDomainFilter] = useState<IncidentDomain | "all">("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodId>("all")
  const [stageFilter, setStageFilter] = useState("전체")
  const [assigneeFilter, setAssigneeFilter] = useState("전체")
  const [sortBy, setSortBy] = useState<SortId>("endedAt")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const period = PERIOD_OPTIONS.find((p) => p.id === periodFilter)
    const result = incidentRecords.filter((record) => {
      const matchesDomain = domainFilter === "all" || record.domain === domainFilter
      const matchesQuery = query.trim() === "" || record.title.includes(query.trim())
      const matchesStage = stageFilter === "전체" || record.levelLabel === stageFilter
      const matchesAssignee = assigneeFilter === "전체" || record.approver === assigneeFilter
      const matchesPeriod =
        !period?.days ||
        (REFERENCE_TODAY.getTime() - parseEndedAt(record.endedAt).getTime()) / (1000 * 60 * 60 * 24) <= period.days
      return matchesDomain && matchesQuery && matchesStage && matchesAssignee && matchesPeriod
    })
    return result.sort((a, b) =>
      sortBy === "endedAt"
        ? parseEndedAt(b.endedAt).getTime() - parseEndedAt(a.endedAt).getTime()
        : parseDurationMinutes(b.duration) - parseDurationMinutes(a.duration),
    )
  }, [domainFilter, periodFilter, stageFilter, assigneeFilter, sortBy, query])

  const resetFilters = () => {
    setDomainFilter("all")
    setPeriodFilter("all")
    setStageFilter("전체")
    setAssigneeFilter("전체")
    setQuery("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">이력·보고서 조회</h1>
        <p className="mt-1 text-sm text-white/50">
          총 {reportsSummary.total}건 · 최종 갱신 {reportsSummary.lastUpdated} · 표시 대상 {incidentRecords.length}건(대표 사례)
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-white/40">
            위험 유형
            <select
              value={DOMAIN_FILTERS.find((f) => f.id === domainFilter)?.label}
              onChange={(e) => setDomainFilter(DOMAIN_FILTERS.find((f) => f.label === e.target.value)?.id ?? "all")}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
            >
              {DOMAIN_FILTERS.map((f) => (
                <option key={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            기간
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodId)}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            대응 단계
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
            >
              {STAGE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            담당자
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
            >
              {ASSIGNEE_OPTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="사건 제목으로 검색"
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-accent"
          />
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold text-white/60 hover:bg-inset"
          >
            초기화
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {DOMAIN_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDomainFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                domainFilter === f.id ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      <Card
        title={`검색 결과 ${filtered.length}건`}
        action={
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortId)}
            className="rounded-lg border border-border-subtle bg-inset px-2 py-1 text-xs text-white/70"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        }
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {filtered.map((record) => (
            <li key={record.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge level={record.level} label={record.levelLabel} solid />
                <span className="text-xs font-semibold text-white/40">{record.domainLabel}</span>
                <span className="text-xs text-white/30">{record.endedAt}</span>
                <Link to={`/reports/${record.id}`} className="ml-auto text-xs font-bold text-accent hover:underline">
                  보고서 보기 →
                </Link>
              </div>
              <p className="mt-2 text-sm font-semibold text-white/85">{record.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                <Meta label="위험 등급" value={record.grade} />
                <Meta label="대응 시간" value={record.duration} />
                <Meta label="영향 범위" value={record.area} />
                <Meta label="승인자" value={record.approver} />
                <Meta label="조치 건수" value={record.actionCount} />
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="py-8 text-center text-sm text-white/30">조건에 맞는 이력이 없습니다.</li>}
        </ul>
      </Card>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/30">{label}</p>
      <p className="mt-0.5 font-medium text-white/70">{value}</p>
    </div>
  )
}
