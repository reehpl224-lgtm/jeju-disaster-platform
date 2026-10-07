import { useEffect, useState } from "react"
import type { AdvisoryItem } from "../../data/aquaAdvisories"
import { fetchJejuWarnings } from "../../data/warningsApi"
import { LIVE } from "../ui/dataSource"
import { Risk } from "./BoardParts"
import { Group } from "./PanelParts"

const MAX_ROWS = 3

const formatTm = (tm: string) => (tm.length < 12 ? "" : `${tm.slice(4, 6)}/${tm.slice(6, 8)} ${tm.slice(8, 10)}:${tm.slice(10, 12)}`)

function Rows({ items }: { items: AdvisoryItem[] }) {
  return (
    <ul className="plist">
      {items.slice(0, MAX_ROWS).map((a) => (
        <li className="row-between" key={a.key}>
          <span>
            <Risk level={a.level} label={a.label} solid /> <span className="s">{a.region}</span>
          </span>
          {a.time && <span className="s">{a.time}</span>}
        </li>
      ))}
      {items.length > MAX_ROWS && <li className="s">외 {items.length - MAX_ROWS}건</li>}
    </ul>
  )
}

/**
 * 보드 우측 타임라인 상단의 "이 서비스의 특보 요약".
 * codes: 기상청 특보 종류 코드(wrn_met_data) — 최근 24시간 발표분이라 "발효 중"으로 단정하지 않는다.
 * advisories: 기상청이 아닌 기관(수산과학원 등) 특보 — 연동 전이면 임의 샘플이라 dummy 표식이 붙는다.
 */
export function WarningsSummary({ codes, advisories }: { codes?: string[]; advisories?: AdvisoryItem[] }) {
  const [items, setItems] = useState<AdvisoryItem[] | null>(null)
  const [failed, setFailed] = useState(false)
  const codeKey = codes?.join(",")

  useEffect(() => {
    if (!codes) return
    let cancelled = false
    fetchJejuWarnings()
      .then((res) => {
        if (cancelled) return
        setItems(
          res.entries
            .filter((e) => codes.includes(e.wrn))
            .map((e, i) => ({
              key: `${e.regId}-${e.wrn}-${e.tmFc}-${i}`,
              level: e.lvl === "2" ? "danger" : "warning",
              label: `${e.wrnLabel} ${e.lvlLabel}`,
              region: e.regionLabel,
              time: formatTm(e.tmFc),
            })),
        )
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- codes는 배열이라 내용(codeKey)으로 비교
  }, [codeKey])

  if (advisories) {
    return (
      <Group title="특보 요약 · 수산과학원(연동 전 샘플)" dummy>
        {advisories.length === 0 ? <p className="pempty">최근 발표된 특보가 없습니다.</p> : <Rows items={advisories} />}
      </Group>
    )
  }
  return (
    <Group title="특보 요약 · 기상청 최근 24시간 발표" source={LIVE}>
      {failed ? (
        <p className="pempty">특보를 불러오지 못했습니다.</p>
      ) : !items ? (
        <p className="pempty">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="pempty">최근 24시간 내 발표된 특보가 없습니다.</p>
      ) : (
        <Rows items={items} />
      )}
    </Group>
  )
}
