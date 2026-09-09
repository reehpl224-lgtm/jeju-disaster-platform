import { useEffect, useState } from "react"
import { fetchTyphoonNameList, formatKst, isActiveNow } from "../../data/typhoonApi"
import type { TyphoonNameEntry } from "../../types/typhoonApi"

/**
 * 기상청 API허브 태풍 이름 목록(typ_lst) 실시간 연동 패널 — "올해 몇 호 태풍이 있었는지, 지금
 * 활성 상태인지"를 실제 데이터로 보여준다. 실시간 위치·경로는 TyphoonNowPanel(별도 컴포넌트) 참고.
 */
export function TyphoonNameListPanel() {
  const [entries, setEntries] = useState<TyphoonNameEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTyphoonNameList()
      .then((res) => {
        if (!cancelled) setEntries(res)
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

  if (!entries) return null

  const recent = entries.slice(-5).reverse()

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-border-subtle">
        {recent.map((entry) => {
          const active = isActiveNow(entry)
          return (
            <li key={`${entry.year}-${entry.seq}`} className="flex flex-col gap-1 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white/80">
                  제{entry.seq}호 {entry.nameKo} ({entry.nameEn})
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? "bg-risk-alert text-white" : "bg-inset text-white/35"
                  }`}
                >
                  {active ? "활성" : "종료"}
                </span>
              </div>
              <p className="text-[11px] text-white/35">
                {formatKst(entry.tmStUtc)} ~ {formatKst(entry.tmEdUtc)} (KST)
              </p>
              <p className="text-[11px] text-white/30">{entry.note}</p>
            </li>
          )
        })}
      </ul>
      <p className="text-[10px] text-white/25">data.go.kr과 별개인 기상청 API허브(apihub.kma.go.kr) 실연동 — 연도별 태풍 이름 목록(typ_lst.php)</p>
    </div>
  )
}
