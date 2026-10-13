import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { ServicePills } from "../../components/ui/ServicePills"
import {
  ACTUAL_CLASSIFIER, AQUA_TEMP_TEXT, CRITERIA_STAGES, KMA_SERVICES, KMA_STAGE_TEXT, METRICS,
  aquaTempLevel, classifyMetric, kmaStageOf, levelRank, stepText, type MetricSpec,
} from "../../data/riskCriteria"
import type { ServiceId } from "../../data/rolesLogic"
import type { RiskLevel } from "../../types/domain"

const LEVEL_LABEL: Record<RiskLevel, string> = { safe: "정상", caution: "관심", warning: "주의", alert: "경계", danger: "심각", info: "정보", offline: "-" }
const input = "w-28 rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white outline-none focus:border-accent"

const isKma = (id: string) => (KMA_SERVICES as string[]).includes(id)

/** 서비스의 단계별 조건 문구 목록 */
function conditionsOf(id: ServiceId, level: (typeof CRITERIA_STAGES)[number]["level"]): string[] {
  if (isKma(id)) return [KMA_STAGE_TEXT[level]]
  const lines = (METRICS[id] ?? []).map((m) => stepText(m, level))
  return id === "aqua" ? [...lines, AQUA_TEMP_TEXT[level]] : lines
}

/**
 * 운영 > 위험 단계 조건 — 요구사항 '위험 단계 조건': 재난 유형별 정상·관심·주의·경계·심각 이벤트 조건을 정의하고 적용한다.
 * 하천·연안·저염분은 화면이 실제로 쓰는 판정 함수와 같은 경계값이고(시험 위젯이 둘의 결과를 나란히 보여 준다), 나머지 6종은 기상청 특보 등급을 따른다.
 * 기준을 바꾸려면 판정 함수와 이 정의를 함께 고쳐야 하므로 이 화면에는 편집 기능이 없다(확정 기준은 협의 후 반영).
 */
export function CriteriaPage() {
  const [params] = useSearchParams()
  const service = DOMAINS.find((d) => d.prefix.slice(1) === params.get("system"))
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">위험 단계 조건</h1>
        <p className="mt-1 text-sm text-white/50">재난 유형별로 정상 → 관심 → 주의 → 경계 → 심각이 되는 조건을 한곳에서 확인하고, 값을 넣어 단계를 시험해 봅니다.</p>
      </div>
      <ServicePills basePath="/criteria" current={service?.prefix} />
      {service ? <ServiceView id={service.prefix.slice(1) as ServiceId} title={service.title} /> : <Overview />}
    </div>
  )
}

function Overview() {
  return (
    <Card title="서비스별 단계 조건" subtitle="서비스 버튼을 누르면 상세 조건과 시험 화면이 열립니다">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead>
            <tr className="text-white/40">
              <th className="pb-2 pr-3 font-medium">서비스</th>
              {CRITERIA_STAGES.map((s) => (
                <th key={s.level} className="pb-2 pr-3 font-medium">
                  {s.label}
                </th>
              ))}
              <th className="pb-2 font-medium">적용 기준</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {DOMAINS.map((d) => {
              const id = d.prefix.slice(1) as ServiceId
              return (
                <tr key={id} className="align-top">
                  <td className="py-2 pr-3 font-semibold text-white/85">
                    <span aria-hidden="true">{d.icon}</span> {d.title}
                  </td>
                  {CRITERIA_STAGES.map((s) => (
                    <td key={s.level} className="py-2 pr-3 text-white/60">
                      {isKma(id) && s.level === "danger" ? "관계기관 판단" : conditionsOf(id, s.level).join(" · ")}
                    </td>
                  ))}
                  <td className="py-2 text-white/40">{isKma(id) ? "기상청 특보 등급" : "판정 함수(코드)"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ServiceView({ id, title }: { id: ServiceId; title: string }) {
  return (
    <>
      <Card title={`${title} — 단계별 조건`} subtitle={isKma(id) ? "기상청 특보 등급을 그대로 씁니다(예비특보 → 관심, 주의보 → 주의, 경보 → 경계)" : "화면이 쓰는 판정 함수의 경계값 — 여러 지표는 가장 높은 단계를 따릅니다"}>
        <ul className="flex flex-col divide-y divide-border-subtle">
          <li className="flex items-center gap-3 py-2.5 text-sm">
            <RiskBadge level="safe" label="정상" />
            <span className="text-white/60">위 조건에 모두 못 미침</span>
          </li>
          {CRITERIA_STAGES.map((s) => (
            <li key={s.level} className="flex flex-wrap items-start gap-3 py-2.5 text-sm">
              <RiskBadge level={s.level} label={s.label} />
              <span className="min-w-0 flex-1 text-white/80">{conditionsOf(id, s.level).join("  ·  ")}</span>
            </li>
          ))}
        </ul>
        {(METRICS[id] ?? []).some((m) => m.note) && (
          <p className="mt-3 text-[11px] text-white/35">{(METRICS[id] ?? []).map((m) => m.note).filter(Boolean).join(" · ")}</p>
        )}
      </Card>
      <Card title="적용 시험" subtitle="값을 넣으면 정의표 기준과 화면 판정 함수가 각각 어느 단계로 보는지 나란히 보여 줍니다">
        {isKma(id) ? <KmaTest /> : id === "aqua" ? <AquaTest /> : <MetricTest specs={METRICS[id] ?? []} />}
      </Card>
    </>
  )
}

function Result({ label, level }: { label: string; level: RiskLevel }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-white/50">
      {label}
      <RiskBadge level={level} label={LEVEL_LABEL[level]} />
    </span>
  )
}

function Agree({ a, b }: { a: RiskLevel; b: RiskLevel }) {
  return <span className={`text-xs font-bold ${a === b ? "text-accent" : "text-risk-danger"}`}>{a === b ? "✓ 일치" : "✗ 불일치"}</span>
}

function MetricTest({ specs }: { specs: MetricSpec[] }) {
  const [vals, setVals] = useState<Record<string, string>>({})
  const results = specs.map((m) => {
    const v = vals[m.id]
    const n = v === undefined || v === "" ? null : Number(v)
    return { m, n, table: n == null || Number.isNaN(n) ? null : classifyMetric(m, n), actual: n == null || Number.isNaN(n) ? null : ACTUAL_CLASSIFIER[m.id](n) }
  })
  const entered = results.filter((r) => r.table && r.actual)
  const worst = (k: "table" | "actual") => entered.map((r) => r[k] as RiskLevel).sort((a, b) => levelRank(b) - levelRank(a))[0]
  return (
    <div className="flex flex-col gap-3">
      {results.map(({ m, table, actual }) => (
        <div key={m.id} className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/70">
            {m.label}
            <input className={input} inputMode="decimal" value={vals[m.id] ?? ""} onChange={(e) => setVals({ ...vals, [m.id]: e.target.value })} placeholder={m.unit} aria-label={m.label} />
          </label>
          {table && actual && (
            <>
              <Result label="정의표" level={table} />
              <Result label="화면 판정" level={actual} />
              <Agree a={table} b={actual} />
            </>
          )}
        </div>
      ))}
      {entered.length > 1 && (
        <p className="flex items-center gap-2 text-sm text-white/70">
          종합(가장 높은 단계) <RiskBadge level={worst("actual")} label={LEVEL_LABEL[worst("actual")]} />
        </p>
      )}
    </div>
  )
}

function AquaTest() {
  const [temp, setTemp] = useState("")
  const [days, setDays] = useState("0")
  const t = temp === "" ? null : Number(temp)
  return (
    <div className="flex flex-col gap-4">
      <MetricTest specs={METRICS.aqua ?? []} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-white/70">
          수온
          <input className={input} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="℃" aria-label="수온" />
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          28℃ 이상 지속
          <input className={input} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="일" aria-label="지속 일수" />
        </label>
        {t != null && !Number.isNaN(t) && <Result label="화면 판정(수온)" level={aquaTempLevel(t, Number(days) || 0)} />}
      </div>
      <p className="text-[11px] text-white/35">염분과 수온을 함께 볼 때의 복합 승격 규칙(예: 28℃ 이상 + 26psu 이하 → 심각)은 화면 판정 함수에 들어 있습니다.</p>
    </div>
  )
}

function KmaTest() {
  const [lvl, setLvl] = useState<"1" | "2" | "3">("2")
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-white/70">
        기상청 특보
        <select className="rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white" value={lvl} onChange={(e) => setLvl(e.target.value as "1" | "2" | "3")} aria-label="기상청 특보 단계">
          <option value="1">예비특보</option>
          <option value="2">주의보</option>
          <option value="3">경보</option>
        </select>
      </label>
      <Result label="화면 판정" level={kmaStageOf(lvl)} />
      <span className="text-xs text-white/35">심각은 관계기관 판단으로 정하며 자동 판정하지 않습니다.</span>
    </div>
  )
}
