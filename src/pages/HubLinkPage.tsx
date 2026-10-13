import type { ReactNode } from "react"
import { Card } from "../components/ui/Card"
import { IS_STAGING } from "../data/appMode"

/**
 * 헤더 'AX HUB'·'VLM' 새 창 화면의 공통 틀 — 연계 방식·진행 상태를 보여주고, 표출 값이 있는 칸은 `children`으로 받는다.
 * 요구사항 'AX Hub 대시보드 연계 표출'·'AX Hub 연계'. 실제 연계 자료는 2026년 10월 중순 도착 예정이라
 * 스테이징은 샘플 값으로 칸을 채워 구성을 보여주고, 프로토타입은 값 없이 '연계 전'만 표시한다.
 */
const HUB_STEPS: { title: string; body: string; done: boolean }[] = [
  { title: "연계 방식", body: "API·이벤트 방식으로 sLLM·VLM 결과와 레거시 데이터를 수신(영상·원본 파일은 반출하지 않음)", done: true },
  { title: "표출 항목 매핑", body: "수신 항목을 상황판 표출 항목(위험 등급·요약·시각)에 대응 — 규격은 연계 자료 수령 후 확정", done: false },
  { title: "표준 데이터 모델", body: "AX Hub 표준(NGSI-LD)과 공통 이벤트 구조 간 매핑 기준 정의", done: false },
  { title: "연계 시험", body: "샌드박스·읽기 전용 경로로 수신 확인 후 표출 값 대조", done: false },
]

export function HubLinkPage({ title, lead, children }: { title: string; lead: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/50">{lead}</p>
        <p className="mt-2 inline-block rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {IS_STAGING ? "연계 전 · 표시된 값은 샘플입니다(연계 자료 10월 중순 수령 예정)" : "연계 전 · 값 없음(연계 자료 10월 중순 수령 예정)"}
        </p>
      </div>
      {IS_STAGING ? children : (
        <Card title="표출 내용">
          <p className="text-sm text-white/60">연계 전이라 표시할 값이 없습니다 — 데이터 없음</p>
        </Card>
      )}
      <Card title="연계 진행 단계">
        <ol className="flex flex-col gap-2">
          {HUB_STEPS.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 text-sm">
              <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.done ? "bg-accent text-black" : "border border-white/30 text-white/50"}`}>
                {i + 1}
              </span>
              <span>
                <b className="text-white/90">{s.title}</b> <span className="text-white/40">· {s.done ? "방식 정의됨" : "연계 자료 수령 후"}</span>
                <span className="block text-white/60">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
