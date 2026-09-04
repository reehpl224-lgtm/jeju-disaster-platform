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

export function ReportsListPage() {
  const [domainFilter, setDomainFilter] = useState<IncidentDomain | "all">("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return incidentRecords.filter((record) => {
      const matchesDomain = domainFilter === "all" || record.domain === domainFilter
      const matchesQuery = query.trim() === "" || record.title.includes(query.trim())
      return matchesDomain && matchesQuery
    })
  }, [domainFilter, query])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">이력·보고서 조회</h1>
        <p className="mt-1 text-sm text-white/50">
          총 {reportsSummary.total}건 · 최종 갱신 {reportsSummary.lastUpdated}
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-white/40">
            위험 유형
            <select className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85">
              <option>전체</option>
              <option>하천 범람</option>
              <option>연안 위험</option>
              <option>양식장 위험</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            기간
            <select className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85">
              <option>최근 7일</option>
              <option>최근 30일</option>
              <option>최근 90일</option>
              <option>전체 기간</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            대응 단계
            <select className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85">
              <option>전체</option>
              <option>주의</option>
              <option>경계</option>
              <option>심각</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            담당자
            <select className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85">
              <option>전체</option>
              <option>홍길동 팀장</option>
              <option>김제주 담당</option>
              <option>이한라 담당</option>
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
            onClick={() => {
              setDomainFilter("all")
              setQuery("")
            }}
            className="rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold text-white/60 hover:bg-inset"
          >
            초기화
          </button>
          <button type="button" className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-black hover:bg-accent-hover">
            검색
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
          <select className="rounded-lg border border-border-subtle bg-inset px-2 py-1 text-xs text-white/70">
            <option>종료 일시 최신순</option>
            <option>대응 시간 긴 순</option>
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
