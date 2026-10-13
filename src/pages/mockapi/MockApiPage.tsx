import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { audit } from "../../data/auditLog"
import { validateCommonEvent } from "../../data/commonEvent"

const base = import.meta.env.BASE_URL
const clock = () => Date.now()
const ENDPOINTS: { path: string; name: string; desc: string; validate?: boolean }[] = [
  { path: "mock-api/v1/events.json", name: "공통 이벤트 목록", desc: "실증사 샘플 배치를 공통 이벤트 구조로 바꾼 값(읽기 전용) — 호출하면 구조 검사까지 합니다.", validate: true },
  { path: "mock-api/v1/schema/common-event.schema.json", name: "공통 이벤트 스키마", desc: "실증사가 맞춰 보낼 구조(JSON Schema)입니다." },
  { path: "data/pilot-batch.json", name: "실증사 샘플 배치(원본)", desc: "하천·연안·저염분 샘플 원본 — 실증사 데이터가 붙으면 같은 모양으로 교체합니다." },
]
const btn = "h-8 rounded-md border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"

interface CallResult {
  status: number
  ms: number
  bytes: number
  preview: string
  /** 구조 검사 — 이벤트 목록일 때만 */
  checked?: { total: number; errors: string[] }
  error?: string
}

/** 응답 본문에서 이벤트 배열을 꺼낸다 — 이벤트 한 건, 배열, 또는 { events: [...] } */
function eventsOf(body: unknown): unknown[] {
  if (Array.isArray(body)) return body
  if (body && typeof body === "object" && Array.isArray((body as { events?: unknown }).events)) return (body as { events: unknown[] }).events
  return [body]
}
const check = (body: unknown) => {
  const list = eventsOf(body)
  return { total: list.length, errors: list.flatMap((e, i) => validateCommonEvent(e).map((m) => `[${i}] ${(e as { id?: string })?.id ?? "(id 없음)"} — ${m}`)) }
}

/**
 * 운영 > Mock API — 요구사항 '프로토타입 연계 환경': 실데이터 연계가 어려운 동안 스키마를 반영한 더미 데이터를 읽기 전용 경로로 제공하고,
 * 실증사가 보내 줄 샘플 payload가 공통 이벤트 구조에 맞는지 검증한다. 파일은 정적 호스팅(쓰기·인증 없음)이다.
 */
export function MockApiPage() {
  const [results, setResults] = useState<Record<string, CallResult>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [verdict, setVerdict] = useState<{ total: number; errors: string[]; parseError?: string } | null>(null)

  async function call(path: string, validate?: boolean) {
    setBusy(path)
    const t0 = clock()
    try {
      const res = await fetch(`${base}${path}`, { cache: "no-store" })
      const raw = await res.text()
      let checked: CallResult["checked"]
      if (validate && res.ok) {
        try {
          checked = check(JSON.parse(raw))
        } catch {
          checked = { total: 0, errors: ["응답이 JSON이 아닙니다"] }
        }
      }
      setResults((r) => ({ ...r, [path]: { status: res.status, ms: Math.round(clock() - t0), bytes: new Blob([raw]).size, preview: raw.slice(0, 1400), checked } }))
    } catch (e) {
      setResults((r) => ({ ...r, [path]: { status: 0, ms: Math.round(clock() - t0), bytes: 0, preview: "", error: e instanceof Error ? e.message : "호출 실패" } }))
    } finally {
      setBusy(null)
      audit("데이터 처리", "Mock API 호출", path)
    }
  }

  function verify() {
    try {
      setVerdict(check(JSON.parse(text)))
    } catch (e) {
      setVerdict({ total: 0, errors: [], parseError: e instanceof Error ? e.message : "JSON을 읽을 수 없습니다" })
    }
    audit("데이터 처리", "payload 구조 검증")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mock API</h1>
        <p className="mt-1 text-sm text-white/50">
          실증사 연계 자료가 오기 전까지 구조를 반영한 더미 데이터를 읽기 전용 경로로 제공하고, 받은 샘플이 공통 이벤트 구조에 맞는지 검증합니다.
        </p>
      </div>

      <Card title="읽기 전용 경로" subtitle="GET 호출만 가능하며 쓰기·인증은 없습니다">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {ENDPOINTS.map((ep) => {
            const r = results[ep.path]
            return (
              <li key={ep.path} className="flex flex-col gap-2 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-white/85">{ep.name}</b>
                  <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-accent">GET {base}{ep.path}</code>
                  <span className="ml-auto flex gap-2">
                    <a className={`${btn} inline-flex items-center`} href={`${base}${ep.path}`} target="_blank" rel="noopener noreferrer">
                      새 탭으로 열기
                    </a>
                    <button type="button" className={btn} disabled={busy === ep.path} onClick={() => void call(ep.path, ep.validate)}>
                      {busy === ep.path ? "호출 중…" : "호출"}
                    </button>
                  </span>
                </div>
                <p className="text-xs text-white/45">{ep.desc}</p>
                {r && (
                  <div className="rounded-lg border border-white/15 p-3">
                    <p className={`text-xs font-bold ${r.status >= 200 && r.status < 300 ? "text-accent" : "text-risk-danger"}`}>
                      {r.error ? `실패 — ${r.error}` : `HTTP ${r.status} · ${r.ms}ms · ${(r.bytes / 1024).toFixed(1)}KB`}
                    </p>
                    {r.checked && (
                      <p className={`mt-1 text-xs font-bold ${r.checked.errors.length === 0 ? "text-accent" : "text-risk-danger"}`}>
                        구조 검사 {r.checked.errors.length === 0 ? `통과 — ${r.checked.total}건 모두 공통 이벤트 구조에 맞음` : `이상 ${r.checked.errors.length}건`}
                      </p>
                    )}
                    {r.checked?.errors.map((m) => (
                      <p key={m} className="text-xs text-risk-danger">{m}</p>
                    ))}
                    {r.preview && <pre className="mt-2 max-h-56 overflow-auto rounded bg-black/30 p-2 text-[11px] leading-relaxed text-white/60">{r.preview}{r.bytes > 1400 ? "\n… (이하 생략)" : ""}</pre>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title="샘플 payload 구조 검증" subtitle="실증사가 보낸 JSON을 붙여 넣으면 공통 이벤트 구조에 맞는지 필드별로 알려 줍니다(이벤트 1건, 배열, 또는 { events: [...] })">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          aria-label="검증할 JSON"
          placeholder='{ "schema": "jeju-ax.common-event/1", "id": "...", ... }'
          className="w-full rounded-lg border border-border-subtle bg-inset p-3 font-mono text-xs text-white outline-none placeholder:text-white/25 focus:border-accent"
        />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" className={btn} disabled={!text.trim()} onClick={verify}>
            검증
          </button>
          {verdict?.parseError && <span className="text-xs font-bold text-risk-danger">JSON 오류 — {verdict.parseError}</span>}
          {verdict && !verdict.parseError && (
            <span className={`text-xs font-bold ${verdict.errors.length === 0 ? "text-accent" : "text-risk-danger"}`}>
              {verdict.errors.length === 0 ? `통과 — ${verdict.total}건 모두 구조에 맞음` : `이상 ${verdict.errors.length}건 (총 ${verdict.total}건)`}
            </span>
          )}
        </div>
        {verdict?.errors.map((m) => (
          <p key={m} className="mt-1 text-xs text-risk-danger">
            {m}
          </p>
        ))}
      </Card>
    </div>
  )
}
