import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { RIVER_NAV } from "./riverNav"
import { riverApprovalHistory, riverInfra, riverSopStage, riverStatuses, riverTarget } from "../../data/mockRiver"

export function RiverHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">하천 범람 — 대시보드</h1>
        <p className="mt-1 text-sm text-white/50">강우레이더·수위센서 기반 하천 범람 예측 및 경보</p>
      </div>

      <DomainSubNav items={RIVER_NAV} />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-white/35">실증 대상지</p>
            <p className="mt-0.5 font-medium text-white/80">{riverTarget.area}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">목표</p>
            <p className="mt-0.5 font-medium text-white/80">{riverTarget.accuracyGoal}</p>
            <p className="text-white/60">{riverTarget.leadTimeGoal}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">신설 인프라</p>
            <p className="mt-0.5 font-medium text-white/80">{riverInfra.newBuild.join(" · ")}</p>
          </div>
          <div>
            <p className="text-xs text-white/35">AI 탐지 라벨</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {riverTarget.aiLabels.map((label) => (
                <code key={label} className="rounded bg-inset px-1.5 py-0.5 text-[11px] text-accent">
                  {label}
                </code>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="하천 위험 요약">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {riverStatuses.map((river) => (
            <div key={river.id} className="rounded-lg border border-border-subtle p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white/85">{river.name}</p>
                <RiskBadge level={river.level} solid />
              </div>
              <p className="mt-2 text-xs text-white/40">경보 단계</p>
              <p className="text-sm font-semibold text-white/80">{river.stage}</p>
              <p className="mt-2 text-xs text-white/40">범람 예상 도달</p>
              <p className="text-sm font-semibold text-white/80">{river.eta}</p>
              <p className="mt-2 text-[11px] text-white/30">최종 업데이트 {river.updatedAt}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="경보 승인 이력">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {riverApprovalHistory.map((h) => (
              <li key={h.id} className="flex gap-3 py-2.5 text-sm">
                <span className="w-12 shrink-0 text-xs text-white/35">{h.time}</span>
                <p className="text-white/70">{h.title}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="e-SOP 단계 연결">
          <p className="text-sm font-semibold text-white/85">현재 적용 단계</p>
          <RiskBadge level="alert" label={riverSopStage.current} solid />
          <p className="mt-3 text-sm text-white/60">{riverSopStage.next}</p>
          <Link
            to="/river/control"
            className="mt-4 inline-flex rounded-full border border-accent px-3 py-2 text-xs font-bold text-accent hover:bg-accent-soft"
          >
            e-SOP 단계 승인으로 이동 →
          </Link>
        </Card>
      </div>
    </div>
  )
}
