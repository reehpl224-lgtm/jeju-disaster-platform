import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { cctvStreamSrc, openCctvPlayer } from "../../data/cctvLive"
import type { CctvCamera, RiskLevel } from "../../types/domain"
import { SpRisk } from "./primitives"

/** 관측·CCTV 목록의 한 줄 — 관측 지점이면 cam이 없고, CCTV이면 카메라가 붙는다 */
export interface ObsItem {
  key: string
  level: RiskLevel
  tag: string
  name: string
  sub: string
  value: string
  cam?: CctvCamera
}

const chip = (on: boolean) => ({
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 10px",
  borderRadius: 999,
  cursor: "pointer",
  border: `1px solid ${on ? "var(--primary)" : "var(--border-subtle)"}`,
  background: on ? "var(--primary)" : "transparent",
  color: on ? "#000" : "var(--foreground-subtle)",
})

/**
 * '더보기' 팝업 — 한 항목(하천·연안 …)의 관측 지점과 CCTV를 모두 보여 준다.
 * 관측 지점과 CCTV가 한 목록에 섞여 있어, 상세를 CCTV 화면으로 보내지 않고 이 자리에서 구분(전체·관측 지점·CCTV)해 본다.
 * 영상이 있는 CCTV는 '영상 보기'로 재생 창을 열고, CCTV가 있는 항목은 아래에 CCTV 통합 조회 링크를 둔다.
 */
export function ObsMoreDialog({ title, items, cctvTo, onClose }: { title: string; items: ObsItem[]; cctvTo?: string; onClose: () => void }) {
  const [kind, setKind] = useState<"all" | "obs" | "cctv">("all")
  const closeRef = useRef<HTMLButtonElement>(null)
  const hasObs = items.some((i) => !i.cam)
  const hasCam = items.some((i) => i.cam)
  const shown = items.filter((i) => kind === "all" || (kind === "cctv" ? !!i.cam : !i.cam))

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} 목록`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(460px, 100%)", maxHeight: "80vh", display: "flex", flexDirection: "column", gap: 10, background: "var(--background-dark, #26282a)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 16, color: "#fff" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <b style={{ fontSize: 15 }}>
            {title} <span style={{ fontWeight: 400, color: "var(--foreground-subtle)" }}>· {shown.length}건</span>
          </b>
          <span style={{ flex: 1 }} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="닫기" style={{ background: "none", border: 0, color: "inherit", fontSize: 18, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        {hasObs && hasCam && (
          <div style={{ display: "flex", gap: 6 }} role="group" aria-label="구분">
            {(
              [
                ["all", "전체"],
                ["obs", "관측 지점"],
                ["cctv", "CCTV"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} style={chip(kind === k)}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 2 }}>
          {shown.map((it) => (
            <div key={it.key} className="sp-card" style={{ background: "var(--background-darker)", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SpRisk level={it.level}>{it.tag}</SpRisk>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 13 }}>{it.name}</b>
                <span className="sp-sub">{it.sub}</span>
              </div>
              {it.cam && cctvStreamSrc(it.cam) ? (
                <button
                  type="button"
                  onClick={() => {
                    openCctvPlayer(it.cam as CctvCamera)
                    onClose()
                  }}
                  style={{ flex: "none", fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "none", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
                >
                  영상 보기
                </button>
              ) : (
                <b style={{ fontSize: 12, flex: "none" }}>{it.value}</b>
              )}
            </div>
          ))}
          {shown.length === 0 && <p className="sp-note">표시할 항목이 없습니다.</p>}
        </div>
        {cctvTo && (
          <Link to={cctvTo} onClick={onClose} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
            CCTV 통합 조회에서 보기 →
          </Link>
        )}
      </div>
    </div>,
    document.body,
  )
}
