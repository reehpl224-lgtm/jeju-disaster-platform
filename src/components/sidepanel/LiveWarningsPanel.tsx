import { useMemo } from "react"
import { NULL_SRC_NOTE, useSidePanelEvents } from "../../data/useSidePanelEvents"
import { SpLive, SpSample } from "./primitives"
import { fmtHM, pad2, spLevel } from "./spUtils"

/** L4 · 좌측 · 실시간 특보 — 기상청 API허브 특보(최근 24시간 발표 이력). 해제 여부는 이 API에 없다. 받은 값이 있으면 그 값, 없으면 샘플(프로토타입 "샘플 · 데이터 없음", 스테이징 "샘플"). */
export function LiveWarningsPanel() {
  const { mode, events, nullSources, fetchedAt } = useSidePanelEvents()
  const warningsNull = nullSources.includes("기상청 특보")
  const now = useMemo(() => new Date(), [])
  const list = events.filter((e) => e.category === "weather" && e.at.getTime() >= now.getTime() - 24 * 60 * 60 * 1000).sort((a, b) => b.at.getTime() - a.at.getTime())
  const warningsSample = list.length > 0 ? list.every((e) => e.sample) : warningsNull
  // 경보·주의보 건수는 아직 해제되지 않은 것만, 발표 합계는 이력 전체
  const live = list.filter((e) => e.status === "발령")
  const alerts = live.filter((e) => e.level === "alert" || e.level === "danger").length
  const cautions = live.filter((e) => e.level === "warning").length

  if (mode === "loading") return <p className="pempty">불러오는 중...</p>

  return (
    <div className="sp">
      <div className="sp-src">
        <span>출처 기상청 API허브</span>
        <span>갱신 {fetchedAt ? fmtHM(fetchedAt) : "-"}</span>
        <span>범위 제주 전체</span>
        <span>최근 24시간</span>
      </div>

      {(
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
            {warningsSample ? <SpSample noData={mode === "live"} /> : <SpLive />}
          </div>

          <div className="sp-dashed">
            <b>발표·변경·해제 이력입니다</b>
            <span className="sp-note">해제·변경된 특보는 "해제"로 표시 · 이 탭은 최근 24시간에 발표된 특보를 시간순으로 보여줍니다(발효 중인 것만 보려면 "발효중 특보" 탭)</span>
          </div>

          {list.length === 0 ? (
            <div className="sp-dashed sp-dashed--center">
              <b>{warningsNull ? "기상청 특보를 받지 못했습니다" : "최근 24시간 내 발표된 특보가 없습니다"}</b>
              <span className="sp-note">
                {warningsNull ? "데이터 없음 — 특보가 없다는 뜻이 아닙니다" : `"발효 특보 없음"으로 단정하지 않음 · 수신은 정상(${fetchedAt ? fmtHM(fetchedAt) : `${pad2(now.getHours())}:00`})`}
              </span>
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
                    <b>
                      {rest.length ? `${name} ${rest.join("")}` : name}
                      {e.sample && mode === "live" && <> <SpSample noData /></>}
                    </b>
                    <span>{e.detail.replace(" · 기상청 발표", "")}</span>
                    <small>
                      발표 {pad2(e.at.getMonth() + 1)}/{pad2(e.at.getDate())} {fmtHM(e.at)}
                      {e.status === "해제" && e.until && ` · ${e.detail.endsWith("변경") ? "변경" : "해제"} ${fmtHM(e.until)}`}
                    </small>
                  </div>
                  <span className="bd" style={{ background: e.status === "해제" ? "var(--foreground-subtle)" : lv === "alert" ? "var(--risk-alert)" : "var(--risk-warning)" }}>
                    {e.status === "해제" ? "해제" : e.level === "alert" ? "경보" : "주의보"}
                  </span>
                </div>
              )
            })
          )}
        </>
      )}
      <p className="sp-note">
        ※ 해제는 기상청 발표 구분(해제·변경)을 따릅니다 · 24시간보다 앞서 발표돼 지금도 유지 중인 특보는 이 창에 보이지 않을 수 있습니다.
        {mode === "staging" && warningsSample && " 스테이징 환경 — 받은 특보가 없어 임의의 값(샘플)을 보여줍니다."}
        {warningsNull && ` 데이터 없음: 기상청 특보 — ${NULL_SRC_NOTE}.`}
      </p>
    </div>
  )
}
