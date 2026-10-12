import { useMemo, useState } from "react"
import { useElementHeight } from "../../hooks/useElementHeight"
import { Navigate, useSearchParams } from "react-router-dom"
import { DetailLink, Group } from "../../components/board/PanelParts"
import { MessengerFab, Risk, ServiceStrip, SideTabsDock, StripToggle, type DockTab } from "../../components/board/BoardParts"
import { BoardDashboard, BoardHistory, BoardResponsePanel } from "../../components/board/BoardPanels"
import { SpSample } from "../../components/sidepanel/primitives"
import { IS_STAGING } from "../../data/appMode"
import { BOARD_SERVICES, SB_DEFAULT_STATE, boardRoute } from "../../data/boardSamples"
import type { BoardStateId } from "../../data/boardTypes"
import { MessengerNotice } from "../../components/board/ComingSoon"
import { WarningsSummary } from "../../components/board/WarningsSummary"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { useCctvCameras } from "../../data/cctvLive"
import { useKhoaLive } from "../../data/khoaLive"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { riskMarkers, serviceStatusCards } from "../../data/mockDashboard"
import { DOMAIN_CONFIGS } from "./domainConfigs"

/**
 * 도메인 화면 — demo-10 클론의 재난 유형 상세 틀(지도 전면 + 좌측 세로 탭 패널 + 우측 패널 + 하단 서비스 스트립).
 * 좌측 세로 탭은 앱 도메인 하위 메뉴 그대로이고, 각 탭 아래 "상세 화면 →"이 기존 화면(승인·발송 등 동작)으로 이어진다.
 */
export function DomainBoardPage({ domain }: { domain: string }) {
  const build = DOMAIN_CONFIGS[domain]
  const sheltersLoaded = useHeatShelters()
  const khoaLoaded = useKhoaLive() // 해양조사원 실측이 도착하면 설정(탭 내용)을 다시 만든다
  // eslint-disable-next-line react-hooks/exhaustive-deps -- khoaLoaded·sheltersLoaded만 재계산 트리거로 씀(build 안에서 안 읽음)
  const config = useMemo(() => (build ? build() : null), [build, khoaLoaded, sheltersLoaded])
  const cctvCameras = useCctvCameras()
  const [params, setParams] = useSearchParams()
  const [boardState, setBoardState] = useState<BoardStateId>(SB_DEFAULT_STATE)
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [mapTopRef, mapTopHeight] = useElementHeight<HTMLDivElement>()
  const [stripOpen, setStripOpen] = useState(true)

  if (!config) return <Navigate to="/dashboard" replace />

  // 좌측 3묶음(Figma 3단계) — 대시보드 · 관측·판단 · 이력·보고. 예전 대응·조치 탭(경보 발송·출동·통제)은 우측 대응 패널로 옮겼고,
  // 데이터 수집·연계 시스템은 운영 > 데이터 시스템 연계현황에서 서비스별로 본다(2026-10-02)
  const svc = BOARD_SERVICES[domain]
  if (!svc) return <Navigate to="/dashboard" replace />
  const NOT_OBS = new Set(["home", "data", "alert", "alerts", "dispatch", "control", "closure"])
  const obsTabs = config.tabs.filter((t) => !NOT_OBS.has(t.key))
  // 예보·특보·해양 관측 같은 실시간 패널은 관측·판단으로 모은다(예전 우측 "실시간 연동"·"해양 관측" 탭)
  const obsLive = config.right.filter((t) => t.key === "live" || t.key === "buoy")
  const leftTabs: DockTab[] = [
    {
      key: "home",
      label: "대시보드",
      content: (
        <>
          <BoardDashboard service={svc} state={boardState} />
          <DetailLink to={boardRoute(svc, "home")}>대시보드 상세 화면</DetailLink>
        </>
      ),
    },
    {
      key: "obs",
      label: "관측·판단",
      content: (
        <>
          <WarningsSummary {...config.wrn} />
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
        </>
      ),
    },
    { key: "history", label: "이력·보고", content: <BoardHistory service={svc} state={boardState} /> },
  ]
  const activeKey = leftTabs.some((t) => t.key === params.get("tab")) ? (params.get("tab") as string) : leftTabs[0].key
  const markers = riskMarkers.filter((m) => m.domain === config.mapDomain)

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
                {config.headline}
              </p>
            </div>
            <div />
            <div className="timebar">
              <div className="risk-legend">
                범례{" "}
                {(["danger", "alert", "warning", "caution", "safe"] as const).map((level) => (
                  <Risk key={level} level={level} />
                ))}
              </div>
            </div>
          </div>

          <BoardResponsePanel service={svc} state={boardState} onState={setBoardState} />
        </div>
        <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
      </div>
      {stripOpen && <ServiceStrip cards={serviceStatusCards} currentId={config.id} />}
      <MessengerFab onClick={() => setMessengerOpen((v) => !v)} />
      {messengerOpen && <MessengerNotice onClose={() => setMessengerOpen(false)} />}
    </main>
  )
}
