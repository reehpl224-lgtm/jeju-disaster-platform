import { legacySystems } from "../../data/mockHeavyRain"
import { LegacyContactLine } from "./LegacyContactLine"
import { LegacyFeedTable } from "./LegacyFeedTable"
import { RiskBadge } from "./RiskBadge"

const LINK_LEVEL = { "연계 진행중": "safe", "협의 중": "caution", 미연계: "offline" } as const

/** 레거시 시스템 id 목록 → 이름·운영 주체·연계 상태와 수신 데이터 항목 표 (행정시·도청 시스템 화면 공용) */
export function LegacySystemList({ ids }: { ids: string[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {ids.map((id) => {
        const s = legacySystems.find((x) => x.id === id)
        if (!s) return null
        return (
          <li key={id} className="py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white/85">{s.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  운영 주체 {s.operator} · {s.note}
                </p>
              </div>
              <RiskBadge level={LINK_LEVEL[s.linkStatus]} label={s.linkStatus} />
            </div>
            <LegacyContactLine id={id} />
            <LegacyFeedTable id={id} open />
          </li>
        )
      })}
    </ul>
  )
}
