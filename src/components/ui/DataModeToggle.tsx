import { useDataMode } from "../../context/DataModeContext"

/**
 * 더미데이터 표시 ON/OFF 스위치. 헤더에서 전역으로 전환한다 — 화면별 실제 연결은 시나리오가
 * 확정되는 대로 순차 진행 중이라, 아직 연결 안 된 화면은 눌러도 그대로 보이는 게 정상이다.
 */
export function DataModeToggle() {
  const { mode, toggle } = useDataMode()
  const isData = mode === "data"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isData}
      title="더미데이터 표시 여부를 전환합니다 (화면별 반영은 순차 적용 중)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 24,
        padding: "0 10px",
        borderRadius: 9999,
        border: "1px solid var(--foreground-subtle)",
        color: "var(--foreground-muted)",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: isData ? "transparent" : "var(--risk-caution-bg)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: isData ? "var(--risk-safe)" : "var(--risk-caution)",
          flex: "0 0 auto",
        }}
      />
      {isData ? "더미데이터 표시 중" : "빈 화면 보기"}
    </button>
  )
}
