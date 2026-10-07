import type { ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { ServicePills } from "../../components/ui/ServicePills"
import { coastAgencyStatuses, coastClosure, coastDispatch, coastEventDetail, coastEvents, coastStageCriteria } from "../../data/mockCoast"
import { aquaResponseState } from "../../data/mockAqua"
import { riverClosure, riverJointAgencies, riverSopStage, riverStageCriteria, riverStatuses, riverTarget } from "../../data/mockRiver"
import { AquaResponsePage } from "../aqua/AquaResponsePage"
import { EsopStatusView } from "./EsopStatusView"

/**
 * 운영 > e-SOP 대응. e-SOP(단계·체크리스트·관리자 승인)는 실증 3서비스(저염분 고수온·하천범람·연안 안전관리)의 개념이라
 * 나머지 6개 서비스는 "해당 없음"으로 표시한다(레거시 상황 뷰 — 종료 보고에 승인 근거 e-SOP 항목만 있음).
 * 서비스별 처리 화면(승인·발송)은 각 서비스에 그대로 있고, 여기서는 단계 현황을 보고 그 화면으로 이동한다.
 */
const pillLink = "inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"

function Links({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map(([to, label]) => (
        <Link key={to} to={to} className={pillLink}>
          {label} →
        </Link>
      ))}
    </div>
  )
}

const pendingCoastEvents = () => coastEvents.filter((e) => e.status === "미확인").length

function RiverView() {
  const worst = riverStatuses.find((r) => r.level === riverSopStage.level) ?? riverStatuses[0]
  return (
    <EsopStatusView
      title="하천범람"
      embedded
      level={riverSopStage.level}
      grade={riverSopStage.current}
      detectedAt={worst?.updatedAt ?? "-"}
      location={riverTarget.area}
      metrics={[
        ...riverStatuses.map((r): [string, string] => [r.name, `${r.stage} · 범람 도달 ${r.eta}`]),
        ["안내", riverSopStage.next],
      ]}
      criteria={riverStageCriteria
        .filter((c) => c.level !== "safe")
        .map((c) => ({ level: c.level, label: c.label, action: c.action, trigger: `유량비 ${c.flowRatio} · ${c.waterState}` }))}
      checklist={[]}
      agencies={riverJointAgencies.map((a) => ({ id: a.id, agency: a.agency, role: "-", approve: "-", execute: a.status }))}
      release={riverClosure.closureConditions}
      links={[["/river/alert", "경보 발송(경보 승인)"], ["/river/dispatch", "출동 요청(출동 승인)"], ["/river/control", "현장 통제"], ["/river/monitoring", "실시간 모니터링"]]}
    />
  )
}

function CoastView() {
  const d = coastEventDetail
  return (
    <EsopStatusView
      title="연안 안전관리"
      embedded
      level={d.level}
      grade={d.grade}
      detectedAt={d.detectedAt}
      location={d.zone}
      metrics={[["이벤트 유형", d.type], ["승인 대기 이벤트", `${pendingCoastEvents()}건`], ["출동 요청", coastDispatch.request.status]]}
      criteria={coastStageCriteria
        .filter((c) => c.level !== "safe")
        .map((c) => ({ level: c.level, label: c.label, action: c.action, trigger: `파고 ${c.waveHeight} · 풍속 ${c.windSpeed} · ${c.tide}` }))}
      checklist={[]}
      agencies={coastAgencyStatuses.map((a) => ({ id: a.id, agency: a.agency, role: "-", approve: "-", execute: `${a.status} · ${a.detail}` }))}
      release={coastClosure.closureConditions}
      links={[["/coast/alerts", "경보 발송(e-SOP 경보 승인)"], ["/coast/dispatch", "현장 공조"], ["/coast/monitoring", "현장 모니터링"]]}
    />
  )
}

function NotApplicable({ prefix, title }: { prefix: string; title: string }) {
  return (
    <Card title={`${title} — e-SOP 해당 없음`}>
      <p className="text-sm text-white/60">
        이 서비스는 기관 발표를 받아 보여주는 레거시 상황 뷰라 e-SOP 단계·체크리스트가 없습니다. 종료 보고에 "승인 근거 e-SOP" 항목만 있습니다.
      </p>
      <Links items={[[`${prefix}/closure`, "종료 보고"]]} />
    </Card>
  )
}

function Overview() {
  const rows: Record<string, ReactNode> = {
    "/river": <RiskBadge level={riverSopStage.level} label={riverSopStage.current} />,
    "/aqua": <RiskBadge level={aquaResponseState.riskLevel} label={aquaResponseState.grade === "-" ? aquaResponseState.title : aquaResponseState.grade} />,
    "/coast": <span className="text-xs text-white/60">승인 대기 {pendingCoastEvents()}건</span>,
  }
  return (
    <Card title="서비스별 e-SOP 적용 현황" subtitle="실증 3서비스만 e-SOP 단계가 있고, 나머지는 해당 없음" dummy>
      <ul className="flex flex-col divide-y divide-border-subtle">
        {DOMAINS.map((d) => (
          <li key={d.prefix} className="flex items-center justify-between gap-3 py-3 text-sm">
            <Link to={`/esop?system=${d.prefix.slice(1)}`} className="font-medium text-white/85 hover:underline">
              <span aria-hidden="true">{d.icon}</span> {d.title}
            </Link>
            {rows[d.prefix] ?? <span className="text-xs text-white/35">해당 없음</span>}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function EsopPage() {
  const [params] = useSearchParams()
  const service = DOMAINS.find((d) => d.prefix.slice(1) === params.get("system"))
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">e-SOP 대응</h1>
        <p className="mt-1 text-sm text-white/50">
          단계·조치 체크리스트·승인 현황을 서비스별로 확인합니다. 지금 처리할 결재·지시 대기는{" "}
          <Link to="/approvals" className="text-accent hover:underline">
            통합 결재함
          </Link>
          에서 봅니다.
        </p>
      </div>
      <ServicePills basePath="/esop" current={service?.prefix} />
      {!service ? (
        <Overview />
      ) : service.prefix === "/aqua" ? (
        <AquaResponsePage embedded />
      ) : service.prefix === "/river" ? (
        <RiverView />
      ) : service.prefix === "/coast" ? (
        <CoastView />
      ) : (
        <NotApplicable prefix={service.prefix} title={service.title} />
      )}
    </div>
  )
}
