import { useEffect, useState } from "react"
import { fetchJejuWarnings } from "../../data/warningsApi"
import type { WarningEntry } from "../../types/warningsApi"
import { RiskBadge } from "./RiskBadge"

function formatTm(tm: string) {
  if (!tm || tm.length < 12) return tm
  return `${tm.slice(4, 6)}/${tm.slice(6, 8)} ${tm.slice(8, 10)}:${tm.slice(10, 12)}`
}

/**
 * 기상청 API허브 기상특보(wrn_met_data.php) 실시간 연동 패널 — /heat, /heavy-rain 등에서 재사용.
 * wrnCodes를 주면 그 종류(예: 폭염 H, 열대야 K)만 걸러서 보여준다 — 없으면 제주 전체 특보.
 */
export function WarningsPanel({ wrnCodes }: { wrnCodes?: string[] }) {
  const [entries, setEntries] = useState<WarningEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchJejuWarnings()
      .then((res) => {
        if (!cancelled) setEntries(res.entries)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="py-4 text-center text-xs text-white/30">불러오는 중...</p>

  if (error) {
    return (
      <p className="rounded-lg border border-risk-danger-bg bg-risk-danger-bg/20 p-2.5 text-[11px] text-risk-danger">{error}</p>
    )
  }

  const filtered = wrnCodes ? (entries ?? []).filter((e) => wrnCodes.includes(e.wrn)) : entries ?? []

  if (filtered.length === 0) {
    return <p className="py-4 text-center text-xs text-white/40">최근 24시간 내 발표된 특보가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {filtered.map((e, i) => (
          <li key={`${e.regId}-${e.wrn}-${e.tmFc}-${i}`} className="flex items-center justify-between rounded-lg border border-border-subtle p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <RiskBadge level={e.lvl === "2" ? "danger" : "warning"} label={`${e.wrnLabel} ${e.lvlLabel}`} solid />
              <p className="font-medium text-white/80">{e.regionLabel}</p>
            </div>
            <span className="text-white/35">발표 {formatTm(e.tmFc)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-white/25">
        기상청 API허브(apihub.kma.go.kr) 실연동 — 최근 24시간 내 발표 이력(해제 여부는 별도 확인 안 됨).
      </p>
    </div>
  )
}
