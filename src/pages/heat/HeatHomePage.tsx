import { useMemo, useState, type ReactNode } from "react"
import { Card } from "../../components/ui/Card"
import { Pill } from "../../components/ui/Pill"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { MapToolbox } from "../../components/ui/MapToolbox"
import { GisIconRail, GIS_RAIL_ITEMS, type GisRailKey } from "../../components/ui/GisIconRail"
import { GisSidePanel } from "../../components/ui/GisSidePanel"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { HEAT_NAV } from "./heatNav"
import { heatLevelInfo, heatRouteTips, heatShelters } from "../../data/mockHeat"
import { riskMarkers } from "../../data/mockDashboard"
import type { HeatShelter } from "../../types/heat"

const HEAT_MARKERS = riskMarkers.filter((m) => m.domain === "heat")
// 폭염은 무더위쉼터(자산현황) 외 센서·담당자·전파 데이터가 없어 레일에 asset만 노출
const HEAT_RAIL_ITEMS = GIS_RAIL_ITEMS.filter((item) => item.key === "asset")

const REGION_FILTERS: { id: HeatShelter["region"] | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "제주시", label: "제주시" },
  { id: "서귀포시", label: "서귀포시" },
]

const RAIL_CONTENT: Partial<Record<GisRailKey, ReactNode>> = {
  asset: (
    <ul className="flex flex-col gap-2">
      {heatShelters.map((shelter) => (
        <li key={shelter.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white/80">{shelter.name}</p>
            <span className="rounded-full border border-border-subtle px-2 py-0.5 text-white/50">{shelter.type}</span>
          </div>
          <p className="mt-1 text-white/35">{shelter.address}</p>
        </li>
      ))}
    </ul>
  ),
}

export function HeatHomePage() {
  const [region, setRegion] = useState<HeatShelter["region"] | "all">("all")
  const [query, setQuery] = useState("")
  const [activeRailKey, setActiveRailKey] = useState<GisRailKey | null>(null)

  const filteredShelters = useMemo(() => {
    const q = query.trim()
    return heatShelters.filter((s) => {
      const matchesRegion = region === "all" || s.region === region
      const matchesQuery = q === "" || s.name.includes(q) || s.address.includes(q)
      return matchesRegion && matchesQuery
    })
  }, [region, query])

  const coolRoutes = heatRouteTips.filter((r) => r.kind === "cool")
  const hotRoutes = heatRouteTips.filter((r) => r.kind === "hot")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">폭염 대응</h1>
        <p className="mt-1 text-sm text-white/50">열섬지도 기반 시원한 길·더운 길 안내, 무더위쉼터 위치 안내</p>
      </div>

      <DomainSubNav items={HEAT_NAV} />

      <Card title="현재 폭염 위기단계" subtitle={`${heatLevelInfo.criteria} · 갱신 ${heatLevelInfo.updatedAt}`}>
        <div className="flex items-center gap-4">
          <RiskBadge level={heatLevelInfo.level} label={heatLevelInfo.label} solid />
          <p className="text-lg font-bold text-white">체감온도 {heatLevelInfo.feelsLikeC}℃</p>
        </div>
      </Card>

      <Card title="위험 위치 및 열섬 지점 — 폭염 GIS" subtitle="더운 길·무더위쉼터 관측 지점">
        <div className="relative h-[560px] w-full overflow-hidden rounded-lg">
          <JejuTileMap markers={HEAT_MARKERS} className="relative h-full w-full" />
          <MapToolbox />
          <GisIconRail
            activeKey={activeRailKey}
            onSelect={(key) => setActiveRailKey((prev) => (prev === key ? null : key))}
            items={HEAT_RAIL_ITEMS}
          />
          {activeRailKey && (
            <GisSidePanel activeKey={activeRailKey} onClose={() => setActiveRailKey(null)} content={RAIL_CONTENT} />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
          <span className="font-semibold text-white/30">범례</span>
          <RiskBadge level="danger" />
          <RiskBadge level="alert" />
          <RiskBadge level="warning" />
          <RiskBadge level="caution" />
          <RiskBadge level="safe" />
        </div>
      </Card>

      <Card title="시원한 길 · 더운 길 안내">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-risk-safe">🌳 시원한 길</p>
            <ul className="flex flex-col gap-2">
              {coolRoutes.map((route) => (
                <li key={route.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
                  <p className="font-medium text-white/80">{route.name}</p>
                  <p className="mt-0.5 text-white/40">{route.detail}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-risk-warning">☀️ 더운 길 주의</p>
            <ul className="flex flex-col gap-2">
              {hotRoutes.map((route) => (
                <li key={route.id} className="rounded-lg border border-border-subtle p-2.5 text-xs">
                  <p className="font-medium text-white/80">{route.name}</p>
                  <p className="mt-0.5 text-white/40">{route.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card
        title="무더위쉼터 안내"
        subtitle={`"무더위 쉼터를 몰라서 못 간다"는 현장 지적 반영 — 대표 ${heatShelters.length}개소 표시`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="지역 또는 이름 검색"
              className="w-40 rounded-full border border-border-subtle bg-inset px-3 py-1.5 text-xs text-white/80 placeholder:text-white/30 focus:border-accent focus:outline-none"
            />
            <div className="flex gap-1.5">
              {REGION_FILTERS.map((f) => (
                <Pill key={f.id} size="sm" active={region === f.id} onClick={() => setRegion(f.id)}>
                  {f.label}
                </Pill>
              ))}
            </div>
          </div>
        }
      >
        {filteredShelters.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredShelters.map((shelter) => (
              <div key={shelter.id} className="rounded-lg border border-border-subtle bg-inset p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white/85">{shelter.name}</p>
                  <span className="rounded-full border border-border-subtle px-2 py-0.5 text-white/50">{shelter.type}</span>
                </div>
                <p className="mt-1 text-white/35">{shelter.address}</p>
                <p className="mt-1 text-white/50">정원 {shelter.capacity}명</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
