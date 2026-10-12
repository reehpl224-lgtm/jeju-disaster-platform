import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from "react"
import { IS_STAGING } from "../../data/appMode"

/**
 * AI 챗봇 창 — 지도 화면 오른쪽 아래 버튼을 누르면 화면 위에 따로 떠오르는 팝업창(메시지 목록 + 입력창).
 * 제목줄을 잡고 끌면 화면 안에서 옮길 수 있고, 닫았다 다시 열면 마지막 위치에서 열린다.
 * AI 연동 전이라 답변은 만들지 않는다: 프로토타입·로컬은 "연동 전" 안내를, 스테이징은 "샘플 응답"(내용 없는 임의 문장)을 돌려준다.
 */
interface Msg {
  id: number
  from: "bot" | "me"
  text: string
  /** 스테이징이 일부러 보여주는 샘플 응답 */
  sample?: boolean
}

const SUGGESTIONS = ["지금 발효 중인 특보 알려줘", "제주 호우 상황 요약해줘", "무더위쉼터는 어디에 있어?"]
const GREETING = "안녕하세요, 제주 재난 대응 AI 챗봇입니다. 특보·관측·대응 현황에 대해 물어보세요."

const WIDTH = 380
const MARGIN = 12
/** 마지막으로 놓은 위치 — 닫았다 다시 열어도 유지(새로고침하면 처음 자리) */
let lastPos: { x: number; y: number } | null = null
const heightOf = () => Math.min(560, window.innerHeight - 96)
const clamp = (x: number, y: number, w: number, h: number) => ({
  x: Math.min(Math.max(MARGIN, x), Math.max(MARGIN, window.innerWidth - w - MARGIN)),
  y: Math.min(Math.max(MARGIN, y), Math.max(MARGIN, window.innerHeight - h - MARGIN)),
})

function reply(q: string): Pick<Msg, "text" | "sample"> {
  if (IS_STAGING) return { text: `"${q}"에 대한 샘플 응답입니다. AI 연동 후에는 기상청 특보·관측값·대응 현황을 근거로 요약해 드립니다.`, sample: true }
  return { text: "AI 챗봇이 아직 연동되지 않아 답변을 만들 수 없습니다. 연동되면 기상청 특보·관측값·대응 현황을 근거로 답해 드립니다." }
}

export function ChatbotWindow({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: GREETING }])
  const [text, setText] = useState("")
  const [typing, setTyping] = useState(false)
  const next = useRef(1)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const titleId = useId()
  const boxRef = useRef<HTMLElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  // 처음에는 오른쪽 아래(챗봇 버튼 위)에 열린다
  const [size, setSize] = useState(() => ({ w: Math.min(WIDTH, window.innerWidth - MARGIN * 2), h: heightOf() }))
  const [pos, setPos] = useState(() => lastPos ?? clamp(window.innerWidth - size.w - 24, window.innerHeight - size.h - 88, size.w, size.h))

  useEffect(() => {
    inputRef.current?.focus()
    return () => window.clearTimeout(timer.current)
  }, [])
  // 브라우저 창 크기가 바뀌면 화면 밖으로 나가지 않게 다시 맞춘다
  useEffect(() => {
    const onResize = () => {
      const next = { w: Math.min(WIDTH, window.innerWidth - MARGIN * 2), h: heightOf() }
      setSize(next)
      setPos((p) => clamp(p.x, p.y, next.w, next.h))
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  function onDragStart(e: PointerEvent<HTMLElement>) {
    // 닫기 버튼 같은 눌러야 하는 요소에서는 끌기를 시작하지 않는다
    if ((e.target as HTMLElement).closest("button") || e.button !== 0) return
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  function onDragMove(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return
    const next = clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy, size.w, size.h)
    lastPos = next
    setPos(next)
  }
  function onDragEnd(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  /** 제목줄에서 화살표 키로도 옮길 수 있다 */
  function onHeadKeyDown(e: KeyboardEvent<HTMLElement>) {
    const step = e.shiftKey ? 48 : 16
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = move[e.key]
    if (!m) return
    e.preventDefault()
    const next = clamp(pos.x + m[0], pos.y + m[1], size.w, size.h)
    lastPos = next
    setPos(next)
  }
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [msgs, typing])

  function send(raw: string) {
    const q = raw.trim()
    if (!q || typing) return
    setMsgs((m) => [...m, { id: next.current++, from: "me", text: q }])
    setText("")
    setTyping(true)
    timer.current = window.setTimeout(() => {
      setMsgs((m) => [...m, { id: next.current++, from: "bot", ...reply(q) }])
      setTyping(false)
    }, 700)
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(text)
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") onClose()
    // 한글 조합 중 Enter는 글자 확정이라 보내지 않는다
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(text)
    }
  }

  return (
    <section ref={boxRef} className="chat" role="dialog" aria-labelledby={titleId} style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}>
      <header
        className={`chat__head${dragging ? " is-dragging" : ""}`}
        tabIndex={0}
        title="끌어서 옮기기"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onKeyDown={onHeadKeyDown}
      >
        <span className="chat__avatar" aria-hidden>
          AI
        </span>
        <div className="chat__title">
          <b id={titleId}>AI 챗봇</b>
          <small>{IS_STAGING ? "샘플 응답 · AI 연동 전" : "AI 연동 전"}</small>
        </div>
        <button type="button" className="chat__close" aria-label="챗봇 닫기" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="chat__body" ref={bodyRef} aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`chat__row chat__row--${m.from}`}>
            {m.from === "bot" && (
              <span className="chat__avatar chat__avatar--sm" aria-hidden>
                AI
              </span>
            )}
            <div className="chat__bubble">
              {m.text}
              {m.sample && <span className="sp-sample chat__tag">샘플</span>}
            </div>
          </div>
        ))}
        {typing && (
          <div className="chat__row chat__row--bot">
            <span className="chat__avatar chat__avatar--sm" aria-hidden>
              AI
            </span>
            <div className="chat__bubble chat__typing" aria-label="답변 작성 중">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        {msgs.length === 1 && (
          <div className="chat__chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chat__chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <form className="chat__form" onSubmit={onSubmit}>
        <textarea ref={inputRef} rows={1} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="메시지를 입력하세요" aria-label="메시지 입력" />
        <button type="submit" className="chat__send" aria-label="보내기" disabled={!text.trim() || typing}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
      <p className="chat__foot">AI 답변은 참고용입니다 — 경보 발령 등 최종 판단은 담당자가 합니다.</p>
    </section>
  )
}
