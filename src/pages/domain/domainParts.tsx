import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Risk } from "../../components/board/BoardParts"
import { LIVE } from "../../components/ui/dataSource"
import { SourceTag } from "../../components/ui/SourceTag"
import { Box, Checks, Group, Kv, Note, Rows, St } from "../../components/board/PanelParts"
import { cctvStatusLabel, openCctvPlayer, useCctvCameras } from "../../data/cctvLive"
import { useKhoaLive } from "../../data/khoaLive"
import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import { sampleBuoys } from "../../data/placeholderSamples"
import type { ServiceDataSources } from "../../data/mockDataSourceCategories"
import type { PlanItem } from "../../data/mockMeetingItems"
import type { CctvCamera, RiskLevel } from "../../types/domain"

/** 도메인 보드 탭들이 같이 쓰는 패널 조각 — 컴포넌트만 모아 둔 파일(domainConfigs.tsx는 설정 데이터만 남긴다) */

const SOURCE_GROUPS: { key: "available" | "legacy" | "requestable" | "missing"; title: string; lv: RiskLevel }[] = [
  { key: "available", title: "① 현재 사용 가능", lv: "safe" },
  { key: "legacy", title: "② 제주 레거시(미적용)", lv: "caution" },
  { key: "requestable", title: "③ 요청 가능(실증서비스)", lv: "info" },
  { key: "missing", title: "④ 현재 없는 데이터", lv: "offline" },
]

/** "데이터 수집" 탭 — 상세 화면(xxxDataPage)의 데이터 출처 4단계 구분을 보드 패널 형식으로 요약 */
export function DataSources({ s }: { s: ServiceDataSources }) {
  return (
    <>
      <Kv items={SOURCE_GROUPS.map((g) => ({ k: g.title.slice(2), v: `${s[g.key].length}건` }))} />
      {SOURCE_GROUPS.map((g) => (
        <Group key={g.key} title={g.title}>
          <ul className="plist">
            {s[g.key].map((item) => (
              <li key={item.id}>
                <div className="row-between">
                  <span className="t">{item.label}</span>
                  <Risk level={g.lv} label={g.title.slice(0, 1)} />
                </div>
                {item.note && <p className="s">{item.note}</p>}
              </li>
            ))}
          </ul>
        </Group>
      ))}
    </>
  )
}

/** 착수보고회 회의록 기반 계획·검토 항목(PlanItemsCard와 같은 데이터) — 실측값이 아니라 진행 상태만 */
export function Plans({ items }: { items: PlanItem[] }) {
  return (
    <ul className="plist">
      {items.map((p) => (
        <li key={p.id}>
          <div className="row-between">
            <span className="t">{p.title}</span>
            <St text={p.status} lv={p.level} />
          </div>
          <p className="s">{p.detail}</p>
        </li>
      ))}
    </ul>
  )
}

/** 위험단계 기준표(TP-P22_002) — 상세 화면의 상태 구간 표와 같은 데이터 */
export function StageCriteria({ rows }: { rows: { level: RiskLevel; label: string; cells: string[] }[] }) {
  return (
    <ul className="plist">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="row-between">
            <Risk level={r.level} label={r.label} />
          </div>
          <p className="s">{r.cells.join(" · ")}</p>
        </li>
      ))}
    </ul>
  )
}

// ------------------------------------------------------------------ 공통 조각
export interface DispatchLike {
  stage: string
  title: string
  target: string
  targetDetail: string
  sentAt: string
  approver: string
  message: string
  rivers?: string
  district?: string
  channels: { name: string; sent: number; success: number; fail: number; rate: string; lastSent: string; unit?: string }[]
  totalFail: number
}

export function Dispatch({ d }: { d: DispatchLike }) {
  const extra: [string, ReactNode][] = []
  if (d.rivers) extra.push(["대상 하천", d.rivers])
  if (d.district) extra.push(["대상 지역", d.district])
  return (
    <>
      <Box title={d.title} lines={[d.message]} />
      <Group title="발송 정보" dummy>
        <Rows
          pairs={[
            ["단계", <St key="s" text={d.stage} lv="alert" />],
            ["대상", <span key="t">{d.target}<br /><span className="s">{d.targetDetail}</span></span>],
            ["발송 시각", d.sentAt],
            ["승인자", d.approver],
            ...extra,
          ]}
        />
      </Group>
      <Group title="채널별 발송 결과" dummy>
        <ul className="plist">
          {d.channels.map((c) => (
            <li key={c.name}>
              <div className="row-between">
                <span className="t">{c.name}</span>
                <span className="t">{c.rate}</span>
              </div>
              <p className="s">
                발송 {c.sent.toLocaleString()}
                {c.unit ?? "건"} · 성공 {c.success.toLocaleString()} ·{" "}
                <span style={{ color: `var(--risk-${c.fail ? "danger" : "safe"})` }}>실패 {c.fail.toLocaleString()}</span> · 최종 {c.lastSent}
              </p>
            </li>
          ))}
        </ul>
      </Group>
      <Note tone="warning">실패 합계 {d.totalFail.toLocaleString()}건 — 재발송 검토</Note>
    </>
  )
}

export interface ClosureLike {
  caseId: string
  title: string
  status: string
  confirmedBy: string
  type: string
  location?: string
  duration: string
  durationDetail: string
  agencies: string
  agencyDetail: string
  aiSummary?: { label: string; value: string }[]
  observed: { label: string; value: string }[]
  closureConditions: string[]
  report: { department: string; sop: string; casualties: string; property: string; lesson: string }
}

export function Closure({ c }: { c: ClosureLike }) {
  const info: [string, ReactNode][] = [["유형", c.type]]
  if (c.location) info.push(["위치", c.location])
  info.push(
    ["소요 시간", <span key="d">{c.duration}<br /><span className="s">{c.durationDetail}</span></span>],
    ["대응 기관", <span key="a">{c.agencies}<br /><span className="s">{c.agencyDetail}</span></span>],
  )
  return (
    <>
      <Box title={`${c.caseId} · ${c.title}`} lines={[c.confirmedBy]} right={<St text={c.status} lv="safe" />} />
      <Group title="사건 개요" dummy>
        <Rows pairs={info} />
      </Group>
      {c.aiSummary && (
        <Group title="AI 분석 요약" dummy>
          <Rows pairs={c.aiSummary.map((a) => [a.label, a.value] as [string, ReactNode])} />
        </Group>
      )}
      <Group title="관측 결과" dummy>
        <Rows pairs={c.observed.map((o) => [o.label, o.value] as [string, ReactNode])} />
      </Group>
      <Group title="종료 조건" dummy>
        <Checks items={c.closureConditions} />
      </Group>
      <Group title="보고서" dummy>
        <Rows
          pairs={[
            ["작성 부서", c.report.department],
            ["적용 SOP", c.report.sop],
            ["인명 피해", c.report.casualties],
            ["재산 피해", c.report.property],
            ["개선 사항", c.report.lesson],
          ]}
        />
      </Group>
    </>
  )
}

export function RelatedCams({ domain }: { domain: CctvCamera["domain"] }) {
  const items = useCctvCameras().filter((c) => c.domain === domain)
  if (items.length === 0) return null
  return (
    <Group title={`관련 CCTV (${items.length})`} dummy>
      <ul className="plist">
        {items.map((c) => (
          <li className="row-between" key={c.id}>
            <div>
              <p className="t">{c.name}</p>
              <p className="s">
                {c.operator}
                {c.lastFrameAt && ` · 최종 ${c.lastFrameAt.slice(11, 16)}`}
              </p>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {c.streamUrl && (
                <button type="button" className="plink" onClick={() => openCctvPlayer(c)} style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}>
                  ▶ 영상
                </button>
              )}
              <Risk level={c.status === "online" ? "info" : "offline"} label={cctvStatusLabel(c)} />
            </span>
          </li>
        ))}
      </ul>
      <Link className="plist plink" to="/dashboard?tab=cctv" style={{ display: "block" }}>
        CCTV 화면에서 보기 →
      </Link>
    </Group>
  )
}

/** 원본 데이터가 비어 임의 샘플을 보여줄 때 목록 위에 붙이는 안내 — 실데이터가 들어오면 같이 사라진다 */
export function SampleNote() {
  return <p className="pnote">* 샘플 데이터 — 실데이터 연동 전 임의 값</p>
}

export function Buoys() {
  useKhoaLive()
  const sample = khoaBuoyMarineConditions.length === 0
  return (
    <>
      {sample && <SampleNote />}
      <BuoyRows rows={sample ? sampleBuoys : khoaBuoyMarineConditions} />
    </>
  )
}

function BuoyRows({ rows }: { rows: typeof khoaBuoyMarineConditions }) {
  return (
    <ul className="plist">
      {rows.map((b) => (
        <li key={b.id}>
          <div className="row-between">
            <span className="t">
              {b.stationName} <span className="s">({b.stationCode})</span>
            </span>
            <span className="s" style={{ margin: 0 }}>
              {b.observedAt.slice(11)}
            </span>
          </div>
          <p className="s">
            파고 {b.waveHeightM}m · 주기 {b.wavePeriodSec}s · 풍속 {b.windSpeedMs}m/s · 기압 {b.pressureHpa}hPa
          </p>
        </li>
      ))}
    </ul>
  )
}

/** 우측 타임라인 한 줄 (클론 .event) */
export function Events({ items }: { items: { icon: string; time: string; lines: string[]; badge?: ReactNode; level?: RiskLevel }[] }) {
  return (
    <ul className="plist">
      {items.length === 0 && <li className="pempty">데이터가 없습니다.</li>}
      {items.map((e, i) => (
        <li key={i}>
          <div className="row-between">
            <span className="time" style={e.level ? { color: `var(--risk-${e.level})` } : undefined}>
              {e.icon} {e.time}
            </span>
            {e.badge}
          </div>
          {e.lines.map((l, j) => (
            <p key={j} className={j === 0 ? "t" : "s"} style={{ marginTop: j === 0 ? 4 : 2 }}>
              {l}
            </p>
          ))}
        </li>
      ))}
    </ul>
  )
}

export function Live({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
}
export function LiveBlock({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="pnote">
        {title}
        <SourceTag source={LIVE} />
      </p>
      <p className="s" style={{ fontSize: 11, color: "var(--foreground-subtle)", marginBottom: 6 }}>
        {note}
      </p>
      {children}
    </div>
  )
}
