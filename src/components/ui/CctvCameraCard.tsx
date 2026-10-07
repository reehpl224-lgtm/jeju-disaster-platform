import type { CctvCamera } from "../../types/domain"
import { cctvStatusLabel } from "../../data/cctvLive"
import { RiskBadge } from "./RiskBadge"

const DOMAIN_LABEL: Record<CctvCamera["domain"], string> = {
  aqua: "해안관측",
  coast: "연안",
  river: "하천",
  snow: "대설",
  general: "일반",
}

function formatHM(iso: string) {
  return iso.slice(11, 16)
}

export function CctvCameraCard({ camera }: { camera: CctvCamera }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-inset p-3">
      <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-border-subtle bg-panel text-[11px] text-white/30">
        실시간 영상 연동 예정
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white/85">{camera.name}</p>
          <p className="mt-0.5 text-[11px] text-white/35">{camera.address}</p>
        </div>
        <RiskBadge level={camera.status === "online" ? "info" : "offline"} label={cctvStatusLabel(camera)} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/35">
        <span className="rounded-full border border-border-subtle px-2 py-0.5">
          {DOMAIN_LABEL[camera.domain]} · {camera.operator}
        </span>
        {camera.lastFrameAt && <span>최종 수신 {formatHM(camera.lastFrameAt)}</span>}
      </div>
    </div>
  )
}
