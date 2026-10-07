import { useMemo, useState } from "react"
import { useElementHeight } from "../../hooks/useElementHeight"
import { Navigate, useSearchParams } from "react-router-dom"
import { DetailLink } from "../../components/board/PanelParts"
import { HorizontalTabsDock, MessengerFab, Risk, ServiceStrip, SideTabsDock, StripToggle, type DockTab } from "../../components/board/BoardParts"
import { MessengerNotice } from "../../components/board/ComingSoon"
import { WarningsSummary } from "../../components/board/WarningsSummary"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { useCctvCameras } from "../../data/cctvLive"
import { useKhoaLive } from "../../data/khoaLive"
import { useHeatShelters } from "../../data/heatSheltersLive"
import { riskMarkers, serviceStatusCards } from "../../data/mockDashboard"
import { useRiverRun } from "../../data/riverRunHooks"
import { DOMAIN_CONFIGS } from "./domainConfigs"

/**
 * 도메인 화면 — demo-10 클론의 재난 유형 상세 틀(지도 전면 + 좌측 세로 탭 패널 + 우측 패널 + 하단 서비스 스트립).
 * 좌측 세로 탭은 앱 도메인 하위 메뉴 그대로이고, 각 탭 아래 "상세 화면 →"이 기존 화면(승인·발송 등 동작)으로 이어진다.
 */
export function DomainBoardPage({ domain }: { domain: string }) {
  const build = DOMAIN_CONFIGS[domain]
  const riverRunVersion = useRiverRun().version
  const sheltersLoaded = useHeatShelters()
  const khoaLoaded = useKhoaLive() // 해양조사원 실측이 도착하면 설정(탭 내용)을 다시 만든다
  // eslint-disable-next-line react-hooks/exhaustive-deps -- riverRunVersion·khoaLoaded만 재계산 트리거로 씀(build 안에서 안 읽음)
  const config = useMemo(() => (build ? build() : null), [build, riverRunVersion, khoaLoaded, sheltersLoaded])
  const cctvCameras = useCctvCameras()
  const [params, setParams] = useSearchParams()
  const [rightTab, setRightTab] = useState("tl")
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [mapTopRef, mapTopHeight] = useElementHeight<HTMLDivElement>()
  const [stripOpen, setStripOpen] = useState(true)

  if (!config) return <Navigate to="/dashboard" replace />

  // 데이터 수집·연계 시스템·실시간 연동은 보드에서 숨기고 운영 > 데이터 시스템 연계현황에서 서비스별로 본다(2026-10-02)
  // 하천범람의 "시나리오 실행"도 보드에서는 숨긴다 — 상세 대시보드 사이드바(RIVER_NAV)에는 그대로 둠
  const tabs = config.tabs.filter((t) => t.key !== "data" && t.key !== "scenario")
  const right = config.right.filter((t) => t.key !== "legacy" && t.key !== "live")
  const activeKey = tabs.some((t) => t.key === params.get("tab")) ? (params.get("tab") as string) : tabs[0].key
  const markers = riskMarkers.filter((m) => m.domain === config.mapDomain)

  const leftTabs: DockTab[] = tabs.map((t) => ({
    key: t.key,
    label: t.label,
    content: (
      <>
        {t.content}
        {/* 모든 탭의 상세 화면은 같은 상세 창에서 열린다 — 보드 창은 그대로 유지(2026-09-28) */}
        <DetailLink to={t.to}>{t.label} 상세 화면</DetailLink>
      </>
    ),
  }))
  const rightTabs: DockTab[] = right.map((t) => ({
    key: t.key,
    label: t.label,
    // 타임라인 맨 위에 이 서비스의 특보 요약을 둔다(2026-10-02)
    content:
      t.key === "tl" ? (
        <>
          <WarningsSummary {...config.wrn} />
          {t.content}
        </>
      ) : (
        t.content
      ),
  }))

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
            dense={leftTabs.length > 6}
            headExtra={<span className="risk risk--offline" style={{ background: "none" }}>{config.title}</span>}
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

          <HorizontalTabsDock tabs={rightTabs} activeKey={rightTab} onSelect={setRightTab} />
        </div>
        <StripToggle open={stripOpen} onToggle={() => setStripOpen((v) => !v)} />
      </div>
      {stripOpen && <ServiceStrip cards={serviceStatusCards} currentId={config.id} />}
      <MessengerFab onClick={() => setMessengerOpen((v) => !v)} />
      {messengerOpen && <MessengerNotice onClose={() => setMessengerOpen(false)} />}
    </main>
  )
}
