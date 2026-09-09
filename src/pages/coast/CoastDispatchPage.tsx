import { useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DomainSubNav } from "../../components/shared/DomainSubNav"
import { COAST_NAV } from "./coastNav"
import { coastDispatch } from "../../data/mockCoast"

export function CoastDispatchPage() {
  const d = coastDispatch
  const [escalated, setEscalated] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">현장 공조 — 해경 출동 요청</h1>
        <p className="mt-1 text-sm text-white/50">{d.summary.title}</p>
      </div>

      <DomainSubNav items={COAST_NAV} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="위험 사건 요약" className="xl:col-span-2">
          <RiskBadge level="danger" label={d.summary.level} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="발생 위치" value={d.summary.location} />
            <Row label="탐지 시각" value={d.summary.detectedAt} />
            <Row label="AI 신뢰도" value={`${d.confidence}%`} />
            <Row label="이안류 경보" value={d.ripCurrent} />
            <Row label="위험 구역 반경" value={d.radius} />
            <Row label="인접 피서객 추정" value={d.nearbyVisitors} />
            <Row label="기상 조건" value={d.weather} />
          </dl>
          <div className="mt-3 rounded-lg border border-border-subtle bg-inset p-3 text-xs text-white/50">
            <p className="font-semibold text-white/70">AI 판단 근거</p>
            <p className="mt-1">{d.aiReason}</p>
          </div>
        </Card>

        <Card title="해경 출동 요청 현황">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="출동 요청 상태" value={escalated ? "대체 채널 전환됨 · 응신 대기 중" : d.request.status} />
            <Row label="요청 기관" value={d.request.agency} />
            <Row label="전송 시각" value={d.request.sentAt} />
            <Row label="우선순위" value={d.request.priority} />
            <Row label="출동 함정" value={d.request.vessel} />
            <Row label="예상 도달" value={d.request.eta} />
            <Row label="제주소방 연계" value={d.request.fireLinked} />
            <Row label="도 상황실 공유" value={d.request.boardShared} />
          </dl>
        </Card>
      </div>

      <Card title="GIS 위치 정보">
        <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-sm text-white/30">
          삼양해수욕장 북측 방파제 위험 구역 GIS 지도
        </div>
      </Card>

      <div className="rounded-lg border border-risk-warning/40 bg-risk-warning-bg p-4 text-sm text-risk-warning">
        <p className="font-semibold">연계 실패 또는 무응신 시</p>
        <p className="mt-1 text-white/70">{d.fallback}</p>
      </div>

      {escalated && (
        <div className="rounded-lg border border-risk-safe/40 bg-risk-safe-bg p-3 text-sm text-risk-safe">
          ✓ 대체 채널(위성전화·핫라인)로 전환 요청을 보냈습니다. 인근 구조정 재요청도 함께 접수되었습니다.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          to="/coast/monitoring"
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-black transition hover:bg-accent-hover"
        >
          현장 모니터링으로 이동
        </Link>
        <button
          type="button"
          onClick={() => setEscalated(true)}
          disabled={escalated}
          className="rounded-full border border-risk-danger/40 px-4 py-2.5 text-sm font-semibold text-risk-danger transition hover:bg-risk-danger-bg disabled:opacity-40"
        >
          {escalated ? "연계 실패 대응 완료" : "연계 실패 안내"}
        </button>
      </div>
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
