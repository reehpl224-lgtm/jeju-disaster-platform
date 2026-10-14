import { IS_STAGING } from "../../data/appMode"
import { LEGACY_FEEDS } from "../../data/legacyFeed"

/** 레거시 시스템이 줄 데이터 항목 — 스테이징은 임의 샘플 행, 프로토타입은 수신 예정 컬럼만(값 없음) */
export function LegacyFeedTable({ id, open }: { id: string; open?: boolean }) {
  const feed = LEGACY_FEEDS[id]
  if (!feed) return null
  return (
    <details className="mt-2 rounded-lg border border-border-subtle p-2" open={open}>
      <summary className="cursor-pointer text-[11px] font-bold text-white/60">
        수신 데이터 항목 · {feed.items} {IS_STAGING ? "(샘플)" : "(연계 전)"}
      </summary>
      <p className="mt-1 text-[11px] text-white/35">
        수집 주기 {feed.cycle}(협의 전 가안){IS_STAGING ? ` · 기준 ${feed.asOf} · 임의 값` : " · 값은 연계 후 표시"}
      </p>
      <div className="mt-1 overflow-x-auto">
        <table className="w-full text-left text-[11px] text-white/70">
          <thead>
            <tr className="text-white/40">
              {feed.columns.map((c) => (
                <th key={c} className="px-2 py-1 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IS_STAGING ? (
              feed.rows.map((row) => (
                <tr key={row.join("|")} className="border-t border-border-subtle">
                  {row.map((cell, i) => (
                    <td key={feed.columns[i]} className="px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-border-subtle">
                <td colSpan={feed.columns.length} className="px-2 py-2 text-white/40">
                  연계 전 — 수신된 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </details>
  )
}
