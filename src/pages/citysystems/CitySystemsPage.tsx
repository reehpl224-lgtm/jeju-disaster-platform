import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { LegacySystemList } from "../../components/ui/LegacySystemList"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { IS_STAGING } from "../../data/appMode"
import { useCctvCameras } from "../../data/cctvLive"
import { LEVEL_SAMPLE, levelAlertsOf, levelStageOf } from "../../data/levelAlerts"
import type { CctvCamera } from "../../types/domain"

const DOMAIN_LABEL: Record<CctvCamera["domain"], string> = { river: "하천", coast: "월파", aqua: "물놀이", snow: "적설", general: "기타" }
const STAGE_LEVEL = { 관심: "caution", 주의: "warning", 경계: "alert", 심각: "danger" } as const

/** 행정시별로 보는 시스템 — id는 mockHeavyRain.ts의 legacySystems. 제주시 '자동경보시스템'은 자동 침수 경보 시스템과 하천 모니터링·유속계를 함께 본다 */
const CITIES: { city: "서귀포시" | "제주시"; systems: string[]; cctvNote: string }[] = [
  { city: "서귀포시", systems: ["ls-sgp-rain"], cctvNote: "서귀포시 재난감시 CCTV — 목록 자료 10월 중순 수령 예정(하천 34 · 월파 25 · 물놀이 14 · 적설 7)" },
  { city: "제주시", systems: ["ls-flood-warn", "ls-river-mon", "ls-river-flow"], cctvNote: "제주시 공공데이터포털 감시 CCTV — 실연동(월파 19 · 하천 62 · 적설 10)" },
]

function CctvBox({ city, note }: { city: "서귀포시" | "제주시"; note: string }) {
  const cams = useCctvCameras().filter((c) => c.operator === city)
  const by = cams.reduce<Record<string, number>>((m, c) => ({ ...m, [DOMAIN_LABEL[c.domain]]: (m[DOMAIN_LABEL[c.domain]] ?? 0) + 1 }), {})
  const none = cams.length === 0
  return (
    <div className="rounded-lg border border-border-subtle p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <b className="text-white/85">{city} CCTV</b>
        <RiskBadge level={none ? "offline" : "safe"} label={none ? "연계 전" : `${cams.length}대${city === "서귀포시" ? " · 샘플" : ""}`} />
      </div>
      <p className="mt-1 text-xs text-white/40">{note}</p>
      {!none && (
        <p className="mt-1 text-xs text-white/60">
          {Object.entries(by)
            .map(([k, n]) => `${k} ${n}`)
            .join(" · ")}
        </p>
      )}
      <Link to="/dashboard?tab=cctv" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">
        CCTV 탭에서 보기 →
      </Link>
    </div>
  )
}

/**
 * 운영 > 행정시 전용 시스템 — 요구사항 '행정시 전용 시스템 연계'(서귀포시 자동우량경보·CCTV, 제주시 자동경보시스템·공공데이터포털 CCTV).
 * 이 시스템들은 도청에 연계돼 있지 않고 섬엔지니어링이 유지보수한다. 도청·행정시 공문 승인 뒤 섬엔지니어링이 자료를 주는 절차라(2026-10-02 면담) 값은 10월 중순 수령 예정이다.
 * 그때까지 값은 모두 임의 샘플이고, 스테이징만 보여 준다(프로토타입은 '연계 전').
 */
export function CitySystemsPage() {
  const alerts = levelAlertsOf(LEVEL_SAMPLE)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">행정시 전용 시스템</h1>
        <p className="mt-1 text-sm text-white/50">
          서귀포시·제주시가 따로 운영하는 시스템의 연계 상태와 받을 데이터를 한 곳에서 봅니다. 도청과 연계돼 있지 않아 섬엔지니어링 협의가 필요하며, 도청·행정시 공문 승인 뒤 자료를 받는 절차입니다.
        </p>
        <p className="mt-1 text-[11px] text-white/35">
          {IS_STAGING ? "스테이징 — 값은 모두 임의 샘플입니다(자료 10월 중순 수령 예정)." : "프로토타입 — 자료 수령 전이라 값 없이 '연계 전'으로 표시합니다."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {CITIES.map(({ city, systems, cctvNote }) => (
          <Card key={city} title={city} subtitle="행정시 전용 시스템 + CCTV">
            <LegacySystemList ids={systems} />
            <div className="mt-3">
              <CctvBox city={city} note={cctvNote} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="수위 임계치 알람" subtitle="하천 수위·침수 센서가 지점별 기준을 넘으면 헤더 알림에 올립니다(주의 이상, 기준은 표시용 잠정치)">
        {IS_STAGING ? (
          <>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {LEVEL_SAMPLE.map((p) => {
                const stage = levelStageOf(p)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="text-white/85">
                        {p.group} · {p.place}
                      </p>
                      <p className="text-xs text-white/35">
                        수위 {p.levelM.toFixed(2)}m · 관심 {p.steps.관심} · 주의 {p.steps.주의} · 경계 {p.steps.경계} · 심각 {p.steps.심각} (m 이상)
                      </p>
                    </div>
                    <RiskBadge level={stage ? STAGE_LEVEL[stage] : "safe"} label={stage ?? "기준 미만"} />
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[11px] text-white/35">헤더 알림에 올라간 수위 알림 {alerts.length}건 — 주의 이상만 올립니다.</p>
          </>
        ) : (
          <p className="text-xs text-white/40">연계 전 — 수위 값이 없어 알람을 만들지 않습니다. 값과 기준이 도착하면 이 목록과 헤더 알림에 같은 방식으로 나타납니다.</p>
        )}
      </Card>
    </div>
  )
}
