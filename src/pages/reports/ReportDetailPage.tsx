import { useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { incidentRecords } from "../../data/mockReports"

export function ReportDetailPage() {
  const { incidentId } = useParams()
  const record = incidentRecords.find((r) => r.id === incidentId)
  const [trainingRegistered, setTrainingRegistered] = useState(false)

  if (!record) {
    return <Navigate to="/reports" replace />
  }

  const { detail, timeline, sopApprovals, agencyActions, attachments } = record

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/reports" className="text-xs font-semibold text-white/40 hover:text-accent">
            ← 이력·보고서 조회로
          </Link>
          <h1 className="mt-1 text-xl font-bold text-white">상황 종료 보고서</h1>
          <p className="mt-1 text-sm text-white/50">{record.title}</p>
        </div>
        <div className="print-hide flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-inset"
          >
            보고서 내보내기 (PDF)
          </button>
          <button
            type="button"
            onClick={() => setTrainingRegistered(true)}
            disabled={trainingRegistered}
            className="rounded-full border border-accent px-3 py-1.5 text-xs font-bold text-accent transition hover:bg-accent-soft disabled:opacity-50"
          >
            {trainingRegistered ? "✓ 학습 데이터 등록됨" : "학습 데이터 등록"}
          </button>
        </div>
      </div>

      <Card title="종료 사건 요약">
        <RiskBadge level={record.level} label={record.levelLabel} solid />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="위험 유형" value={record.domainLabel} />
          <Field label="발생 위치" value={detail.location} />
          <Field label="최초 탐지 시각" value={detail.detectedAt} />
          <Field label="종료 시각" value={detail.endedAt} />
          <Field label="최고 위험 등급" value={detail.maxGrade} />
          <Field label="예측 신뢰도" value={detail.confidence} />
          <Field label="최종 승인자" value={detail.approver} />
          <Field label="처리 상태" value={detail.status} />
        </div>
      </Card>

      <Card title="사건 타임라인">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {timeline.map((t) => (
            <li key={t.time} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{t.time}</span>
              <span className="shrink-0 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-semibold text-white/60">
                {t.stage}
              </span>
              <p className="text-white/70">{t.content}</p>
              <span className="ml-auto text-xs text-white/35">{t.owner}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="e-SOP 단계 및 담당자 승인 이력">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">단계</th>
              <th className="pb-2 font-medium">승인 내용</th>
              <th className="pb-2 font-medium">승인자</th>
              <th className="pb-2 font-medium">승인 시각</th>
              <th className="pb-2 font-medium">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sopApprovals.map((a) => (
              <tr key={a.stage}>
                <td className="py-2 font-medium text-white/80">{a.stage}</td>
                <td className="py-2 text-white/60">{a.content}</td>
                <td className="py-2 text-white/60">{a.approver}</td>
                <td className="py-2 text-white/40">{a.time}</td>
                <td className="py-2 text-white/40">{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="기관 공조 및 현장 조치 결과">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-white/35">
              <th className="pb-2 font-medium">기관명</th>
              <th className="pb-2 font-medium">공조 내용</th>
              <th className="pb-2 font-medium">출동 시각</th>
              <th className="pb-2 font-medium">조치 결과</th>
              <th className="pb-2 font-medium">확인자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {agencyActions.map((a) => (
              <tr key={a.agency}>
                <td className="py-2 font-medium text-white/80">{a.agency}</td>
                <td className="py-2 text-white/60">{a.action}</td>
                <td className="py-2 text-white/40">{a.dispatchedAt}</td>
                <td className="py-2"><RiskBadge level="safe" label={a.result} /></td>
                <td className="py-2 text-white/40">{a.confirmedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="첨부 증빙 및 보고서 미리보기">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center justify-between py-2.5 text-sm">
              <p className="text-white/70">📎 {att.name}</p>
              <span className="text-xs text-white/35">{att.time}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle bg-inset text-xs text-white/30">
          보고서 미리보기 (PDF)
        </div>
      </Card>
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
