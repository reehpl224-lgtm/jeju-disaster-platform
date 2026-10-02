import { useState } from "react"
import { aquaAgencyRows, aquaChecklist, aquaResponseState, aquaStages, aquaSummary } from "../../data/mockAqua"
import type { AquaChecklistItem } from "../../types/aqua"
import { EsopStatusView } from "../esop/EsopStatusView"

const BTN = "rounded-full border px-2.5 py-1 text-[11px] font-bold"

/**
 * 저염분 고수온 e-SOP 대응 — 하천범람·연안과 같은 공통 구성(EsopStatusView)에 이 서비스 데이터만 넣는다.
 * embedded: 운영 > e-SOP 대응 화면 안에 넣을 때 — 쪽 제목(h1)은 바깥 화면이 갖는다.
 */
export function AquaResponsePage({ embedded }: { embedded?: boolean }) {
  const [checklist, setChecklist] = useState<AquaChecklistItem[]>(aquaChecklist)

  const resolveItem = (id: string, note: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, status: "완료", time: note } : item)))
  }

  const r = aquaResponseState
  const s = aquaSummary
  return (
    <EsopStatusView
      title="저염분 고수온"
      embedded={embedded}
      level={r.riskLevel}
      grade={r.grade === "-" ? r.level : r.grade}
      detectedAt={r.detectedAt}
      location={r.location}
      metrics={[["예상 도달", r.eta], ["염분(현재)", r.salinity], ["수온(현재)", r.temperature], ["영향 반경", r.radius]]}
      // 염분·수온 단독 기준 5단계(정상 제외)를 단계별 기준으로 — 단계별 조치 문구는 아직 없다
      criteria={s.salinityLevels
        .map((sal, i) => ({ sal, temp: s.temperatureLevels[i] }))
        .filter(({ sal }) => sal.level !== "safe")
        .map(({ sal, temp }) => ({ level: sal.level, label: sal.label, trigger: `염분 ${sal.range} · 수온 ${temp.range}` }))}
      stages={aquaStages}
      checklist={checklist}
      checklistAction={(item) =>
        item.status === "미완료" ? (
          <button type="button" onClick={() => resolveItem(item.id, "현장 점검 완료 확인")} className={`${BTN} border-accent text-accent hover:bg-accent-soft`}>
            미완료 재확인
          </button>
        ) : item.status === "실패" ? (
          <button type="button" onClick={() => resolveItem(item.id, "재발송 완료")} className={`${BTN} border-risk-danger text-risk-danger hover:bg-risk-danger-bg`}>
            발송 실패 확인
          </button>
        ) : undefined
      }
      agencies={aquaAgencyRows}
      release={["염분 30.0 psu 이상으로 24시간 이상 유지 시 정상 하향(해제) 검토"]}
      links={[["/aqua/alerts", "경보 발송"], ["/aqua/monitoring", "실시간 모니터링"]]}
    />
  )
}
