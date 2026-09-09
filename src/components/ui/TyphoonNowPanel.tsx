import { useEffect, useState } from "react"
import { fetchTyphoonNow, formatKst } from "../../data/typhoonApi"
import type { TyphoonNowEntry } from "../../types/typhoonApi"

/**
 * 기상청 API허브 태풍정보+예측(typ_now.php) 실시간 연동 — 현재 진행 중인 태풍의 실제
 * 위치·기압·최대풍속·진행방향/속도. 진행 중인 태풍이 없으면 빈 배열이 정상 응답이라 그대로
 * "현재 진행 중인 태풍 없음"으로 표시한다(더미데이터로 채우지 않음).
 */
export function TyphoonNowPanel() {
  const [entries, setEntries] = useState<TyphoonNowEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTyphoonNow()
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

  if (!entries || entries.length === 0) {
    return <p className="py-4 text-center text-xs text-white/40">현재 진행 중인 태풍이 없습니다.</p>
  }

  // 태풍번호(typ)별로 묶어서, 각 태풍의 최신 분석(FT=0) 시점 하나만 대표로 보여준다.
  const byTyp = new Map<string, TyphoonNowEntry[]>()
  for (const e of entries) {
    const list = byTyp.get(e.typ) ?? []
    list.push(e)
    byTyp.set(e.typ, list)
  }

  return (
    <div className="flex flex-col gap-3">
      {[...byTyp.entries()].map(([typ, rows]) => {
        const latest = rows.find((r) => r.ft === "0") ?? rows[0]
        return (
          <div key={typ} className="rounded-lg border border-border-subtle p-3">
            <p className="text-sm font-semibold text-white/80">제{typ}호 태풍</p>
            <p className="mt-1 text-[11px] text-white/35">분석시각 {formatKst(latest.typTmUtc)} (KST)</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-white/40">중심기압</p>
                <p className="text-sm font-bold text-white">{latest.pressureHpa}hPa</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">최대풍속</p>
                <p className="text-sm font-bold text-white">{latest.maxWindMs}m/s</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40">이동속도</p>
                <p className="text-sm font-bold text-white">{latest.speedKmh}km/h</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/35">
              위치 {latest.lat}°N {latest.lon}°E · 진행방향 {latest.dir}
            </p>
          </div>
        )
      })}
      <p className="text-[10px] text-white/25">기상청 API허브(apihub.kma.go.kr) 실연동 — 태풍정보+예측(typ_now.php)</p>
    </div>
  )
}
