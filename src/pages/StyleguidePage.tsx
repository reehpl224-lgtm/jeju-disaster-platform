import { useState } from "react"
import { Card } from "../components/ui/Card"
import { RiskBadge } from "../components/ui/RiskBadge"
import { Pill } from "../components/ui/Pill"
import { GisIconRail, GIS_RAIL_ITEMS, type GisRailKey } from "../components/ui/GisIconRail"
import type { RiskLevel } from "../types/domain"

const RISK_LEVELS: RiskLevel[] = ["danger", "alert", "warning", "caution", "safe", "info", "offline"]

export function StyleguidePage() {
  const [pillActive, setPillActive] = useState("a")
  const [railKey, setRailKey] = useState<GisRailKey | null>(null)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 bg-base p-6">
      <div>
        <h1 className="text-xl font-bold text-white">디자인 시스템 스타일가이드</h1>
        <p className="mt-1 text-sm text-white/50">
          src/index.css의 @theme 토큰과 공용 컴포넌트를 실제로 렌더링해 확인하는 개발용 참고
          페이지입니다. 인증 없이 /styleguide로 바로 접근합니다.
        </p>
      </div>

      <Card title="위험등급 배지 (RiskBadge)" subtitle="src/components/ui/riskStyles.ts 7종 전부">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RISK_LEVELS.map((level) => (
            <RiskBadge key={level} level={level} />
          ))}
        </div>
      </Card>

      <Card title="Pill 토글 버튼" subtitle="size='md'(기본) / size='sm'">
        <div className="flex flex-wrap gap-2">
          {["a", "b", "c"].map((id) => (
            <Pill key={id} active={pillActive === id} onClick={() => setPillActive(id)}>
              옵션 {id.toUpperCase()}
            </Pill>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["a", "b"].map((id) => (
            <Pill key={id} size="sm" active={pillActive === id} onClick={() => setPillActive(id)}>
              작은 옵션 {id.toUpperCase()}
            </Pill>
          ))}
        </div>
      </Card>

      <Card title="카드 (Card)" subtitle="기본적으로 shadow-card 토큰이 적용됩니다">
        <p className="text-sm text-white/70">카드 본문 예시 텍스트입니다.</p>
      </Card>

      <Card title="GIS 아이콘 레일" subtitle="지도 위 플로팅 레일 — shadow-panel 토큰 적용">
        <div className="relative h-24">
          <GisIconRail
            activeKey={railKey}
            onSelect={(key) => setRailKey((prev) => (prev === key ? null : key))}
            items={GIS_RAIL_ITEMS.slice(0, 4)}
          />
        </div>
      </Card>
    </div>
  )
}
