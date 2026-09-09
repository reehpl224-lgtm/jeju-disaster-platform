import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaActionLog, aquaDataIssues, aquaDataSources } from "../../data/mockAqua"

const STATUS_LEVEL = {
  normal: "safe",
  delayed: "caution",
  error: "danger",
  missing: "offline",
} as const

const STATUS_LABEL = {
  normal: "정상",
  delayed: "지연",
  error: "오류",
  missing: "누락",
} as const

export function AquaDataPage() {
  const normalCount = aquaDataSources.filter((s) => s.status === "normal").length
  const issueCount = aquaDataSources.length - normalCount

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 수집 현황</h1>
        <p className="mt-1 text-sm text-white/50">저염분수·고수온 예측에 활용되는 이기종 데이터 소스 수집 상태</p>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-white/40">전체 소스</p>
          <p className="mt-1 text-xl font-bold text-white">{aquaDataSources.length}</p>
          <p className="mt-1 text-xs text-white/35">등록된 수집 대상</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">정상 수집</p>
          <p className="mt-1 text-xl font-bold text-risk-safe">{normalCount}</p>
          <p className="mt-1 text-xs text-white/35">최근 5분 이내 갱신</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">지연·누락·오류</p>
          <p className="mt-1 text-xl font-bold text-risk-warning">{issueCount}</p>
          <p className="mt-1 text-xs text-white/35">확인 필요</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">데이터 품질 점수</p>
          <p className="mt-1 text-xl font-bold text-white">94%</p>
          <p className="mt-1 text-xs text-white/35">전체 소스 평균</p>
        </Card>
      </div>

      <Card title="수집 대상별 데이터 소스">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaDataSources.map((source) => (
            <li key={source.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-white/85">{source.name}</p>
                <p className="text-xs text-white/40">
                  갱신: 2026-09-04 {source.updatedAt} · 주기: {source.cycle}
                </p>
              </div>
              <div className="text-right">
                <RiskBadge level={STATUS_LEVEL[source.status]} label={STATUS_LABEL[source.status]} />
                <p className="mt-1 text-xs text-white/35">
                  {source.qualityScore !== null ? `품질 점수 ${source.qualityScore}%` : "품질 점수 —"} · {source.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="지연·누락·오류 원인 및 영향">
        <ul className="flex flex-col gap-3">
          {aquaDataIssues.map((issue) => (
            <li key={issue.id} className="rounded-lg border border-border-subtle bg-inset p-3">
              <div className="flex items-center gap-2">
                <RiskBadge
                  level={issue.type === "error" ? "danger" : issue.type === "delayed" ? "caution" : "offline"}
                  label={issue.type === "error" ? "오류" : issue.type === "delayed" ? "지연" : "누락"}
                  solid
                />
                <p className="text-sm font-semibold text-white/85">{issue.title}</p>
              </div>
              <p className="mt-2 text-xs text-white/45">원인: {issue.cause}</p>
              <p className="mt-1 text-xs text-white/45">영향: {issue.impact}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="수집 상태 변경 및 조치 이력">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaActionLog.map((log) => (
            <li key={log.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-white/80">
                  {log.time} — {log.title}
                </p>
                <p className="mt-0.5 text-xs text-white/35">
                  담당자: {log.owner} · 조치: {log.action}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-bold ${log.status === "완료" ? "text-risk-safe" : "text-risk-caution"}`}>
                {log.status}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
