import { useMemo } from "react"
import { useSidePanelEvents } from "../../data/useSidePanelEvents"
import { SpLive } from "./primitives"
import { fmtHM, pad2, spLevel } from "./spUtils"

/** L4 · 좌측 · 실시간 특보 — 기상청 API허브 특보(최근 24시간 발표 이력). 해제 여부는 이 API에 없다. 실데이터가 없으면 샘플. */
export function LiveWarningsPanel() {
  const { mode, events, warningsError, fetchedAt } = useSidePanelEvents()
  const now = useMemo(() => new Date(), [])
  const list = events.filter((e) => e.category === "weather" && e.at.getTime() >= now.getTime() - 24 * 60 * 60 * 1000).sort((a, b) => b.at.getTime() - a.at.getTime())
  const alerts = list.filter((e) => e.level === "alert" || e.level === "danger").length
  const cautions = list.filter((e) => e.level === "warning").length
  const showError = warningsError !== null // 특보를 못 받은 것은 '발표 없음'이 아니다

  if (mode === "loading") return <p className="pempty">불러오는 중...</p>

  return (
    <div className="sp">
      <div className="sp-src">
        <span>출처 기상청 API허브</span>
        <span>갱신 {fetchedAt ? fmtHM(fetchedAt) : "-"}</span>
        <span>범위 제주 전체</span>
        <span>최근 24시간</span>
      </div>

      {showError ? (
        <div className="sp-error">
          <b>특보를 불러오지 못했습니다</b>
          <p className="sp-sub" style={{ margin: "6px 0 0" }}>
            수신 실패는 '특보 없음'이 아닙니다 · {fetchedAt ? `마지막 정상 수신 ${fmtHM(fetchedAt)} (${Math.max(0, Math.round((now.getTime() - fetchedAt.getTime()) / 60000))}분 전)` : "아직 정상 수신한 적이 없습니다"} · {warningsError}
          </p>
        </div>
      ) : (
        <>
          <div className="sp-stats">
            <div className="sp-bigstat">
              <small>경보</small>
              <b className="sp-c--alert">{alerts}</b>
            </div>
            <div className="sp-bigstat">
              <small>주의보</small>
              <b className="sp-c--warning">{cautions}</b>
            </div>
            <div className="sp-bigstat">
              <small>발표 합계</small>
              <b>{list.length}</b>
            </div>
          </div>

          <div className="sp-row">
            <h3 className="sp-h" style={{ margin: 0, fontSize: 15 }}>
              기상특보 · 발표 이력
            </h3>
            <SpLive />
          </div>

          <div className="sp-dashed">
            <b>발표 이력이며 해제는 반영되지 않습니다</b>
            <span className="sp-note">현재 발효 중 여부는 "발효중 특보" 탭 · 이 탭은 최근 24시간에 발표된 특보를 시간순으로 보여줍니다</span>
          </div>

          {list.length === 0 ? (
            <div className="sp-dashed sp-dashed--center">
              <b>최근 24시간 내 발표된 특보가 없습니다</b>
              <span className="sp-note">"발효 특보 없음"으로 단정하지 않음 · 수신은 정상({fetchedAt ? fmtHM(fetchedAt) : `${pad2(now.getHours())}:00`})</span>
            </div>
          ) : (
            list.map((e) => {
              const lv = spLevel(e.level)
              const [name, ...rest] = e.title.replace(" (기상특보)", "").split(/(?=경보|주의보)/)
              return (
                <div className="sp-warn" key={e.id}>
                  <span className={`ic sp-lv--${lv}`} aria-hidden>
                    {e.icon}
                  </span>
                  <div className="tx">
                    <b>{rest.length ? `${name} ${rest.join("")}` : name}</b>
                    <span>{e.detail.replace(" · 기상청 발표", "")}</span>
                    <small>
                      발표 {pad2(e.at.getMonth() + 1)}/{pad2(e.at.getDate())} {fmtHM(e.at)}
                    </small>
                  </div>
                  <span className="bd" style={{ background: lv === "alert" ? "var(--risk-alert)" : "var(--risk-warning)" }}>
                    {e.level === "alert" ? "경보" : "주의보"}
                  </span>
                </div>
              )
            })
          )}
        </>
      )}
      <p className="sp-note">
        ※ 발표 이력에는 이미 해제된 특보가 섞여 있을 수 있습니다 · 기상청 API허브 실연동 — 해제 여부는 별도 확인 안 됨.
      </p>
    </div>
  )
}
