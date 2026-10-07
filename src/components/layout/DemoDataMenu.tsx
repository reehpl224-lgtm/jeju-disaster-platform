import { DUMMY_NOW } from "../../data/dummyClock"

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * 헤더의 "데모 데이터" 메뉴 — ① 이 화면의 값이 어떤 종류인지(더미 / 실시간 API / 실측 스냅샷) 범례,
 * ② 더미 시각의 기준. 1차년도는 모든 데이터가 시연용이라는 것을 화면에서 늘 알 수 있게 한다.
 */
export function DemoDataMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const now = `${pad(DUMMY_NOW.getHours())}:${pad(DUMMY_NOW.getMinutes())}`
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="demo-chip"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="데모 데이터 안내"
        data-open={open ? "" : undefined}
        onClick={onToggle}
      >
        <span aria-hidden>🧪</span>
        <span className="demo-chip__text">데모 데이터</span>
      </button>
      {open && (
        <div className="menu demo-menu" role="dialog" aria-label="데모 데이터">
          <p className="demo-menu__h">데모 데이터 안내</p>
          <p className="demo-menu__p">
            1차년도 실증용 프로토타입입니다. 화면의 사건·수치는 더미이며 실제 상황이 아닙니다. 시각은 접속 시각({now}) 기준으로 맞춰집니다.
          </p>
          <ul className="demo-legend">
            <li>
              <span className="src-tag src-tag--dummy">*</span> 더미 — 지어낸 값(제목 앞 *)
            </li>
            <li>
              <span className="sp-sample">샘플</span> 연동 전 임의 데이터 — 사이드패널 자리 확인용(실제 상황 아님)
            </li>
            <li>
              <span className="src-tag src-tag--live">실시간</span> 기상청 등 API를 조회할 때마다 호출
            </li>
            <li>
              <span className="src-tag src-tag--snapshot">스냅샷</span> 실제 관측값이지만 자동 갱신 안 됨 — 기준 시각 표시
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
