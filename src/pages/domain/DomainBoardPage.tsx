import { useMemo, useState } from "react"
import { useElementHeight } from "../../hooks/useElementHeight"
import { Navigate, useSearchParams } from "react-router-dom"
import type { RiskMarker } from "../../types/domain"
import { DetailLink, Group } from "../../components/board/PanelParts"
import { MessengerFab, Risk, ServiceStrip, SideTabsDock, StripToggle, type DockTab } from "../../components/board/BoardParts"
import { BoardDashboard, BoardHistory, BoardResponsePanel } from "../../components/board/BoardPanels"
import { SpSample } from "../../components/sidepanel/primitives"
import { IS_STAGING } from "../../data/appMode"
import { useBoardFacts } from "../../data/boardFacts"
import { shelterMarkers } from "../../data/heatMapMarkers"
import { heatShelters } from "../../data/mockHeat"
import { liveOverlay, useServiceWarnings, warningHeadline, warningMarkers } from "../../data/boardLive"
import { BOARD_SERVICES, SB_DEFAULT_STATE, boardRoute } from "../../data/boardSamples"
import { BOARD_STATES, type BoardStateId } from "../../data/boardTypes"
import { WarningsSummary } from "../../components/board/WarningsSummary"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { useCctvCameras } from "../../data/cctvLive"
import { useKhoaLive } from "../../data/khoaLive"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { riskMarkers } from "../../data/mockDashboard"
import { useServiceStatusCards } from "../../data/useServiceStatusCards"
import { DOMAIN_CONFIGS } from "./domainConfigs"

/**
 * 도메인 화면 — demo-10 클론의 재난 유형 상세 틀(지도 전면 + 좌측 세로 탭 패널 + 우측 패널 + 하단 서비스 스트립).
 * 좌측 세로 탭은 앱 도메인 하위 메뉴 그대로이고, 각 탭 아래 "상세 화면 →"이 기존 화면(승인·발송 등 동작)으로 이어진다.
 */
export function DomainBoardPage({ domain }: { domain: string }) {
  const serviceStatusCards = useServiceStatusCards()
  const build = DOMAIN_CONFIGS[domain]
  const sheltersLoaded = useHeatShelters()
  const khoaLoaded = useKhoaLive() // 해양조사원 실측이 도착하면 설정(탭 내용)을 다시 만든다
  // eslint-disable-next-line react-hooks/exhaustive-deps -- khoaLoaded·sheltersLoaded만 재계산 트리거로 씀(build 안에서 안 읽음)
  const config = useMemo(() => (build ? build() : null), [build, khoaLoaded, sheltersLoaded])
  const cctvCameras = useCctvCameras()
  const [params, setParams] = useSearchParams()
  const [boardState, setBoardState] = useState<BoardStateId>(SB_DEFAULT_STATE)
  const warn = useServiceWarnings(config?.wrn.codes) // 기상청 특보(최근 24시간 발표분) — 있으면 평시 값 위에 얹는다
  const facts = useBoardFacts(domain, true) // 서비스별 실제 값(우량·태풍·예보·지진·해양관측 등) — 스테이징도 샘플 위에 덮어쓴다
  const [mapTopRef, mapTopHeight] = useElementHeight<HTMLDivElement>()
  const [stripOpen, setStripOpen] = useState(true)

  if (!config) return <Navigate to="/dashboard" replace />

  // 좌측 3묶음(Figma 3단계) — 대시보드 · 관측·판단 · 이력·보고. 예전 대응·조치 탭(경보 발송·출동·통제)은 우측 대응 패널로 옮겼고,
  // 데이터 수집·연계 시스템은 운영 > 데이터 시스템 연계현황에서 서비스별로 본다(2026-10-02)
  const svc = BOARD_SERVICES[domain]
  if (!svc) return <Navigate to="/dashboard" replace />
  const live = liveOverlay(svc, warn, facts, boardState)
  const NOT_OBS = new Set(["home", "data", "alert", "alerts", "dispatch", "control", "closure"])
  // 산불·지진해일·대설은 상세 분석과 실시간 연동이 같은 특보·참고 패널을 두 번 그려서, 실시간 연동 쪽(예보까지 있음)만 보인다
  const HAZARD = domain === "wildfire" || domain === "tsunami" || domain === "snow"
  const obsTabs = config.tabs.filter((t) => !NOT_OBS.has(t.key) && !HAZARD)
  // 예보·특보·해양 관측 같은 실시간 패널은 관측·판단으로 모은다(예전 우측 "실시간 연동"·"해양 관측" 탭)
  const obsLive = config.right.filter((t) => t.key === "live" || t.key === "buoy")
  const leftTabs: DockTab[] = [
    {
      key: "home",
      label: "대시보드",
      content: (
        <>
          <BoardDashboard service={svc} state={boardState} live={live?.dash} />
          <DetailLink to={boardRoute(svc, "home")}>대시보드 상세 화면</DetailLink>
        </>
      ),
    },
    {
      key: "obs",
      label: "관측·판단",
      content: (
        <>
          {!config.right.some((t) => t.key === "live") && <WarningsSummary {...config.wrn} />}
          {obsTabs.map((t) => (
            <Group key={t.key} title={t.label}>
              {t.content}
              <DetailLink to={t.to}>{t.label} 상세 화면</DetailLink>
            </Group>
          ))}
          {obsLive.map((t) => (
            <Group key={t.key} title={t.label}>
              {t.content}
            </Group>
          ))}
          {HAZARD && <DetailLink to={boardRoute(svc, "analysis")}>상세 분석 상세 화면</DetailLink>}
        </>
      ),
    },
    { key: "history", label: "이력·보고", content: <BoardHistory service={svc} state={boardState} /> },
  ]
  const activeKey = leftTabs.some((t) => t.key === params.get("tab")) ? (params.get("tab") as string) : leftTabs[0].key
  const baseMarkers = riskMarkers.filter((m) => m.domain === config.mapDomain)
  // 지도 — 이 서비스에 원래 점이 없으면(호우 등) 기상청 특보가 발표된 시와 서비스별 실제 관측 점을 찍는다(스테이징도 같다).
  // 스테이징은 샘플 상태에 맞춘 샘플 점을 하나 더 찍되, 실제 점이 하나라도 있으면 실제 점만 보인다.
  const factMarker: RiskMarker[] = (facts?.markers ?? []).map((m, i) => ({ id: `fact-${svc.id}-${i}`, name: m.name, x: 0, y: 0, level: m.level, domain: config.mapDomain, lat: m.lat, lng: m.lng, value: m.value }))
  // 폭염은 받아 둔 무더위쉼터를 읍·면 대표점에 개수로 모아 찍는다(쉼터 자료에 좌표가 없다 — heatMapMarkers.ts)
  const shelterDots = svc.id === "heat" && sheltersLoaded ? shelterMarkers(heatShelters, config.mapDomain) : []
  const realMarkers = [...baseMarkers, ...warningMarkers(warn, config.mapDomain), ...factMarker, ...shelterDots]
  const markers: RiskMarker[] =
    IS_STAGING && boardState !== "calm" && realMarkers.length === 0
      ? [{ id: `sample-${svc.id}`, name: `${svc.title} 샘플 지점`, x: 0, y: 0, level: boardState === "closed" ? "safe" : boardState === "detect" ? "warning" : "alert", domain: config.mapDomain, lat: 33.4996, lng: 126.5312 }]
      : realMarkers
  const realHeadline = warningHeadline(warn) ?? facts?.headline
  const headline =
    IS_STAGING && boardState !== "calm" && !realHeadline
      ? `${svc.title} — 샘플 상태: ${BOARD_STATES.find((s) => s.id === boardState)?.label} (${svc.right[boardState].head.label})`
      : (realHeadline ?? config.headline)

  return (
    <main className="stage" id="main-content" tabIndex={-1}>
      <div className="stage__main">
        <div className="map map--dark" />
        <div className="overlay">
          <SideTabsDock
            tabs={leftTabs}
            rail="right"
            activeKey={activeKey}
            onSelect={(key) => setParams({ tab: key }, { replace: true })}
            headExtra={
              <>
                <span className="risk risk--offline" style={{ background: "none" }}>{config.title}</span>
                {IS_STAGING && boardState !== "calm" && activeKey !== "obs" && <SpSample />}
              </>
            }
          />

          <div className="center center--gis">
            <div className="jmap" style={{ pointerEvents: "auto" }}>
              <JejuTileMap
                markers={markers}
                cctvMarkers={cctvCameras}
                className="relative h-full w-full"
                toolbarAtBottom
                toolbarTop={mapTopHeight + 16}
              />
            </div>
            <div className="map-top" ref={mapTopRef}>
              <p
                className="weather-line"
                style={{ padding: "6px 14px", background: "var(--background)", border: "1px solid var(--foreground-faint)", borderRadius: 9999 }}
              >
                {headline}
              </p>
            </div>
            <div />
            <div className="timebar">
              <div className="risk-legend">
                범례{" "}
                {(["danger", "alert", "warning", "safe"] as const).map((level) => (
                  <Risk key={level} level={level} />
                ))}
              </div>
            </div>
          </div>

          <BoardResponsePanel service={svc} state={boardState} onState={setBoardState} live={live?.right} />
        </div>
        <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
        <MessengerFab />
      </div>
      {stripOpen && <ServiceStrip cards={serviceStatusCards} currentId={config.id} />}
    </main>
  )
}
