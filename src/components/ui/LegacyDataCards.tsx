import { IS_STAGING } from "../../data/appMode"
import { LEGACY_ALERT_HISTORY, LEGACY_COLLECTION, alertMinutes } from "../../data/legacyFeed"
import { legacySystems } from "../../data/mockHeavyRain"
import { Card } from "./Card"
import { RiskBadge } from "./RiskBadge"

const SYSTEM_LABEL: Record<string, string> = { "ls-ews": "조기경보 통합", "ls-rain-alert": "강우량 자동경보", "ls-flood-warn": "자동 침수 경보" }
const STAGE_LEVEL = { 관심: "caution", 주의: "warning", 경계: "alert", 심각: "danger" } as const
const STATE_LEVEL = { 정상: "safe", 지연: "caution", 누락: "danger" } as const
const nameOf = (id: string) => legacySystems.find((s) => s.id === id)?.name ?? id

/** 이력·보고서 — 레거시 시스템에 쌓여 있는 경보 발령 이력(사후분석·임계치 설정 참고). 스테이징은 임의 샘플, 프로토타입은 연계 전 */
export function LegacyAlertHistoryCard() {
  const done = LEGACY_ALERT_HISTORY.map(alertMinutes).filter((m): m is number => m !== null)
  const avg = done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length) : null
  return (
    <Card title="레거시 경보 발령 이력" subtitle={`조기경보 통합·강우량 자동경보·자동 침수 경보가 쌓아 둔 이력 — 사후분석·임계치 설정 참고 (연계 전${IS_STAGING ? ", 임의 샘플" : ""})`}>
      {IS_STAGING ? (
        <>
          <p className="text-xs text-white/50">
            총 {LEGACY_ALERT_HISTORY.length}건 · 해제 전 {LEGACY_ALERT_HISTORY.length - done.length}건 · 해제된 경보 평균 지속 {avg ?? "-"}분
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead>
                <tr className="text-white/40">
                  {["발령 시각", "시스템", "대상", "단계", "수치", "해제", "지속"].map((h) => (
                    <th key={h} className="px-2 py-1 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEGACY_ALERT_HISTORY.map((r) => {
                  const m = alertMinutes(r)
                  return (
                    <tr key={`${r.at}-${r.target}`} className="border-t border-border-subtle">
                      <td className="px-2 py-1">{r.at}</td>
                      <td className="px-2 py-1">{SYSTEM_LABEL[r.system]}</td>
                      <td className="px-2 py-1">{r.target}</td>
                      <td className="px-2 py-1">
                        <RiskBadge level={STAGE_LEVEL[r.stage]} label={r.stage} />
                      </td>
                      <td className="px-2 py-1">{r.value}</td>
                      <td className="px-2 py-1">{r.clearedAt ?? "해제 전"}</td>
                      <td className="px-2 py-1">{m !== null ? `${m}분` : "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-xs text-white/40">연계 전 — 레거시 시스템의 경보 이력을 받으면 여기에 표시됩니다.</p>
      )}
    </Card>
  )
}

/** 운영 모니터링 — 레거시 시스템별 최근 수신 시각과 수집 상태. 스테이징은 임의 샘플, 프로토타입은 연계 전 */
export function LegacyCollectionCard() {
  const bad = LEGACY_COLLECTION.filter((c) => c.state !== "정상").length
  return (
    <Card title="레거시 수집 상태" subtitle={`레거시 시스템별 최근 수신과 수집 상태 (연계 전${IS_STAGING ? ", 임의 샘플" : ""})`}>
      {IS_STAGING ? (
        <>
          <p className="text-xs text-white/50">
            {LEGACY_COLLECTION.length}개 시스템 · 지연·누락 {bad}건
          </p>
          <ul className="mt-2 flex flex-col divide-y divide-border-subtle">
            {LEGACY_COLLECTION.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="text-white/85">{nameOf(c.id)}</p>
                  <p className="text-xs text-white/35">
                    최근 수신 {c.lastAt} · {c.note}
                  </p>
                </div>
                <RiskBadge level={STATE_LEVEL[c.state]} label={c.state} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs text-white/40">연계 전 — 수신 기록이 없어 수집 상태를 표시하지 않습니다.</p>
      )}
    </Card>
  )
}
