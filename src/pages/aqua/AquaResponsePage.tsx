import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { StageTracker } from "../../components/aqua/StageTracker"
import { ChecklistRow } from "../../components/aqua/ChecklistRow"
import {
  aquaAgencyRows,
  aquaAgencyRowsEmpty,
  aquaChecklist,
  aquaChecklistEmpty,
  aquaResponseState,
  aquaResponseStateEmpty,
  aquaStages,
  aquaStagesEmpty,
} from "../../data/mockAqua"
import type { AquaChecklistItem } from "../../types/aqua"
import { useModeValue } from "../../context/DataModeContext"

export function AquaResponsePage() {
  const responseState = useModeValue(aquaResponseStateEmpty, aquaResponseState)
  const stages = useModeValue(aquaStagesEmpty, aquaStages)
  const agencyRows = useModeValue(aquaAgencyRowsEmpty, aquaAgencyRows)
  const sourceChecklist = useModeValue(aquaChecklistEmpty, aquaChecklist)
  const [checklist, setChecklist] = useState<AquaChecklistItem[]>(sourceChecklist)

  // 데이터 모드 토글로 원본 체크리스트가 바뀌면 로컬 진행 상태(완료 처리 등)를 다시 동기화한다
  useEffect(() => {
    setChecklist(sourceChecklist)
  }, [sourceChecklist])

  const resolveItem = (id: string, note: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "완료", time: note } : item)),
    )
  }

  const remainingCount = checklist.filter((item) => item.status === "미완료" || item.status === "실패").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">e-SOP 대응 절차</h1>
          <p className="mt-1 text-sm text-white/50">{responseState.title}</p>
        </div>
        <Link
          to="/aqua/monitoring"
          className="inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"
        >
          실시간 모니터링으로 이동 →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="현재 재난 상황" dummy>
          <RiskBadge level={responseState.riskLevel} label={responseState.level} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="위험 등급" value={responseState.grade} />
            <Row label="발생 위치" value={responseState.location} />
            <Row label="감지 시각" value={responseState.detectedAt} />
            <Row label="예상 도달" value={responseState.eta} />
            <Row label="염분(현재)" value={responseState.salinity} />
            <Row label="수온(현재)" value={responseState.temperature} />
            <Row label="영향 반경" value={responseState.radius} />
          </dl>
        </Card>

        <Card title="진행 단계 요약" subtitle={`현재 단계 진입 ${responseState.detectedAt.slice(11)} · 담당: 최경보 (재난대응1팀)`} dummy>
          <StageTracker stages={stages} />
        </Card>
      </div>

      <Card title="e-SOP 단계별 대응 절차" subtitle={`${responseState.grade} · 현재 진행 중`} dummy>
        <div className="flex flex-col gap-2.5">
          {checklist.length === 0 && <p className="rounded-lg border border-border-subtle p-3 text-sm text-white/40">진행 중인 대응 절차 없음 — 평시 감시 중</p>}
          {checklist.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              action={
                item.status === "미완료" ? (
                  <button
                    type="button"
                    onClick={() => resolveItem(item.id, "현장 점검 완료 확인")}
                    className="rounded-full border border-accent px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent-soft"
                  >
                    미완료 재확인
                  </button>
                ) : item.status === "실패" ? (
                  <button
                    type="button"
                    onClick={() => resolveItem(item.id, "재발송 완료")}
                    className="rounded-full border border-risk-danger px-2.5 py-1 text-[11px] font-bold text-risk-danger hover:bg-risk-danger-bg"
                  >
                    발송 실패 확인
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="담당 기관별 상태" dummy>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-white/35">
                <th className="pb-2 font-medium">기관</th>
                <th className="pb-2 font-medium">역할</th>
                <th className="pb-2 font-medium">승인</th>
                <th className="pb-2 font-medium">수행</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {agencyRows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-medium text-white/80">{row.agency}</td>
                  <td className="py-2 text-white/40">{row.role}</td>
                  <td className="py-2 text-white/60">{row.approve}</td>
                  <td className="py-2 text-white/60">{row.execute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="다음 단계 안내" subtitle="5단계(해제) 전환 조건" dummy>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li>· 염분 30.0 psu 이상으로 24시간 이상 유지 시 정상 하향(해제) 검토</li>
            <li>
              ·{" "}
              {remainingCount > 0
                ? `현재 단계 미완료 항목 ${remainingCount}건 해소 후 종료 처리 가능`
                : "현재 단계 미완료 항목 모두 해소됨 — 5단계(해제) 전환 검토 가능"}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
      <dt className="text-white/40">{label}</dt>
      <dd className="font-medium text-white/80">{value}</dd>
    </div>
  )
}
