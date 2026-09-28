import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

/**
 * "데이터 있는 버전 / 없는 버전" 전환용 배관(plumbing). 2026-09-28 사용자 요청 —
 * 시나리오별 화면 구성 작업에 앞서 매커니즘만 먼저 준비한 것.
 *
 * mode="empty"일 때 각 화면이 정확히 무엇을 비울지(어떤 필드를 0/safe로 둘지)는 아직 대부분
 * 연결되지 않았다 — 시나리오가 확정되는 화면부터 useModeValue()로 순차 연결한다. 아직 연결 안 된
 * 화면은 토글을 눌러도 계속 기존 더미데이터가 그대로 보이는 게 정상이다(버그 아님).
 */
export type DataMode = "data" | "empty"

const STORAGE_KEY = "jeju-ax:data-mode"

interface DataModeContextValue {
  mode: DataMode
  isEmpty: boolean
  setMode: (mode: DataMode) => void
  toggle: () => void
}

const DataModeContext = createContext<DataModeContextValue | null>(null)

function readInitialMode(): DataMode {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "empty" ? "empty" : "data"
  } catch {
    return "data"
  }
}

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>(readInitialMode)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // sessionStorage 접근 불가 환경(프라이빗 모드 등) — 상태는 메모리에만 유지
    }
  }, [mode])

  const value = useMemo<DataModeContextValue>(
    () => ({
      mode,
      isEmpty: mode === "empty",
      setMode,
      toggle: () => setMode((m) => (m === "data" ? "empty" : "data")),
    }),
    [mode],
  )

  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>
}

export function useDataMode() {
  const ctx = useContext(DataModeContext)
  if (!ctx) throw new Error("useDataMode는 DataModeProvider 하위에서만 사용할 수 있습니다.")
  return ctx
}

/**
 * 화면 코드에서 쓰는 실제 연결 지점. 더미데이터 값과 "빈 화면"용 값을 같이 넘기면 현재 모드에 맞는
 * 쪽을 반환한다. emptyValue를 아직 안 만든 곳은 두 번째 인자를 생략하면 데이터 모드값이 그대로
 * 나오므로, 화면마다 시나리오가 정해지는 대로 하나씩 연결하면 된다(전면 개조 불필요).
 *
 *   const alerts = useModeValue(disasterAlerts, [])
 *   const grade = useModeValue(aquaResponseState.grade, "정상")
 */
export function useModeValue<T>(dataValue: T, emptyValue?: T): T {
  const { isEmpty } = useDataMode()
  return isEmpty && emptyValue !== undefined ? emptyValue : dataValue
}
