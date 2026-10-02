import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { DataSourceCategoryPanel } from "../../components/ui/DataSourceCategoryPanel"
import { LIVE } from "../../components/ui/dataSource"
import { FireWeatherPanel, QuakePanel, SnowForecastPanel } from "../../components/ui/HazardLivePanels"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { StatTiles } from "../../components/ui/StatTiles"
import { VilageForecastPanel } from "../../components/ui/VilageForecastPanel"
import { WarningsPanel } from "../../components/ui/WarningsPanel"
import { riskMarkers } from "../../data/mockDashboard"
import { dataSourcesByService } from "../../data/mockDataSourceCategories"
import { HAZARDS, type HazardDef, type HazardId } from "../../data/mockHazards"
import { LeaderDetailBrief } from "../domain/LeaderBrief"
import { hazardBrief } from "../domain/leaderBriefs"

const LINK_LEVEL = { "연계 진행중": "safe", "협의 중": "caution", 미연계: "offline" } as const

/** 종류별 실시간 참고 패널(제주시·한라산 예보 / 최근 지진) */
function LiveReference({ h, wide }: { h: HazardDef; wide?: boolean }) {
  if (h.live === "quake") {
    return (
      <Card title="최근 지진 — USGS" subtitle="규모 4.5 이상 · 최근 1주 · 동아시아·서태평양(참고)" source={LIVE}>
        <QuakePanel limit={wide ? 15 : 8} />
      </Card>
    )
  }
  const Panel = h.live === "fire" ? FireWeatherPanel : SnowForecastPanel
  const title = h.live === "fire" ? "산불 기상조건 — 습도·풍속 예보" : "적설·기온 예보"
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title={`${title} · 제주시`} subtitle="Open-Meteo 시간별 예보 — 참고용" source={LIVE}>
        <Panel site="jeju" />
      </Card>
      <Card title={`${title} · 한라산`} subtitle="Open-Meteo 시간별 예보 — 참고용" source={LIVE}>
        <Panel site="halla" />
      </Card>
    </div>
  )
}

function LegacyCard({ h }: { h: HazardDef }) {
  return (
    <Card title="레거시·외부 시스템 연계 현황" subtitle="연계 대상·방식은 조사·협의 후 갱신">
      {h.legacy.length === 0 ? (
        <p className="text-xs text-white/40">연계 대상 시스템 없음</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {h.legacy.map((s) => (
            <li key={s.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white/85">{s.name}</p>
                <RiskBadge level={LINK_LEVEL[s.linkStatus]} label={s.linkStatus} />
              </div>
              <p className="mt-0.5 text-xs text-white/40">
                {s.operator} · {s.note}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Page({ title, desc, action, children }: { title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {desc && <p className="mt-1 text-sm text-white/50">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const ghostLink = "inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"

export function HazardHomePage({ id }: { id: HazardId }) {
  const h = HAZARDS[id]
  const markers = riskMarkers.filter((m) => m.domain === id)
  return (
    <Page title={`${h.title} 통합 현황`} desc={h.subtitle}>
      <LeaderDetailBrief brief={hazardBrief(id)} />
      <Card title={`위험 위치 — ${h.title} GIS`} subtitle="자체 관측 지점이 없어 표시할 마커가 없습니다" dummy>
        <div className="relative h-[480px] w-full overflow-hidden rounded-lg">
          <JejuTileMap markers={markers} className="relative h-full w-full" />
        </div>
      </Card>
      <Card title={`${h.wrnTitle} — 기상청 API허브`} subtitle="apihub.kma.go.kr 실연동(wrn_met_data.php)" source={LIVE}>
        <WarningsPanel wrnCodes={h.wrnCodes} />
      </Card>
      <LiveReference h={h} />
      <LegacyCard h={h} />
    </Page>
  )
}

export function HazardDataPage({ id }: { id: HazardId }) {
  const h = HAZARDS[id]
  const sources = dataSourcesByService[id]
  return (
    <Page title="데이터 수집 현황" desc={`${h.title} 위험 판단에 활용되는 데이터 소스의 실제 연동 가능 여부`}>
      <Card title="데이터 출처 현황" subtitle="이 서비스가 쓰는 데이터를 실제 연동 가능 여부로 구분">
        <DataSourceCategoryPanel sources={sources} />
      </Card>
      <StatTiles
        items={[
          { label: "현재 사용 가능", value: sources.available.length, tone: "safe" },
          { label: "제주 레거시(미적용)", value: sources.legacy.length, tone: "caution" },
          { label: "요청 가능(실증서비스)", value: sources.requestable.length, tone: "info" },
          { label: "현재 없는 데이터", value: sources.missing.length, tone: "offline" },
        ]}
      />
      <LegacyCard h={h} />
    </Page>
  )
}

export function HazardAnalysisPage({ id }: { id: HazardId }) {
  const h = HAZARDS[id]
  return (
    <Page title={`상세 분석 — ${h.title}`} desc="실시간 공개 데이터 기반 참고 지표 — 위험등급 판정에는 쓰지 않습니다">
      <Card title={`${h.wrnTitle} — 기상청 API허브`} subtitle="apihub.kma.go.kr 실연동(wrn_met_data.php)" source={LIVE}>
        <WarningsPanel wrnCodes={h.wrnCodes} />
      </Card>
      <LiveReference h={h} wide />
      <Card title="기상청 단기예보" subtitle="제주 단기예보 참고" source={LIVE}>
        <VilageForecastPanel />
      </Card>
    </Page>
  )
}

export function HazardAlertPage({ id }: { id: HazardId }) {
  const h = HAZARDS[id]
  const d = h.dispatch
  return (
    <Page
      title="경보 발송 현황"
      desc={d.message}
      action={
        <Link to={`${h.path}/closure`} className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-xs font-bold text-accent hover:bg-accent-soft">
          상황 종료 처리
        </Link>
      }
    >
      <Card title="발송 대상 및 위험 단계" dummy>
        <RiskBadge level={d.level} label={d.stage} solid />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="발송 대상" value={`${d.target} (${d.targetDetail})`} />
          <Field label="발송 시각" value={d.sentAt} />
          <Field label="승인자" value={d.approver} />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {d.channels.map((ch) => (
          <Card key={ch.id}>
            <p className="text-sm font-semibold text-white/85">{ch.name}</p>
            <p className="mt-2 text-xs text-white/40">
              발송 {ch.sent.toLocaleString()}
              {ch.unit ?? "건"}
            </p>
            <p className="text-xs text-white/40">수신 성공 {ch.success.toLocaleString()}</p>
            <p className="text-xs text-white/40">실패 {ch.fail.toLocaleString()}</p>
            <p className="mt-1 text-sm font-bold text-accent">성공률 {ch.rate}</p>
            <p className="mt-1 text-[11px] text-white/30">최근 발송: {ch.lastSent}</p>
          </Card>
        ))}
      </div>
      <Card title="수신 실패 현황" subtitle={`전체 실패: ${d.totalFail}건`} dummy>
        <p className="text-xs text-white/40">발송 이력이 없습니다.</p>
      </Card>
    </Page>
  )
}

export function HazardClosurePage({ id }: { id: HazardId }) {
  const h = HAZARDS[id]
  const c = h.closure
  return (
    <Page
      title="종료 보고"
      desc={`${c.caseId} · ${c.title}`}
      action={
        <Link to={h.path} className={ghostLink}>
          {h.title} 대시보드로 →
        </Link>
      }
    >
      <Card title="사건 상태" dummy>
        <RiskBadge level="offline" label={c.status} solid />
        <p className="mt-2 text-xs text-white/40">{c.confirmedBy}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="사건 유형" value={c.type} />
          <Field label="발생 위치" value={c.location} />
          <Field label="총 대응 시간" value={`${c.duration} (${c.durationDetail})`} />
          <Field label="기관 공조" value={`${c.agencies} · ${c.agencyDetail}`} />
        </div>
      </Card>
      <Card title="종료 조건 충족 여부" dummy>
        {c.closureConditions.length === 0 ? (
          <p className="text-xs text-white/40">종료할 사건이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {c.closureConditions.map((cond) => (
              <li key={cond} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-risk-safe">✔</span> {cond}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="최종 사건 종료 보고서" dummy>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="담당 부서" value={c.report.department} />
          <Row label="승인 근거 e-SOP" value={c.report.sop} />
          <Row label="인명 피해" value={c.report.casualties} />
          <Row label="재산 피해" value={c.report.property} />
          <Row label="학습 포인트" value={c.report.lesson} />
        </dl>
      </Card>
    </Page>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="text-sm font-medium text-white/85">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle/60 pb-2">
      <dt className="shrink-0 text-white/40">{label}</dt>
      <dd className="text-right font-medium text-white/80">{value}</dd>
    </div>
  )
}
