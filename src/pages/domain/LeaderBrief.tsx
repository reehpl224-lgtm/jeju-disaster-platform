import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Risk } from "../../components/board/BoardParts"
import { Box, DETAIL_WINDOW, Group, Kv, Rows, St } from "../../components/board/PanelParts"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import type { LeaderBrief } from "./leaderBriefs"

const FLOW_MARK = { done: "✓", current: "●", todo: "○", skip: "–" } as const

/** 감지→확인→판단→경보→대응→종료 진행 띠 — 3대 실증서비스 전용 */
function FlowStrip({ flow }: { flow: NonNullable<LeaderBrief["flow"]> }) {
  return (
    <div>
      <ol className="flow" aria-label="업무 흐름 진행">
        {flow.steps.map((s) => (
          <li key={s.step} className={`flow__step flow__step--${s.state}`} aria-current={s.state === "current" ? "step" : undefined}>
            <span aria-hidden>{FLOW_MARK[s.state]}</span> {s.step}
            {s.note && <small>{s.note}</small>}
          </li>
        ))}
      </ol>
      {!flow.active && <p className="flow__idle">평시 — 진행 중인 사건이 없어 시작된 단계가 없습니다.</p>}
    </div>
  )
}

/**
 * 팀장 브리핑 렌더러 두 개 — 데이터는 leaderBriefs.ts 한 곳. 보드 패널(demo10 스타일)과 상세 대시보드(Tailwind 카드)가
 * 같은 순서·같은 제목으로 보여줘서 두 화면의 내용이 어긋나지 않는다.
 * 순서: ① 지금 상황 → ② 팀장 결재·지시 → ③ 판단 근거 → ④ 예상 → ⑤ 대응 현황
 */

/** 보드 좌측 "대시보드" 탭 — children은 서비스별 참고 자료(관측소·쉼터·CCTV 등) */
export function LeaderBoardBrief({ brief: b, children }: { brief: LeaderBrief; children?: ReactNode }) {
  return (
    <>
      <Box title={b.title} lines={b.lines} right={<Risk level={b.level} label={b.badge} />} />
      {b.flow && <FlowStrip flow={b.flow} />}
      <Kv items={b.kpis} over={b.kpis.filter((k) => k.over).map((k) => k.k)} />
      <Group title={`팀장 결재·지시${b.tasks.length > 0 ? ` (${b.tasks.length})` : ""}`} dummy>
        {b.tasks.length === 0 ? (
          <p className="pbox">{b.idle}</p>
        ) : (
          <ul className="plist">
            {b.tasks.map((t) => (
              <li key={`${t.role}-${t.title}`}>
                <div className="row-between">
                  <span className="t">
                    <Risk level="offline" label={t.role} /> {t.title}
                  </span>
                  <St text={t.status} lv={t.level} />
                </div>
                {t.detail && <p className="s">{t.detail}</p>}
                <Link className="plink" to={t.to} target={DETAIL_WINDOW}>
                  {t.role} 화면 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Group>
      <Group title="판단 근거" dummy>
        <Rows pairs={b.evidence.map((e) => [e.k, e.v] as [string, ReactNode])} />
      </Group>
      <Group title="앞으로의 전개" dummy>
        {b.outlook.map((o) => (
          <p className="pbox" key={o} style={{ marginBottom: 6 }}>
            {o}
          </p>
        ))}
      </Group>
      <Group title="대응 현황" dummy>
        <Rows pairs={b.response.map((r) => [r.k, r.v] as [string, ReactNode])} />
      </Group>
      {children}
    </>
  )
}

/** 상세 대시보드(홈) 최상단 카드 */
export function LeaderDetailBrief({ brief: b }: { brief: LeaderBrief }) {
  return (
    <Card title="팀장 브리핑" subtitle="지금 상황 · 결재·지시 · 판단 근거 · 전개 · 대응 현황 — 재난안전과 팀장 기준" dummy>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-white">{b.title}</p>
          {b.lines.map((l) => (
            <p key={l} className="mt-0.5 text-xs text-white/50">
              {l}
            </p>
          ))}
        </div>
        <RiskBadge level={b.level} label={b.badge} />
      </div>

      {b.flow && (
        <div className="mt-4">
          <FlowStrip flow={b.flow} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {b.kpis.map((k) => (
          <div key={k.k} className="rounded-lg border border-border-subtle p-3">
            <p className="text-[11px] font-medium text-white/40">{k.k}</p>
            <p className={`mt-1 text-lg font-bold ${k.over ? "text-risk-warning" : "text-white"}`}>{k.v}</p>
            {k.d && <p className="mt-0.5 text-[11px] text-white/35">{k.d}</p>}
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold text-white">팀장 결재·지시{b.tasks.length > 0 && ` (${b.tasks.length})`}</h3>
      {b.tasks.length === 0 ? (
        <p className="rounded-lg border border-border-subtle p-3 text-xs text-white/50">{b.idle}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
          {b.tasks.map((t) => (
            <li key={`${t.role}-${t.title}`} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-white/85">
                  <span className="mr-2 rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white/60">{t.role}</span>
                  {t.title}
                </p>
                {t.detail && <p className="mt-0.5 text-xs text-white/40">{t.detail}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <RiskBadge level={t.level} label={t.status} />
                <Link to={t.to} className="text-xs font-bold text-accent hover:underline">
                  {t.role} 화면 →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BriefBlock title="판단 근거" rows={b.evidence} />
        <div>
          <h3 className="mb-2 text-sm font-bold text-white">앞으로의 전개</h3>
          <div className="flex flex-col gap-2">
            {b.outlook.map((o) => (
              <p key={o} className="rounded-lg border border-border-subtle p-2.5 text-xs text-white/60">
                {o}
              </p>
            ))}
          </div>
        </div>
        <BriefBlock title="대응 현황" rows={b.response} />
      </div>
    </Card>
  )
}

function BriefBlock({ title, rows }: { title: string; rows: { k: string; v: string }[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
      <dl className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
        {rows.map((r) => (
          <div key={r.k} className="p-2.5 text-xs">
            <dt className="text-white/40">{r.k}</dt>
            <dd className="mt-0.5 text-white/75">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
