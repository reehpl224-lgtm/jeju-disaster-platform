import { useMemo, useState } from "react"
import { useElementHeight } from "../../hooks/useElementHeight"
import { Navigate, useSearchParams } from "react-router-dom"
import { DetailLink } from "../../components/board/PanelParts"
import { HorizontalTabsDock, MessengerFab, Risk, ServiceStrip, SideTabsDock, StripToggle, type DockTab } from "../../components/board/BoardParts"
import { JejuTileMap } from "../../components/ui/JejuTileMap"
import { cctvCameras } from "../../data/mockCctv"
import { riskMarkers, serviceStatusCards } from "../../data/mockDashboard"
import { DOMAIN_CONFIGS } from "./domainConfigs"

/**
 * 도메인 화면 — demo-10 클론의 재난 유형 상세 틀(지도 전면 + 좌측 세로 탭 패널 + 우측 패널 + 하단 서비스 스트립).
 * 좌측 세로 탭은 앱 도메인 하위 메뉴 그대로이고, 각 탭 아래 "상세 화면 →"이 기존 화면(승인·발송 등 동작)으로 이어진다.
 */
export function DomainBoardPage({ domain }: { domain: string }) {
  const build = DOMAIN_CONFIGS[domain]
  const config = useMemo(() => (build ? build() : null), [build])
  const [params, setParams] = useSearchParams()
  const [rightTab, setRightTab] = useState("tl")
  const [mapTopRef, mapTopHeight] = useElementHeight<HTMLDivElement>()
  const [stripOpen, setStripOpen] = useState(true)

  if (!config) return <Navigate to="/dashboard" replace />

  const activeKey = config.tabs.some((t) => t.key === params.get("tab")) ? (params.get("tab") as string) : config.tabs[0].key
  const markers = riskMarkers.filter((m) => m.domain === config.mapDomain)

  const leftTabs: DockTab[] = config.tabs.map((t) => ({
    key: t.key,
    label: t.label,
    content: (
      <>
        {t.content}
        <DetailLink to={t.to}>{t.label} 상세 화면</DetailLink>
      </>
    ),
  }))
  const rightTabs: DockTab[] = config.right.map((t) => ({ key: t.key, label: t.label, content: t.content }))

  return (
    <div className="stage">
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
                toolbarTop={mapTopHeight + 8}
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
      <MessengerFab onClick={() => setRightTab(config.right[0].key)} />
    </div>
  )
}
