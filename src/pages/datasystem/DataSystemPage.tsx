import { useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { DOMAINS } from "../../components/layout/domainSidebarUtils"
import { Card } from "../../components/ui/Card"
import { ServicePills } from "../../components/ui/ServicePills"
import { HAZARDS, HAZARD_IDS, type HazardId } from "../../data/mockHazards"
import { typhoonSource } from "../../data/mockTyphoon"
import { DOMAIN_CONFIGS } from "../domain/domainConfigs"
import { PlanItemsCard } from "../../components/ui/PlanItemsCard"
import { commonSchedule, consortiumRoles } from "../../data/mockMeetingItems"
import { StatTiles } from "../../components/ui/StatTiles"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { legacySystems } from "../../data/mockHeavyRain"
import { apiLinks } from "../../data/mockMonitoring"
import { aquaDataSources } from "../../data/mockAqua"
import { coastSafetyAssets } from "../../data/mockCoast"
import { riverSensorCheck } from "../../data/mockRiver"
import { IS_STAGING } from "../../data/appMode"
import { LegacyFeedTable } from "../../components/ui/LegacyFeedTable"

/**
 * 연계 자료 수령 예정 — 2026년 10월 중순 도착 예정인 자료와, 도착 전 화면에서 어떻게 보이는지.
 * 요구사항 '행정시 전용 시스템 연계'·'제주도청 시스템 연계'·'서귀포시 CCTV 연계 대상 목록'·'실증서비스 3종 연계'·'AX Hub 연계' 대응.
 */
const PENDING_INPUTS: { name: string; detail: string; shownAt: string }[] = [
  { name: "서귀포시 CCTV 목록", detail: "하천 34 · 월파 25 · 물놀이 14 · 적설 7대 — 서귀포시 안전총괄과", shownAt: "CCTV 탭·지도 CCTV 레이어" },
  { name: "서귀포시 자동우량경보 · 제주시 자동경보시스템", detail: "행정시 전용 시스템 — 섬엔지니어링 연계 협조 진행", shownAt: "호우 서비스·알림(우량·수위 임계치)" },
  { name: "제주도청 시스템 3종", detail: "CCTV 시스템 · 조기경보 통합 상황 관리 연계시스템 · 강우량 연동 자동 경보 발령 시스템", shownAt: "데이터 시스템 연계현황" },
  { name: "실증서비스 3종 API·파일 규격", detail: "저염분·고수온 / 연안 안전관리 / 하천 범람 예측 — 출력 규격 확정 후 항목 매핑", shownAt: "서비스 보드·서비스 카드" },
  { name: "유관기관 위치 자료", detail: "소방·경찰·해경·병원·대피소 등", shownAt: "지도 유관기관 레이어" },
  { name: "AX Hub sLLM·VLM 연계 자료", detail: "API·이벤트 수신 규격, 레거시 데이터 대시보드", shownAt: "헤더 AX HUB·VLM 화면" },
]

/** 레거시시스템 데이터 연계 지원 — 연계 대상 자산 최소 3건 후보(현황조사 완료 후 확정). 후보는 연계 상태 표의 시스템에서 골랐다 */
const LINK_CANDIDATES = ["ls-ews", "ls-flood-mgmt", "ls-rain-alert"] as const

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

const RIVER_SENSOR_STATUS_LEVEL: Record<"정상" | "이상", "safe" | "danger"> = {
  정상: "safe",
  이상: "danger",
}

type TargetTag = { label: string; href?: string }

/** 어떤 서비스/메뉴에 이 데이터가 들어가는지 — AGENTS.md·mockDashboard aiInsights·incidentLog 등에 실제로 근거가 있는 연결만 표기 */
const LEGACY_TARGETS: Record<(typeof legacySystems)[number]["id"], TargetTag[]> = {
  "ls-ews": [{ label: "호우", href: "/heavy-rain" }],
  "ls-flood-mgmt": [{ label: "호우", href: "/heavy-rain" }],
  "ls-rain-alert": [{ label: "호우", href: "/heavy-rain" }],
  "ls-flood-warn": [{ label: "호우", href: "/heavy-rain" }],
  "ls-river-mon": [{ label: "하천범람", href: "/river" }],
  "ls-river-flow": [{ label: "하천범람", href: "/river" }],
  "ls-sgp-rain": [{ label: "호우", href: "/heavy-rain" }],
  "ls-2": [{ label: "공통(총괄)", href: "/dashboard" }],
  "ls-3": [{ label: "상황전파·보고체계", href: "/propagation" }],
  "ls-5": [{ label: "상황전파·보고체계", href: "/propagation" }],
  "ls-6": [{ label: "기타" }],
  "ls-7": [{ label: "통합 대시보드(CCTV 통합조회)", href: "/dashboard" }],
  "ls-snow": [{ label: "대설", href: "/snow" }],
  "ls-quake": [{ label: "지진해일", href: "/tsunami" }],
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
    // [숨김 2026-10-14] 폭염·산불은 1차년도 범위(풍수해) 밖이라 화면에서 뺌 — 복원하려면 아래 주석을 해제
    // { label: "폭염", href: "/heat" },
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

const legacyActiveCount =legacySystems.filter((s) => s.linkStatus === "연계 진행중").length
const apiNormalCount = apiLinks.filter((a) => a.status === "normal").length
const apiIssueCount = apiLinks.length - apiNormalCount

const pilotTotalCount = aquaDataSources.length + coastSafetyAssets.length + riverSensorCheck.length
const pilotNormalCount =
  aquaDataSources.filter((s) => s.status === "normal").length +
  coastSafetyAssets.filter((s) => s.status === "정상").length +
  riverSensorCheck.filter((s) => s.status === "정상").length

/**
 * 서비스 한 개의 데이터 수집·연계 시스템·실시간 연동 — 도메인 보드에서 숨긴 세 탭(2026-10-02)을 여기로 옮긴 것.
 * 보드 설정(DOMAIN_CONFIGS)의 "data" 탭과 "live" 우측 탭 내용을 그대로 재사용한다.
 */
function ServiceView({ prefix, title }: { prefix: string; title: string }) {
  const id = prefix.slice(1)
  const config = useMemo(() => DOMAIN_CONFIGS[id](), [id])
  const legacy = HAZARD_IDS.includes(id as HazardId)
    ? HAZARDS[id as HazardId].legacy
    : legacySystems.filter((s) => LEGACY_TARGETS[s.id].some((t) => t.href?.startsWith(prefix)))
  const apis = apiLinks.filter((a) => API_TARGETS[a.id].some((t) => t.href?.startsWith(prefix)))
  const legacyNote = id === "typhoon" ? typhoonSource.relatedLegacySystem : null
  const empty = <p className="text-xs text-white/40">데이터가 없습니다.</p>
  return (
    <div className="flex flex-col gap-6">
      <Card title={`${title} — 데이터 수집`} subtitle="이 서비스가 쓰는 데이터를 실제 연동 가능 여부로 구분">
        {config.tabs.find((t) => t.key === "data")?.content}
        <Link to={`${prefix}/data`} className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
          데이터 수집 상세 화면 →
        </Link>
      </Card>

      <Card title={`${title} — 연계 시스템 · 레거시`} subtitle="레거시시스템 현황 조사 기준 연계 상태">
        {legacy.length === 0 && !legacyNote ? (
          empty
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle">
            {legacy.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/85">{s.name}</p>
                  <p className="mt-0.5 text-xs text-white/35">
                    운영 주체 {s.operator} · {s.note}
                  </p>
                  <LegacyFeedTable id={s.id} />
                </div>
                <RiskBadge level={LEGACY_STATUS_LEVEL[s.linkStatus]} label={s.linkStatus} />
              </li>
            ))}
            {legacyNote && <li className="py-3 text-xs text-white/50">관련 레거시 시스템: {legacyNote}</li>}
          </ul>
        )}
      </Card>

      <Card title={`${title} — 연계 시스템 · 외부 API`} subtitle="기관별 외부 데이터 API — 이 서비스의 입력값으로 쓰이는 것만" dummy>
        {apis.length === 0 ? (
          empty
        ) : (
          <ul className="flex flex-col divide-y divide-border-subtle">
            {apis.map((api) => (
              <li key={api.id} className="flex items-start justify-between gap-3 py-3 text-sm">
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
        )}
      </Card>

      <Card title={`${title} — 실시간 연동`} subtitle="화면을 열 때마다 호출하는 실시간 API 패널">
        {config.right.find((t) => t.key === "live")?.content ?? empty}
      </Card>
    </div>
  )
}

export function DataSystemPage() {
  const [params] = useSearchParams()
  const service = DOMAINS.find((d) => d.prefix.slice(1) === params.get("system"))
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

      <ServicePills basePath="/data-systems" current={service?.prefix} />

      {service ? <ServiceView key={service.prefix} prefix={service.prefix} title={service.title} /> : <AllSystemsView />}
    </div>
  )
}

function AllSystemsView() {
  const candidates = legacySystems.filter((s) => (LINK_CANDIDATES as readonly string[]).includes(s.id))
  return (
    <div className="flex flex-col gap-6">
      <StatTiles
        items={[
          { label: "레거시 시스템", value: `연계 진행중 ${legacyActiveCount}`, sub: `총 ${legacySystems.length}건` },
          { label: "외부 API 연계", value: `정상 ${apiNormalCount}`, sub: `지연·장애 ${apiIssueCount}건` },
          { label: "실증 데이터 소스", value: `정상 ${pilotNormalCount}`, sub: `총 ${pilotTotalCount}건` },
        ]}
      />

      <Card title="연계 자료 수령 예정 — 2026년 10월 중순" subtitle={IS_STAGING ? "도착 전이라 스테이징은 샘플 값으로 화면 구성을 보여줍니다" : "도착 전이라 프로토타입은 값 없이 '연계 전'으로 표시합니다"}>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {PENDING_INPUTS.map((item) => (
            <li key={item.name} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-white/85">{item.name}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {item.detail} · 화면: {item.shownAt}
                </p>
              </div>
              <RiskBadge level="caution" label={IS_STAGING ? "수령 예정 · 샘플" : "수령 예정"} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/35">
          제주시 월파 감시 CCTV는 공공데이터 API가 19대를 주지만 면담 문서에는 9대로 적혀 있어 수령 자료와 대조해 확정합니다.
        </p>
        <h3 className="mt-4 text-xs font-bold text-white/70">연계 대상 자산 후보 — 현황조사 완료 후 3건 이상 확정</h3>
        <ul className="mt-1 flex flex-col divide-y divide-border-subtle">
          {candidates.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <p className="text-white/80">{s.name}</p>
              <RiskBadge level={LEGACY_STATUS_LEVEL[s.linkStatus]} label={`후보 · ${s.linkStatus}`} />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="레거시 시스템 연계 현황"
        subtitle="레거시시스템 현황 조사 면담(2026-09-07) + 1차년도 사용 가능 레거시 데이터 현황 문서(2026-09-28) 기준 — 실제 연계 진행 상태 · 배지는 이 데이터가 반영되는 서비스"
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
                <LegacyFeedTable id={system.id} />
              </div>
              <RiskBadge level={LEGACY_STATUS_LEVEL[system.linkStatus]} label={system.linkStatus} />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="외부 API 연계 현황"
        subtitle="기관별 외부 데이터 API — 배지는 이 API 데이터가 입력값으로 쓰이는 서비스"
        dummy
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

      <Card title="실증 데이터 소스 현황" subtitle="3대 실증서비스(저염분 고수온·연안 안전관리·하천범람)가 각각 쓰는 데이터 소스" dummy>
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

      <PlanItemsCard title="연동 규격·추진 일정" subtitle="컨소시엄 전달 사항과 협의체 일정" items={commonSchedule} />

      <PlanItemsCard title="컨소시엄 역할 분담" subtitle="기관별 담당 영역" items={consortiumRoles} />
    </div>
  )
}
