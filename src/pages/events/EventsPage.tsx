import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { EVENT_FIELD_MAP, EVENT_LEVEL_LABEL, toNgsiLd, type CommonEvent, type EventLevel } from "../../data/commonEvent"
import { IS_STAGING } from "../../data/appMode"
import { useCommonEvents } from "../../data/useCommonEvents"
import type { RiskLevel } from "../../types/domain"

const LEVEL_RISK: Record<EventLevel, RiskLevel> = { normal: "safe", caution: "caution", warning: "warning", alert: "alert", danger: "danger" }
const LEVELS: EventLevel[] = ["danger", "alert", "warning", "normal"]
const sel = "rounded-lg border border-border-subtle bg-inset px-3 py-2 text-sm text-white/85"
const svcTitle = (id: string) => (id === "common" ? "공통·기타" : (DOMAINS.find((d) => d.prefix === `/${id}`)?.title ?? id))
const at = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })

/**
 * 공통 이벤트 — 요구사항 '공통 이벤트 구조'·'이벤트 수신·실시간 반영'.
 * 서비스마다 다른 AI 예측값·관측값·위험도·경보 결과를 하나의 구조로 모아 목록으로 보고, 이벤트별로 발생 위치·시각·위험 단계·근거 관측값과
 * 표준 데이터 모델(NGSI-LD) 변환 결과를 확인한다. 특보·태풍·재난문자는 실제 수신, 실증사 값은 연계 전이라 스테이징에서만 샘플이다.
 */
export function EventsPage() {
  const { events, pilot, spNullSources, liveAt } = useCommonEvents()
  const [svc, setSvc] = useState("all")
  const [level, setLevel] = useState<EventLevel | "all">("all")
  const [origin, setOrigin] = useState("all")
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [view, setView] = useState<"detail" | "ngsi">("detail")

  const shown = useMemo(
    () => events.filter((e) => (svc === "all" || e.serviceId === svc) && (level === "all" || e.risk.level === level) && (origin === "all" || e.source.origin === origin)),
    [events, svc, level, origin],
  )
  const picked = shown.find((e) => e.id === pickedId) ?? shown[0]
  const origins = [...new Set(events.map((e) => e.source.origin))]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">공통 이벤트</h1>
        <p className="mt-1 text-sm text-white/50">
          서비스별 AI 예측값·관측값·위험도·경보 결과를 하나의 구조로 모아 보여줍니다 — 기상청 특보·태풍·재난문자는 실제 수신 값이고, 실증사 값은{" "}
          {pilot === "ok" ? "연계 전이라 샘플입니다" : "연계 전이라 값이 없습니다"}.
        </p>
      </div>

      <Card title="이벤트 목록" subtitle={`${shown.length}건 · 최신순`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select value={svc} onChange={(e) => setSvc(e.target.value)} className={sel} aria-label="서비스">
            <option value="all">전체 서비스</option>
            {DOMAINS.map((d) => (
              <option key={d.prefix} value={d.prefix.slice(1)}>
                {d.title}
              </option>
            ))}
            <option value="common">공통·기타</option>
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value as EventLevel | "all")} className={sel} aria-label="위험 단계">
            <option value="all">전체 단계</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {EVENT_LEVEL_LABEL[l]}
              </option>
            ))}
          </select>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={sel} aria-label="출처">
            <option value="all">전체 출처</option>
            {origins.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        {IS_STAGING && pilot === "ok" && (
          <p className="mb-2 rounded-lg bg-inset px-3 py-2 text-xs text-white/50">
            <span className="mr-1 inline-block size-1.5 rounded-full bg-accent align-middle" aria-hidden /> 실증사 이벤트 실시간 수신 중(샘플 · 20초마다 1건) · 마지막 수신{" "}
            {liveAt ? liveAt.toLocaleTimeString("ko-KR", { hour12: false }) : "대기 중"}
          </p>
        )}
        {pilot === "none" && <p className="mb-2 rounded-lg bg-inset px-3 py-2 text-xs text-white/50">실증사 자료가 연계되지 않아 하천·연안·저염분 이벤트는 없습니다 — 데이터 없음</p>}
        {spNullSources.length > 0 && <p className="mb-2 rounded-lg bg-inset px-3 py-2 text-xs text-white/50">받지 못한 출처: {spNullSources.join(" · ")} — 데이터 없음</p>}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ul className="flex max-h-[560px] flex-col divide-y divide-border-subtle overflow-y-auto">
            {shown.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  aria-pressed={picked?.id === e.id}
                  onClick={() => setPickedId(e.id)}
                  className={`flex w-full flex-col gap-1 px-2 py-2.5 text-left hover:bg-white/5 ${picked?.id === e.id ? "bg-accent-soft" : ""}`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <RiskBadge level={LEVEL_RISK[e.risk.level]} label={EVENT_LEVEL_LABEL[e.risk.level]} />
                    <span className="text-xs font-semibold text-white/40">{svcTitle(e.serviceId)}</span>
                    {e.source.sample && <span className="rounded-full border border-white/20 px-2 text-[10px] text-white/50">샘플</span>}
                    {liveAt && e.occurredAt === liveAt.toISOString() && <span className="rounded-full bg-accent px-2 text-[10px] font-bold text-black">방금 수신</span>}
                    <span className="ml-auto text-xs text-white/30">{at(e.occurredAt)}</span>
                  </span>
                  <span className="text-sm font-medium text-white/85">{e.title}</span>
                  <span className="text-xs text-white/40">
                    {e.subject.name} · {e.source.system}
                  </span>
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="py-8 text-center text-sm text-white/30">조건에 맞는 이벤트가 없습니다.</li>}
          </ul>
          {picked && <EventDetail event={picked} view={view} onView={setView} />}
        </div>
      </Card>

      <Card title="공통 이벤트 구조 정의" subtitle="공통 필드와 원천별 대응 항목 — 실증사 API·파일 규격이 확정되면 원천 칸만 채웁니다">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="text-white/40">
                {["공통 필드", "의미", "하천범람", "연안 안전", "저염분·고수온", "기상청·재난문자"].map((h) => (
                  <th key={h} className="pb-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {EVENT_FIELD_MAP.map((r) => (
                <tr key={r.field} className="align-top">
                  <td className="py-2 pr-3 font-mono font-bold text-accent">{r.field}</td>
                  <td className="py-2 pr-3 text-white/70">{r.meaning}</td>
                  <td className="py-2 pr-3 text-white/55">{r.river}</td>
                  <td className="py-2 pr-3 text-white/55">{r.coast}</td>
                  <td className="py-2 pr-3 text-white/55">{r.aqua}</td>
                  <td className="py-2 pr-3 text-white/55">{r.kma}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-white/35">
          연계 항목 정의는 <Link to="/data-systems" className="text-accent hover:underline">데이터 시스템 연계현황</Link>의 수령 예정 자료(2026년 10월 중순)와 함께 확정합니다.
        </p>
      </Card>
    </div>
  )
}

function Measures({ rows }: { rows: CommonEvent["observation"] }) {
  return (
    <table className="w-full text-left text-xs">
      <tbody className="divide-y divide-border-subtle">
        {rows.map((m, i) => (
          <tr key={`${m.name}-${i}`}>
            <td className="py-1.5 pr-2 text-white/50">{m.name}</td>
            <td className="py-1.5 pr-2 font-semibold text-white/85">
              {m.value}
              {m.unit && ` ${m.unit}`}
            </td>
            <td className="py-1.5 text-white/35">{[m.at, m.threshold].filter(Boolean).join(" · ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EventDetail({ event: e, view, onView }: { event: CommonEvent; view: "detail" | "ngsi"; onView: (v: "detail" | "ngsi") => void }) {
  const ngsi = JSON.stringify(toNgsiLd(e), null, 2)
  const field = (label: string, value: string) => (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="text-sm font-medium text-white/85">{value}</p>
    </div>
  )
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-white/15 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-bold text-white/90">{e.title}</p>
        <div role="tablist" className="flex gap-1">
          {(["detail", "ngsi"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => onView(v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${view === v ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"}`}
            >
              {v === "detail" ? "상세" : "NGSI-LD"}
            </button>
          ))}
        </div>
      </div>

      {view === "ngsi" ? (
        <>
          <pre className="max-h-[420px] overflow-auto rounded-lg bg-black/30 p-3 text-[11px] leading-relaxed text-white/70">{ngsi}</pre>
          <div className="flex gap-2">
            <button type="button" className="h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10" onClick={() => void navigator.clipboard?.writeText(ngsi)}>
              복사
            </button>
          </div>
          <p className="text-[11px] text-white/35">AX Hub 표준(NGSI-LD) 매핑 초안입니다. @context 주소는 확정 전 자리표시자이고, 표준 모델 매핑 기준은 AX Hub 자료 수령 후 확정합니다.</p>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {field("이벤트 ID", e.id)}
            {field("서비스", svcTitle(e.serviceId))}
            {field("발생 위치", e.subject.name + (e.subject.lat != null ? ` (${e.subject.lat.toFixed(3)}, ${e.subject.lng?.toFixed(3)})` : ""))}
            {field("발생 시각", at(e.occurredAt))}
            <div className="col-span-2 rounded-lg border border-border-subtle bg-inset px-3 py-2">
              <p className="text-[11px] text-white/35">위험 단계</p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-white/85">
                <RiskBadge level={LEVEL_RISK[e.risk.level]} label={EVENT_LEVEL_LABEL[e.risk.level]} />
                {e.risk.basis}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-white/60">근거 관측값</p>
            {e.observation.length ? <Measures rows={e.observation} /> : <p className="text-xs text-white/35">관측값이 없는 이벤트입니다(발표 기반).</p>}
          </div>
          {e.prediction && (
            <div>
              <p className="mb-1 text-xs font-bold text-white/60">
                AI 예측값 · {e.prediction.horizon}
                {e.prediction.model && <span className="ml-2 font-normal text-white/35">{e.prediction.model}</span>}
              </p>
              <Measures rows={e.prediction.values} />
            </div>
          )}
          {e.alert && (
            <div>
              <p className="mb-1 text-xs font-bold text-white/60">경보 결과</p>
              <p className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                <RiskBadge level={e.alert.status === "발령" ? "warning" : "safe"} label={e.alert.status} />
                {e.alert.title}
                <span className="text-xs text-white/35">{[e.alert.channel, e.alert.issuedAt && at(e.alert.issuedAt)].filter(Boolean).join(" · ")}</span>
              </p>
            </div>
          )}
          <p className="text-[11px] text-white/35">
            출처 {e.source.system} · {e.source.origin}
            {e.source.sample && " (샘플 값)"}
          </p>
        </>
      )}
    </div>
  )
}
