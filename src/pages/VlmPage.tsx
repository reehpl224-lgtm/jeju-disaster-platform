import { Card } from "../components/ui/Card"
import { RiskBadge } from "../components/ui/RiskBadge"
import { SAMPLE_VLM_SUMMARY } from "../data/sidePanelSamples"
import { HubLinkPage } from "./HubLinkPage"

/** 헤더 GNB "VLM" 버튼 → 새 창. CCTV 영상을 VLM이 10분 단위로 요약한 결과를 보여준다 */
export function VlmPage() {
  return (
    <HubLinkPage title="VLM" lead="CCTV 영상을 VLM(영상 이해 AI)이 10분 단위로 요약한 결과를 확인합니다.">
      <Card title="VLM 10분 요약" subtitle="최근 분석 결과 — 샘플 값">
        <ul className="flex flex-col gap-2">
          {SAMPLE_VLM_SUMMARY.map((v) => (
            <li key={v.time + v.text} className="flex items-center gap-3 text-sm text-white/80">
              <span className="w-12 shrink-0 text-white/50">{v.time}</span>
              <RiskBadge level={v.level} label={v.badge} />
              <span>{v.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </HubLinkPage>
  )
}
