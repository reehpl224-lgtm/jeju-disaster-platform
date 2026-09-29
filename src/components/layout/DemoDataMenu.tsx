import { ACTIVE_SCENARIO_ID, SCENARIOS, setScenario } from "../../data/scenarios"
import { SCENARIO_NOW } from "../../data/scenarioClock"

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * 헤더의 "데모 데이터" 메뉴 — ① 이 화면의 값이 어떤 종류인지(시나리오 더미 / 실시간 API / 실측 스냅샷) 범례,
 * ② 시나리오 시각의 기준, ③ 시나리오 선택·초기화. 1차년도는 모든 데이터가 시연용이라는 것을 화면에서 늘 알 수 있게 한다.
 */
export function DemoDataMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const active = SCENARIOS.find((s) => s.id === ACTIVE_SCENARIO_ID) ?? SCENARIOS[0]
  const now = `${pad(SCENARIO_NOW.getHours())}:${pad(SCENARIO_NOW.getMinutes())}`
  const isDefault = active.id === "default"
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="demo-chip"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`데모 데이터 안내와 시나리오 선택 — 현재 ${active.label}`}
        data-open={open ? "" : undefined}
        onClick={onToggle}
      >
        <span aria-hidden>🧪</span>
        <span className="demo-chip__text">{isDefault ? "데모 데이터" : "시나리오 적용 중"}</span>
      </button>
      {open && (
        <div className="menu demo-menu" role="dialog" aria-label="데모 데이터와 시나리오">
          <p className="demo-menu__h">데모 데이터 안내</p>
          <p className="demo-menu__p">
            1차년도 실증용 프로토타입입니다. 화면의 사건·수치는 시나리오 더미이며 실제 상황이 아닙니다. 시각은 접속 시각({now}) 기준으로 맞춰집니다.
          </p>
          <ul className="demo-legend">
            <li>
              <span className="src-tag src-tag--dummy">*</span> 시나리오 더미 — 지어낸 값(제목 앞 *)
            </li>
            <li>
              <span className="src-tag src-tag--live">실시간</span> 기상청 등 API를 조회할 때마다 호출
            </li>
            <li>
              <span className="src-tag src-tag--snapshot">스냅샷</span> 실제 관측값이지만 자동 갱신 안 됨 — 기준 시각 표시
            </li>
          </ul>
          <p className="demo-menu__h">시나리오</p>
          {SCENARIOS.length <= 1 ? (
            <p className="demo-menu__p">
              등록된 시나리오가 없습니다. 지금은 모든 서비스가 평시인 빈 상태이며, 시나리오를 새로 만들면 여기에 선택지로 나타납니다.
            </p>
          ) : (
            <>
              <ul className="demo-scn" role="radiogroup" aria-label="시나리오 선택">
                {SCENARIOS.map((s) => (
                  <li key={s.id}>
                    <button type="button" role="radio" aria-checked={s.id === active.id} onClick={() => s.id !== active.id && setScenario(s.id)}>
                      <b>{s.label}</b>
                      <span>{s.summary}</span>
                      <em>{s.flow}</em>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="demo-menu__p">선택하면 화면을 새로 불러와 처음부터 적용합니다.</p>
            </>
          )}
          {!isDefault && (
            <button type="button" className="demo-reset" onClick={() => setScenario("default")}>
              초기화 — 기본 시나리오로 되돌리기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
