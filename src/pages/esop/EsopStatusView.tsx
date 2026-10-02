import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChecklistRow } from "../../components/aqua/ChecklistRow"
import { StageTracker } from "../../components/aqua/StageTracker"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import type { AquaChecklistItem, AquaStage } from "../../types/aqua"
import type { RiskLevel } from "../../types/domain"

/** 정상(safe)을 뺀 단계 하나 — 위험단계 기준표(TP-P22_002)의 행에서 만든다 */
export interface EsopCriteria {
  level: RiskLevel
  label: string
  /** 이 단계에서 하는 조치(기준표의 조치 문구). 문구가 아직 없으면 비워 둔다 */
  action?: string
  /** 이 단계로 올라가는 기준 */
  trigger: string
}

export interface EsopAgency {
  id: string
  agency: string
  role: string
  approve: string
  execute: string
}

export interface EsopStatusProps {
  title: string
  /** true면 운영 > e-SOP 대응 화면 안에 들어가는 것 — 쪽 제목(h1)은 바깥 화면이 갖는다 */
  embedded?: boolean
  level: RiskLevel
  /** 현재 단계 이름(배지 글자) */
  grade: string
  detectedAt: string
  location: string
  /** 서비스 고유 지표 — 공통 줄(위험 등급·감지 시각·발생 위치) 뒤에 붙는다 */
  metrics: [string, string][]
  /** 낮은 단계 → 높은 단계 순서, 정상 제외 */
  criteria: EsopCriteria[]
  /** 단계 상태를 데이터가 직접 들고 있으면 넘긴다(없으면 level로 계산) */
  stages?: AquaStage[]
  checklist: AquaChecklistItem[]
  /** 체크리스트 항목 옆 버튼(서비스 전용 동작) — 없으면 버튼 없음 */
  checklistAction?: (item: AquaChecklistItem) => ReactNode
  agencies: EsopAgency[]
  /** 해제 조건 — 없으면 "미정" */
  release: string[]
  links: [string, string][]
}

const pillLink = "inline-flex h-9 items-center rounded-md border border-white/20 px-4 text-xs font-bold text-white hover:bg-white/10"

/**
 * e-SOP 대응 화면의 공통 구성 — 저염분 고수온·하천범람·연안 안전관리가 같이 쓴다.
 * 머리말 · 현재 재난 상황 · 진행 단계 요약 · 단계별 대응 절차(기준·조치 + 조치 체크리스트) · 담당 기관 · 다음 단계 안내.
 * 서비스마다 없는 값(조치 문구·체크리스트·해제 조건)은 같은 자리에 "없음"으로 비워 두고, 데이터가 들어오면 그 자리에 채워진다.
 * 승인·발송은 각 서비스 화면에서 하므로 여기서는 현황을 보고 그 화면으로 이동한다(links).
 */
export function EsopStatusView(p: EsopStatusProps) {
  const Title = p.embedded ? "h2" : "h1"
  const current = p.criteria.findIndex((c) => c.level === p.level) // 정상이면 -1 — 전부 "대기"
  const stages: AquaStage[] =
    p.stages ??
    [...p.criteria.map((c) => c.label), "해제"].map((label, i) => ({
      step: i + 1,
      label,
      status: i < current ? "완료" : i === current ? "진행 중" : "대기",
    }))
  const next = p.criteria[current + 1]
  const remaining = p.checklist.filter((c) => c.status === "미완료" || c.status === "실패").length
  const rows: [string, string][] = [["위험 등급", p.grade], ["감지 시각", p.detectedAt], ["발생 위치", p.location], ...p.metrics]
  const empty = <p className="text-xs text-white/40">데이터가 없습니다.</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Title className="text-xl font-bold text-white">{p.title} e-SOP 대응 절차</Title>
          <p className="mt-1 text-sm text-white/50">{current < 0 ? "진행 중인 사건 없음" : `${p.grade} 단계 진행 중`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.links.map(([to, label]) => (
            <Link key={to} to={to} className={pillLink}>
              {label} →
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="현재 재난 상황" dummy>
          <RiskBadge level={p.level} label={p.grade} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-border-subtle/60 pb-2">
                <dt className="shrink-0 text-white/40">{label}</dt>
                <dd className="text-right font-medium text-white/80">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="진행 단계 요약" subtitle="관심 → 주의 → 경계 → 심각 → 해제" dummy>
          <StageTracker stages={stages} />
        </Card>
      </div>

      <Card title="e-SOP 단계별 대응 절차" subtitle="위험단계 기준표(TP-P22_002)의 단계별 기준·조치" dummy>
        <ul className="flex flex-col gap-2.5">
          {p.criteria.map((c, i) => (
            <li
              key={c.label}
              className={`rounded-lg border p-3 text-sm ${i === current ? "border-accent bg-accent-soft" : "border-border-subtle bg-inset"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <RiskBadge level={c.level} label={c.label} />
                {i === current && <span className="text-[11px] font-bold text-accent">현재 단계</span>}
              </div>
              <p className={`mt-2 ${c.action ? "text-white/75" : "text-white/35"}`}>{c.action ?? "조치 문구 미확정"}</p>
              <p className="mt-1 text-xs text-white/35">기준 · {c.trigger}</p>
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-5 text-xs font-bold text-white/60">조치 체크리스트 — 현재 단계</h3>
        {p.checklist.length === 0 ? (
          empty
        ) : (
          <div className="flex flex-col gap-2.5">
            {p.checklist.map((item) => (
              <ChecklistRow key={item.id} item={item} action={p.checklistAction?.(item)} />
            ))}
          </div>
        )}
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
              {p.agencies.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 font-medium text-white/80">{a.agency}</td>
                  <td className="py-2 text-white/40">{a.role}</td>
                  <td className="py-2 text-white/60">{a.approve}</td>
                  <td className="py-2 text-white/60">{a.execute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="다음 단계 안내" subtitle={next ? `${next.label} 단계 전환 기준` : "최고 단계"} dummy>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li>· {next ? next.trigger : "이미 가장 높은 단계입니다."}</li>
            {p.release.length === 0 ? <li>· 해제 조건 미정</li> : p.release.map((r) => <li key={r}>· 해제 조건: {r}</li>)}
            <li>
              ·{" "}
              {p.checklist.length === 0
                ? "조치 체크리스트 항목 없음"
                : remaining > 0
                  ? `현재 단계 미완료 항목 ${remaining}건 해소 후 종료 처리 가능`
                  : "현재 단계 미완료 항목 모두 해소됨 — 해제 전환 검토 가능"}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
