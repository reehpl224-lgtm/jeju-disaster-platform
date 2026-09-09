import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { legacySystems } from "../../data/mockHeavyRain"
import { apiLinks } from "../../data/mockMonitoring"
import { aquaDataSources } from "../../data/mockAqua"

const LEGACY_STATUS_LEVEL: Record<(typeof legacySystems)[number]["linkStatus"], "safe" | "caution" | "offline"> = {
  "연계 진행중": "safe",
  "협의 중": "caution",
  "미연계": "offline",
}

const API_STATUS_LEVEL: Record<(typeof apiLinks)[number]["status"], "safe" | "caution" | "danger"> = {
  normal: "safe",
  delayed: "caution",
  down: "danger",
}

const PILOT_DATA_STATUS_LEVEL: Record<(typeof aquaDataSources)[number]["status"], "safe" | "caution" | "danger" | "offline"> = {
  normal: "safe",
  delayed: "caution",
  error: "danger",
  missing: "offline",
}

const legacyActiveCount = legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
const apiNormalCount = apiLinks.filter((a) => a.status === "normal").length
const apiIssueCount = apiLinks.length - apiNormalCount
const pilotNormalCount = aquaDataSources.filter((s) => s.status === "normal").length

export function DataSystemPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데이터 시스템 연계현황</h1>
        <p className="mt-1 text-sm text-white/50">
          실 서비스에 들어가는 레거시 시스템 · 외부 API · 실증 데이터 소스를 한 곳에서 확인 — 실시간 장애·응답속도는{" "}
          <Link to="/monitoring" className="text-accent hover:underline">
            시스템 상태
          </Link>{" "}
          메뉴 참고
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-white/40">레거시 시스템</p>
          <p className="mt-1 text-xl font-bold text-white">
            연계 진행중 {legacyActiveCount} <span className="text-sm font-normal text-white/35">/ 총 {legacySystems.length}건</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">외부 API 연계</p>
          <p className="mt-1 text-xl font-bold text-white">
            정상 {apiNormalCount} <span className="text-sm font-normal text-white/35">/ 지연·장애 {apiIssueCount}건</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-white/40">실증 데이터 소스</p>
          <p className="mt-1 text-xl font-bold text-white">
            정상 {pilotNormalCount} <span className="text-sm font-normal text-white/35">/ 총 {aquaDataSources.length}건</span>
          </p>
        </Card>
      </div>

      <Card title="레거시 시스템 연계 현황" subtitle="레거시시스템 현황 조사 면담(2026-09-07) 기준 — 실제 연계 진행 상태">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {legacySystems.map((system) => (
            <li key={system.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{system.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  운영 주체 {system.operator} · {system.note}
                </p>
              </div>
              <RiskBadge level={LEGACY_STATUS_LEVEL[system.linkStatus]} label={system.linkStatus} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="외부 API 연계 현황" subtitle="기관별 외부 데이터 API — 재난 서비스 입력값으로 연계되는 항목">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {apiLinks.map((api) => (
            <li key={api.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{api.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {api.agency} · 응답속도 {api.responseTime} · 최근 수신 {api.lastReceived}
                </p>
              </div>
              <RiskBadge
                level={API_STATUS_LEVEL[api.status]}
                label={api.status === "normal" ? "정상" : api.status === "delayed" ? "지연" : "장애"}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="실증 데이터 소스 현황"
        subtitle="저염분·고수온 실증서비스 기준 예시 — 하천·연안 실증서비스 데이터는 각 홈 화면 관측망 카드 참고"
        action={
          <Link to="/aqua/data" className="text-xs font-semibold text-accent hover:underline">
            자세히 보기 →
          </Link>
        }
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaDataSources.map((source) => (
            <li key={source.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{source.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {source.detail} · 주기 {source.cycle} · 최근 수신 {source.updatedAt}
                  {source.qualityScore != null && ` · 품질 ${source.qualityScore}점`}
                  {" · "}
                  {source.note}
                </p>
              </div>
              <RiskBadge
                level={PILOT_DATA_STATUS_LEVEL[source.status]}
                label={
                  source.status === "normal"
                    ? "정상"
                    : source.status === "delayed"
                      ? "지연"
                      : source.status === "error"
                        ? "오류"
                        : "누락"
                }
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
