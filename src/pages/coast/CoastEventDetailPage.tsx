import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { COAST_NAV } from "./coastNav"
import { coastEventDetail } from "../../data/mockCoast"

export function CoastEventDetailPage() {
  const d = coastEventDetail
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">위험 이벤트 상세</h1>
          <p className="mt-1 text-sm text-white/50">{d.id}</p>
        </div>
        <RiskBadge level={d.level} label={d.status} solid />
      </div>

      <DomainSubNav items={COAST_NAV} />

      <Card title="이벤트 기본 정보">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="이벤트 유형" value={d.type} />
          <Field label="탐지 시각" value={d.detectedAt} />
          <Field label="위험 등급" value={d.grade} />
          <Field label="탐지 출처" value={d.source} />
          <Field label="담당 구역" value={d.zone} />
          <Field label="검토 담당자" value={`${d.reviewer} · ${d.reviewStatus}`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="GIS 위험 위치 및 영향 범위">
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-xs text-white/30">
            GIS 지도 — 위험 위치 및 영향 반경 표시
          </div>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="위험 위치" value={d.location} />
            <Row label="영향 반경" value={d.radius} />
            <Row label="인근 연안 구역" value={d.nearbyCoast} />
            <Row label="이안류 위험 구간" value={d.ripCurrentZone} />
            <Row label="관련 하천" value={d.relatedRiver} />
            <Row label="인근 양식장" value={d.nearbyFarms} />
          </dl>
        </Card>

        <Card title="AI 판단 근거 요약">
          <div className="flex flex-col gap-3 text-sm">
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="font-semibold text-white/80">강우 · 수위</p>
              <p className="text-xs text-white/40">{d.rainSummary.value} · {d.rainSummary.detail}</p>
              <p className="text-xs text-white/30">갱신 {d.rainSummary.updatedAt}</p>
            </div>
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="font-semibold text-white/80">파고 · 조위</p>
              <p className="text-xs text-white/40">{d.waveSummary.value} · {d.waveSummary.detail}</p>
              <p className="text-xs text-white/30">갱신 {d.waveSummary.updatedAt}</p>
            </div>
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="font-semibold text-white/80">이안류 위험도</p>
              <p className="text-xs text-white/40">{d.ripCurrentRisk.value} · {d.ripCurrentRisk.detail}</p>
              <p className="text-xs text-white/30">{d.ripCurrentRisk.confidence}</p>
            </div>
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="font-semibold text-white/80">현장 영상 탐지</p>
              <p className="text-xs text-white/40">{d.detection.class}</p>
              <p className="text-xs text-white/30">{d.detection.confidence}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="센서 교차 검증">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {d.sensorCrossCheck.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3">
              <p className="text-sm font-medium text-white/80">{s.name}</p>
              <RiskBadge level={s.status === "정상" ? "safe" : "warning"} label={s.status} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="위험도 변화 타임라인">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {d.timeline.map((t) => (
            <li key={t.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{t.time}</span>
              <p className="text-white/70">{t.title}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="기관 공조 상태">
          <ul className="flex flex-col gap-2">
            {d.agencyStatus.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-2.5 text-sm">
                <p className="text-white/80">{a.agency}</p>
                <span className="text-xs text-white/40">{a.status}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="현장 통제·출동·경보 조치 현황">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="출동 요청" value={d.fieldActions.dispatch} />
            <Row label="통제 조치" value={d.fieldActions.control} />
            <Row label="주민 경보" value={d.fieldActions.alert} />
          </dl>
        </Card>
      </div>
    </div>
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
