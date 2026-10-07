import { useEffect, useRef, useState } from "react"
import { cctvStatusLabel, cctvStreamSrc, closeCctvPlayer, usePlayingCctv } from "../../data/cctvLive"
import type { CctvCamera } from "../../types/domain"

/** CCTV 영상 재생 창 — openCctvPlayer(camera)로 열린다. 앱에 하나만 둔다. */
export function CctvPlayerHost() {
  const camera = usePlayingCctv()
  // key를 카메라별로 줘서 다른 카메라로 바꾸면 재생기를 새로 만든다
  return camera ? <CctvPlayerDialog key={camera.id} camera={camera} /> : null
}

function CctvPlayerDialog({ camera }: { camera: CctvCamera }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const src = cctvStreamSrc(camera)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCctvPlayer()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    let cancelled = false
    let destroy = () => {}
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari는 HLS를 직접 재생한다
      video.src = src
      void video.play().catch(() => {})
      destroy = () => video.removeAttribute("src")
    } else {
      // 나머지 브라우저는 hls.js로 재생 — 처음 재생할 때만 내려받는다
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) {
          setError("이 브라우저는 영상 재생(HLS)을 지원하지 않습니다.")
          return
        }
        const hls = new Hls({ maxBufferLength: 20 })
        hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => {}))
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError(`영상을 불러오지 못했습니다 (${data.details})`)
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        destroy = () => hls.destroy()
      })
    }
    return () => {
      cancelled = true
      destroy()
    }
  }, [src])

  const message = !src ? "이 카메라에는 영상 주소가 없습니다." : error

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && closeCctvPlayer()}
    >
      <div role="dialog" aria-modal="true" aria-label={`${camera.name} 영상`} className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border-subtle bg-panel p-4 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-white">{camera.name}</p>
            <p className="mt-0.5 text-xs text-white/50">
              {camera.address} · {cctvStatusLabel(camera)}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={closeCctvPlayer} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:border-accent hover:text-accent">
            닫기 (Esc)
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} className="h-full w-full" muted playsInline autoPlay controls onPlaying={() => setPlaying(true)} onWaiting={() => setPlaying(false)} />
          {!playing && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-white/60">
              {message ?? "영상을 불러오는 중입니다…"}
            </p>
          )}
        </div>
        <p className="text-[11px] text-white/35">제주시 CCTV 영상 서버(HTTP)를 프록시로 중계합니다 — 지연이 몇 초 있을 수 있습니다.</p>
      </div>
    </div>
  )
}
