import { Card } from "../components/ui/Card"
import { legacySystems } from "../data/mockHeavyRain"
import { HubLinkPage } from "./HubLinkPage"

/** 샘플 — sLLM 상황요약(연계 전 임시 문장) */
const SAMPLE_SLLM = [
  "호우주의보가 발효 중이며 서귀포 산지에 시우량 20mm 안팎의 강우가 이어지고 있습니다.",
  "효돈천 관측점의 유량이 계획홍수량의 61%로 '경계' 등급입니다. 1시간 안에 70%에 이를 것으로 예측됩니다.",
  "연안은 파고 1.8m로 월파 감시 CCTV 3곳에서 해안 접근 주의가 필요합니다.",
]

/** 헤더 GNB "AX HUB" 버튼 → 새 창. sLLM 요약과 레거시 데이터 대시보드를 한 화면에 보여준다 */
export function AxHubPage() {
  const linked = legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
  const talking = legacySystems.filter((s) => s.linkStatus === "협의 중").length
  const none = legacySystems.length - linked - talking
  return (
    <HubLinkPage title="AX HUB" lead="AX Hub의 sLLM 요약과 레거시 데이터 대시보드를 상황판에서 확인합니다.">
      <Card title="sLLM 상황 요약" subtitle="AX Hub sLLM이 만든 요약 — 샘플 문장">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-white/80">
          {SAMPLE_SLLM.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
      <Card title="레거시 데이터 대시보드" subtitle={`풍수해 등 레거시 시스템 ${legacySystems.length}종의 연계 상태(현황조사 기준)`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["연계 진행중", linked], ["협의 중", talking], ["미연계", none]].map(([label, n]) => (
            <div key={label} className="rounded-lg border border-white/15 p-3">
              <p className="text-xs text-white/50">{label}</p>
              <p className="text-2xl font-bold text-white">{n}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">시스템별 상세 현황은 데이터 시스템 연계현황(/data-systems)에서 확인합니다.</p>
      </Card>
    </HubLinkPage>
  )
}
