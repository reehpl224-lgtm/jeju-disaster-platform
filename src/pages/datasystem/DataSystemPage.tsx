import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { legacySystems } from "../../data/mockHeavyRain"
import { apiLinks } from "../../data/mockMonitoring"
import { aquaDataSources } from "../../data/mockAqua"
import { coastSafetyAssets } from "../../data/mockCoast"
import { riverSensorCheck } from "../../data/mockRiver"

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

const COAST_ASSET_STATUS_LEVEL: Record<(typeof coastSafetyAssets)[number]["status"], "safe" | "danger"> = {
  정상: "safe",
  오류: "danger",
}

const RIVER_SENSOR_STATUS_LEVEL: Record<(typeof riverSensorCheck)[number]["status"], "safe" | "danger"> = {
  정상: "safe",
  이상: "danger",
}

type TargetTag = { label: string; href?: string }

/** 어떤 서비스/메뉴에 이 데이터가 들어가는지 — AGENTS.md·mockDashboard aiInsights·incidentLog 등에 실제로 근거가 있는 연결만 표기 */
const LEGACY_TARGETS: Record<(typeof legacySystems)[number]["id"], TargetTag[]> = {
  "ls-1": [{ label: "호우", href: "/heavy-rain" }],
  "ls-2": [{ label: "공통(총괄)", href: "/dashboard" }],
  "ls-3": [{ label: "상황전파·보고체계", href: "/propagation" }],
  "ls-4": [{ label: "호우", href: "/heavy-rain" }],
  "ls-5": [{ label: "상황전파·보고체계", href: "/propagation" }],
  "ls-6": [{ label: "기타" }],
  "ls-7": [{ label: "통합 대시보드(CCTV 통합조회)", href: "/dashboard" }],
}

const API_TARGETS: Record<(typeof apiLinks)[number]["id"], TargetTag[]> = {
  kma: [
    { label: "호우", href: "/heavy-rain" },
    { label: "하천범람", href: "/river" },
  ],
  khoa: [{ label: "하천범람(조위 연계 시계열)", href: "/river/analysis" }],
  "buoy-api": [{ label: "저염분 고수온", href: "/aqua" }],
  goci: [{ label: "저염분 고수온", href: "/aqua" }],
  "vilage-fcst": [
    { label: "대시보드", href: "/dashboard" },
    { label: "하천범람", href: "/river" },
    { label: "연안 안전관리", href: "/coast" },
    { label: "폭염", href: "/heat" },
    { label: "호우", href: "/heavy-rain" },
    { label: "태풍", href: "/typhoon" },
    { label: "저염분 고수온", href: "/aqua" },
  ],
  "typ-lst": [{ label: "태풍", href: "/typhoon" }],
}

const AQUA_TARGET: TargetTag = { label: "저염분 고수온", href: "/aqua" }
const COAST_TARGET: TargetTag = { label: "연안 안전관리", href: "/coast" }
const RIVER_TARGET: TargetTag = { label: "하천범람", href: "/river" }

function TargetTags({ tags }: { tags: TargetTag[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((tag) =>
        tag.href ? (
          <Link
            key={tag.label}
            to={tag.href}
            className="rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent hover:underline"
          >
            → {tag.label}
          </Link>
        ) : (
          <span
            key={tag.label}
            className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-semibold text-white/40"
          >
            {tag.label}
          </span>
        ),
      )}
    </div>
  )
}

const legacyActiveCount = legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
const apiNormalCount = apiLinks.filter((a) => a.status === "normal").length
const apiIssueCount = apiLinks.length - apiNormalCount

const pilotTotalCount = aquaDataSources.length + coastSafetyAssets.length + riverSensorCheck.length
const pilotNormalCount =
  aquaDataSources.filter((s) => s.status === "normal").length +
  coastSafetyAssets.filter((s) => s.status === "정상").length +
  riverSensorCheck.filter((s) => s.status === "정상").length

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
            정상 {pilotNormalCount} <span className="text-sm font-normal text-white/35">/ 총 {pilotTotalCount}건</span>
          </p>
        </Card>
      </div>

      <Card
        title="레거시 시스템 연계 현황"
        subtitle="레거시시스템 현황 조사 면담(2026-09-07) 기준 — 실제 연계 진행 상태 · 배지는 이 데이터가 반영되는 서비스"
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {legacySystems.map((system) => (
            <li key={system.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{system.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  운영 주체 {system.operator} · {system.note}
                </p>
                <TargetTags tags={LEGACY_TARGETS[system.id]} />
              </div>
              <RiskBadge level={LEGACY_STATUS_LEVEL[system.linkStatus]} label={system.linkStatus} />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="외부 API 연계 현황"
        subtitle="기관별 외부 데이터 API — 배지는 이 API 데이터가 입력값으로 쓰이는 서비스"
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {apiLinks.map((api) => (
            <li key={api.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{api.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {api.agency} · 응답속도 {api.responseTime} · 최근 수신 {api.lastReceived}
                </p>
                <TargetTags tags={API_TARGETS[api.id]} />
              </div>
              <RiskBadge
                level={API_STATUS_LEVEL[api.status]}
                label={api.status === "normal" ? "정상" : api.status === "delayed" ? "지연" : "장애"}
              />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/35">
          기상청 단기예보·API허브 태풍 이름목록 2건은 kma-weather-proxy(Vercel)를 경유해 화면을 열 때마다 실시간으로 호출됩니다.
          나머지(조위관측·해양관측부이·GOCI-II)는 정적 프로토타입이라 2026-09-09 확인 시점 값으로 고정 표시됩니다.
        </p>
      </Card>

      <Card title="실증 데이터 소스 현황" subtitle="3대 실증서비스(저염분 고수온·연안 안전관리·하천범람)가 각각 쓰는 데이터 소스">
        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white/70">저염분 고수온</h3>
                <TargetTags tags={[AQUA_TARGET]} />
              </div>
              <Link to="/aqua/data" className="text-xs font-semibold text-accent hover:underline">
                자세히 보기 →
              </Link>
            </div>
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
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white/70">연안 안전관리</h3>
                <TargetTags tags={[COAST_TARGET]} />
              </div>
              <Link to="/coast/monitoring" className="text-xs font-semibold text-accent hover:underline">
                자세히 보기 →
              </Link>
            </div>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {coastSafetyAssets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white/85">{asset.name}</p>
                    <p className="mt-0.5 text-xs text-white/35">
                      {asset.location} · {asset.detail}
                    </p>
                  </div>
                  <RiskBadge level={COAST_ASSET_STATUS_LEVEL[asset.status]} label={asset.status} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white/70">하천범람</h3>
                <TargetTags tags={[RIVER_TARGET]} />
              </div>
              <Link to="/river/analysis" className="text-xs font-semibold text-accent hover:underline">
                자세히 보기 →
              </Link>
            </div>
            <ul className="flex flex-col divide-y divide-border-subtle">
              {riverSensorCheck.map((sensor) => (
                <li key={sensor.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-white/85">{sensor.name}</p>
                    <p className="mt-0.5 text-xs text-white/35">
                      {sensor.value} · {sensor.detail}
                    </p>
                  </div>
                  <RiskBadge level={RIVER_SENSOR_STATUS_LEVEL[sensor.status]} label={sensor.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
