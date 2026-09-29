import { useEffect, useRef } from "react"
import { dutyContacts } from "../../data/mockContacts"

/**
 * 방재메신저·안전뉴스 — 1차년도 시연 범위 밖(2단계 구현 예정)이라 실제 기능이 없다.
 * 빈 "준비 중" 문구만 두면 팀장이 "그래서 지금은 어떻게 하나"를 알 수 없어서, 예정 기능과 지금 쓰는 대체 수단을
 * 함께 보여준다. 예정 기능의 근거는 「제주 재난안전과 팀장 사용자 시나리오」의 플랫폼 갭 표(방재메신저·안전뉴스),
 * 대체 수단은 담당자 연락처(mockContacts)다. 새 수치·기능을 지어내지 않는다.
 */
const PLANNED = {
  messenger: {
    title: "방재메신저",
    plan: "플랫폼 안에서 담당자에게 지시를 보내고 수신 확인까지 추적하는 통합 채널",
    now: "지금은 카카오톡 단톡방·유선으로 지시합니다 — 아래 담당자 연락처를 이용하세요.",
  },
  news: {
    title: "안전뉴스",
    plan: "외부 뉴스 API 연동 또는 자체 공지 연계로 대민 보도·대응 참고자료 제공",
    now: "지금은 제공하지 않습니다. 대응 참고는 기상청 실시간 특보·예보 패널을 이용하세요.",
  },
} as const

export type ComingSoonKind = keyof typeof PLANNED

export function ComingSoonPanel({ kind }: { kind: ComingSoonKind }) {
  const p = PLANNED[kind]
  return (
    <>
      <div className="pbox">
        <div className="row-between">
          <span className="t">{p.title}</span>
          <span className="risk risk--offline">2단계 구현 예정</span>
        </div>
        <p className="s">1차년도 시연 범위에 포함되지 않아 아직 동작하지 않습니다.</p>
      </div>
      <div className="pgroup">
        <p className="pnote">예정 기능</p>
        <p className="pbox">{p.plan}</p>
      </div>
      <div className="pgroup">
        <p className="pnote">지금은</p>
        <p className="pbox">{p.now}</p>
        {kind === "messenger" && (
          <ul className="plist">
            {dutyContacts.map((c) => (
              <li key={c.id}>
                <div className="row-between">
                  <span className="t">
                    {c.name} <span className="s">{c.role}</span>
                  </span>
                  <span className="t">{c.phone}</span>
                </div>
                <p className="s">{c.channel}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/** 도메인 보드의 방재메신저 버튼 — 눌렀을 때 아무 관련 없는 탭이 열리던 것을 안내 카드로 바꿨다 */
export function MessengerNotice({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label="방재메신저 안내"
      className="panel"
      style={{ position: "fixed", right: 16, bottom: 80, zIndex: 50, width: 340, maxHeight: "70vh", height: "auto", padding: 16, overflowY: "auto" }}
    >
      <div className="panel__head">
        <h2 className="panel__title">방재메신저</h2>
        <button type="button" aria-label="닫기" onClick={onClose} style={{ color: "var(--foreground-muted)" }}>
          ✕
        </button>
      </div>
      <ComingSoonPanel kind="messenger" />
    </div>
  )
}
