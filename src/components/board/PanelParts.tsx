import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { RiskLevel } from "../../types/domain"
import { Risk } from "./BoardParts"

/** 패널 안에서 쓰는 작은 조각들 — demo-10 클론 gen_domains.py의 group/rows/kv/box/tl/checks/steps에 대응 */

// 앱 화면에 쓰인 상태 문구 → 배지 색. 목록에 없는 문구는 info(파랑)
const STATUS_LV: Record<string, RiskLevel> = {
  완료: "safe", 정상: "safe", 확인: "safe", 확인됨: "safe", 양호: "safe", "정상 작동": "safe",
  "출동 완료": "safe", "공조 수신 완료": "safe", "상황 공유 완료": "safe", 높음: "safe", normal: "safe",
  "현장 경보 완료": "safe",
  "진행 중": "info", "출동 중": "info", "현장 투입 중": "info", "출동 준비 중": "info", "연계 진행중": "info",
  "현장 접수": "info", "경보 실행 중": "info", "해경 공조 진행": "info",
  대기: "offline", "대기 중": "offline", 미연계: "offline",
  "승인 대기": "caution", "대기 요청 중": "caution", "협의 중": "caution", "검토 대기": "caution",
  미완료: "warning", 미확인: "warning", delayed: "warning", "부분 (1개 이상)": "warning",
  실패: "danger", 오류: "danger", "오류 발생": "danger", 이상: "danger", 미연결: "danger", missing: "danger",
}
export const SOURCE_LABEL: Record<string, string> = { normal: "정상", delayed: "지연", missing: "누락" }

/** 상태 문구 배지 */
export function St({ text, lv }: { text: string; lv?: RiskLevel }) {
  return <Risk level={lv ?? STATUS_LV[text] ?? "info"} label={text} />
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pgroup">
      <p className="pnote">{title}</p>
      {children}
    </div>
  )
}

export function Rows({ pairs }: { pairs: [string, ReactNode][] }) {
  return (
    <ul className="plist">
      {pairs.map(([k, v]) => (
        <li className="row-between" key={k}>
          <span className="s" style={{ margin: 0 }}>
            {k}
          </span>
          <span className="t" style={{ textAlign: "right" }}>
            {v}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Kv({ items, over = [] }: { items: { k: string; v: string | number; d?: string }[]; over?: string[] }) {
  return (
    <div className="kv-grid">
      {items.map((it) => (
        <div className="pbox" key={it.k}>
          <small>{it.k}</small>
          <b className={over.includes(it.k) ? "over" : undefined}>{it.v}</b>
          {it.d && (
            <p className="s" style={{ fontSize: 10 }}>
              {it.d}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function Box({ title, lines = [], right }: { title: string; lines?: string[]; right?: ReactNode }) {
  return (
    <div className="pbox">
      <div className="row-between">
        <span className="t">{title}</span>
        {right}
      </div>
      {lines.map((x, i) => (
        <p className="s" key={i}>
          {x}
        </p>
      ))}
    </div>
  )
}

export function Tl({ entries }: { entries: { time: string; title: string }[] }) {
  return (
    <ul className="plist">
      {entries.map((e, i) => (
        <li key={i}>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="time">{e.time}</span>
            <span>{e.title}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="plist">
      {items.map((x) => (
        <li key={x}>✓ {x}</li>
      ))}
    </ul>
  )
}

export function Steps({ items }: { items: { title: string; sub: string; on?: boolean }[] }) {
  return (
    <div className="steps">
      {items.map((s) => (
        <div className="step" key={s.title} style={s.on ? { borderColor: "var(--risk-danger)" } : undefined}>
          <b>{s.title}</b>
          <span>{s.sub}</span>
        </div>
      ))}
    </div>
  )
}

export function Note({ children, tone }: { children: ReactNode; tone?: "warning" | "caution" }) {
  const style = tone
    ? { background: `var(--risk-${tone}-bg)`, color: `var(--risk-${tone})`, borderColor: `var(--risk-${tone})` }
    : undefined
  return (
    <p className="pgoal" style={style}>
      {children}
    </p>
  )
}

/** 앱 하위 화면(기존 상세 페이지)으로 가는 링크 — 승인·발송 등 동작은 그 화면에서 한다 */
export function DetailLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="plink" to={to} style={{ display: "block", marginTop: 14 }}>
      {children} →
    </Link>
  )
}

/** 패널용 소형 꺾은선 차트 — 클론의 SVG 선 그래프에 대응(recharts) */
export function MiniChart({
  data,
  keys,
  colors,
  names,
  xkey,
  refLine,
}: {
  data: object[]
  keys: string[]
  colors: string[]
  names: string[]
  xkey: string
  refLine?: { y: number; label: string }
}) {
  return (
    <div style={{ height: 170, marginTop: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3b3c" />
          <XAxis dataKey={xkey} tick={{ fontSize: 10, fill: "#ffffff88" }} stroke="#3a3b3c" />
          <YAxis tick={{ fontSize: 10, fill: "#ffffff88" }} stroke="#3a3b3c" />
          <Tooltip contentStyle={{ background: "#272727", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10, color: "#ffffffaa" }} />
          {refLine && (
            <ReferenceLine
              y={refLine.y}
              stroke="#f2731a"
              strokeDasharray="4 4"
              label={{ value: refLine.label, fill: "#f2731a", fontSize: 10, position: "insideTopLeft" }}
            />
          )}
          {keys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} name={names[i]} stroke={colors[i]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
