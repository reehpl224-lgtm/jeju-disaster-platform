import { Link, useSearchParams } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { aquaFarmTotals, aquaFarms } from "../../data/mockAqua"
import { coastalEcology, impactReferenceCases, villageFisheries, type ImpactTarget } from "../../data/aquaImpactTargets"
import type { RiskLevel } from "../../types/domain"

const TABS = [
  { key: "farms", label: "양식장" },
  { key: "village", label: "마을어장" },
  { key: "ecology", label: "연안 생태" },
] as const

const LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "danger", label: "심각" },
  { level: "alert", label: "경계" },
  { level: "warning", label: "주의" },
  { level: "caution", label: "관심" },
]

function TargetList({ title, items }: { title: string; items: ImpactTarget[] }) {
  return (
    <>
      <StatTiles
        items={[
          { label: title, value: `총 ${items.length}곳(샘플)` },
          ...LEVELS.map((l) => ({ label: l.label, value: `${items.filter((t) => t.level === l.level).length}곳`, tone: l.level })),
        ]}
      />
      <Card title={`${title}별 영향 상태`} subtitle="위치·이름은 실제 자료 수령 전 임의 샘플 — 단계는 양식 기준 5단계를 그대로 적용" dummy>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {items.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-white/85">{t.name}</p>
                <p className="text-xs text-white/40">
                  {t.region} · {t.species}
                </p>
                <p className="mt-0.5 text-xs text-white/35">{t.note}</p>
              </div>
              <div className="text-right">
                <RiskBadge level={t.level} label={t.riskType} solid />
                <p className="mt-1 text-xs text-white/35">
                  염분 {t.salinity} psu · 수온 {t.temperature}°C{t.tempSustainedDays ? ` (지속 ${t.tempSustainedDays}일째)` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export function AquaFarmsPage() {
  const [params] = useSearchParams()
  const tab = TABS.find((t) => t.key === params.get("target"))?.key ?? "farms"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">영향 대상 현황</h1>
        <p className="mt-1 text-sm text-white/50">저염분수·고수온 위험권 내 양식장·마을어장·연안 생태 영향 상태</p>
      </div>

      <nav aria-label="영향 대상 구분" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            to={t.key === "farms" ? "/aqua/farms" : `/aqua/farms?target=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${
              t.key === tab ? "border-accent bg-accent-soft text-accent" : "border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "farms" && (
        <>
          <StatTiles
            items={[
              { label: "영향 양식장", value: `총 ${aquaFarmTotals.total}개소` },
              { label: "심각", value: `${aquaFarmTotals.danger}개소`, tone: "danger" },
              { label: "경계", value: `${aquaFarmTotals.alert}개소`, tone: "alert" },
              { label: "주의", value: `${aquaFarmTotals.warning}개소`, tone: "warning" },
              { label: "관심", value: `${aquaFarmTotals.caution}개소`, tone: "caution" },
            ]}
          />

          <Card
            title="양식장별 영향 상태"
            subtitle={`대표 사례 ${aquaFarms.length}개소 (전체 ${aquaFarmTotals.total}개소 중) · 목록 클릭 시 상세 정보로 이동`}
            dummy
          >
            <ul className="flex flex-col divide-y divide-border-subtle">
              {aquaFarms.map((farm) => (
                <li key={farm.id}>
                  <Link
                    to={`/aqua/farms/${farm.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-inset"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white/85">{farm.name}</p>
                      <p className="text-xs text-white/40">
                        {farm.region} · {farm.species}
                      </p>
                    </div>
                    <div className="text-right">
                      <RiskBadge level={farm.level} label={farm.riskType} solid />
                      <p className="mt-1 text-xs text-white/35">
                        도달 D+{farm.etaHours}h
                        {farm.salinity ? ` · 염분 ${farm.salinity} psu` : ""}
                        {farm.temperature ? ` · 수온 ${farm.temperature}°C` : ""}
                        {farm.tempSustainedDays ? ` (지속 ${farm.tempSustainedDays}일째)` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
      {tab === "village" && <TargetList title="마을어장" items={villageFisheries} />}
      {tab === "ecology" && <TargetList title="연안 생태" items={coastalEcology} />}

      <Card
        title="참고 사례 — 과거 저염분·고수온 피해"
        subtitle="언론 보도 기준(수과원·해양수산연구원 원자료 확인 전) — 현재 임계값과 비교하는 참고용"
      >
        <ul className="flex flex-col gap-3">
          {impactReferenceCases.map((c) => (
            <li key={c.id} className="rounded-lg border border-border-subtle bg-inset p-3 text-sm">
              <p className="font-semibold text-white/85">{c.when}</p>
              <p className="mt-1 text-white/60">조건 · {c.condition}</p>
              <p className="mt-0.5 text-white/60">피해 · {c.impact}</p>
              <a href={c.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                출처: {c.source} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/35">
          마을어장·연안 생물별 위험 임계값은 협의 전이라 양식 기준 5단계(염분 30·28·26·24psu, 수온 28℃ 지속일수)를 그대로 씁니다.
        </p>
      </Card>
    </div>
  )
}
