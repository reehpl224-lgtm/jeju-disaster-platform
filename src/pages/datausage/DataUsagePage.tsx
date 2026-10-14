import { useMemo, useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { DATA_USAGE, USAGE_TRACKS, usageSummary, type UsageItem, type UsageState, type UsageTrack } from "../../data/dataUsage"

const STATE_LEVEL: Record<UsageState, "safe" | "info" | "caution" | "offline"> = {
  "실시간 호출": "safe",
  "받아 둔 파일": "info",
  "임의 샘플": "caution",
  "연계 전": "offline",
}
const btn = (on: boolean) =>
  `h-8 rounded-md border px-3 text-xs font-bold ${on ? "border-accent bg-accent-soft text-accent" : "border-white/20 text-white hover:bg-white/10"}`

function Row({ item }: { item: UsageItem }) {
  return (
    <li className="py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b className="text-white/90">{item.data}</b>
        <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-semibold text-white/50">{item.origin}</span>
        <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-semibold text-white/50">{item.service}</span>
        <span className="ml-auto">
          <RiskBadge level={STATE_LEVEL[item.state]} label={item.state} />
        </span>
      </div>
      <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[88px_1fr]">
        <dt className="text-white/35">제공처</dt>
        <dd className="text-white/70">{item.provider}</dd>
        <dt className="text-white/35">받는 방법</dt>
        <dd className="text-white/70">{item.access}</dd>
        <dt className="text-white/35">어떻게 썼나</dt>
        <dd className="text-white/70">{item.how}</dd>
        <dt className="text-white/35">쓰는 화면</dt>
        <dd className="text-white/70">{item.where}</dd>
        <dt className="text-white/35">개발자 전달</dt>
        <dd className="text-accent/90">{item.handoff}</dd>
      </dl>
    </li>
  )
}

/**
 * 운영 > 데이터 사용 명세 — 어떤 데이터를 어디서 받아 어떻게 가공해 썼는지 구분해서 적은 장부. 개발자에게 실제 연계·교체 지점을 넘길 때 쓴다.
 * 레거시(풍수해) 서비스와 실증 서비스는 별개의 서비스로 나누어 보고, 상태는 프로토타입 기준이다(스테이징은 값이 없는 곳에 임의 샘플을 채움).
 */
export function DataUsagePage() {
  const [track, setTrack] = useState<UsageTrack | "all">("all")
  const [origin, setOrigin] = useState<string>("all")
  const sum = useMemo(() => usageSummary(DATA_USAGE), [])
  const origins = Object.keys(sum.byOrigin)
  const shown = DATA_USAGE.filter((i) => (track === "all" || i.track === track) && (origin === "all" || i.origin === origin))
  const tracks = (Object.keys(USAGE_TRACKS) as UsageTrack[]).filter((t) => shown.some((i) => i.track === t))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 사용 명세</h1>
        <p className="mt-1 text-sm text-white/50">
          화면에 쓴 데이터를 출처·받는 방법·가공 방식·쓰는 화면으로 구분해 적었습니다. 실제 데이터를 연계할 때 개발자에게 넘기는 기준표입니다.
        </p>
      </div>

      <Card title="서비스 구분" subtitle="두 갈래는 별개의 서비스이며 1차년도는 각각 따로 봅니다 — 실증 서비스가 레거시 서비스를 보완하는 관계는 이후 단계에서 잇습니다">
        <ul className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(USAGE_TRACKS) as UsageTrack[]).map((t) => (
            <li key={t} className="rounded-lg border border-border-subtle p-3 text-sm">
              <b className="text-white/90">{USAGE_TRACKS[t].label}</b>
              <p className="mt-1 text-xs text-white/50">{USAGE_TRACKS[t].desc}</p>
              <p className="mt-1 text-xs text-white/35">{DATA_USAGE.filter((i) => i.track === t).length}건</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/35">
          상태 기준 — 실시간 호출: 화면을 열 때 외부 API를 호출 · 받아 둔 파일: 스크립트로 받아 저장소에 둔 스냅샷 · 임의 샘플: 실제 값이 오기 전 화면 구성을 보이려고 넣은 값 · 연계 전: 값 없음.
          프로토타입 기준이며 스테이징은 값이 없는 곳에 임의 샘플을 채웁니다.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="필터">
        <button type="button" className={btn(track === "all")} onClick={() => setTrack("all")}>
          전체 {DATA_USAGE.length}
        </button>
        {(Object.keys(USAGE_TRACKS) as UsageTrack[]).map((t) => (
          <button key={t} type="button" className={btn(track === t)} onClick={() => setTrack(t)}>
            {USAGE_TRACKS[t].short}
          </button>
        ))}
        <span className="mx-1 text-white/20">|</span>
        <button type="button" className={btn(origin === "all")} onClick={() => setOrigin("all")}>
          출처 전체
        </button>
        {origins.map((o) => (
          <button key={o} type="button" className={btn(origin === o)} onClick={() => setOrigin(o)}>
            {o} {sum.byOrigin[o]}
          </button>
        ))}
      </div>

      {tracks.map((t) => (
        <Card key={t} title={USAGE_TRACKS[t].label} subtitle={USAGE_TRACKS[t].desc}>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {shown
              .filter((i) => i.track === t)
              .map((i) => (
                <Row key={i.id} item={i} />
              ))}
          </ul>
        </Card>
      ))}
      {shown.length === 0 && <p className="text-sm text-white/40">조건에 맞는 항목이 없습니다.</p>}
    </div>
  )
}
