import type { ReactNode } from "react"
import type { RiskLevel } from "../../types/domain"
import { IS_STAGING } from "../../data/appMode"
import { spLevel } from "./spUtils"

export function SpRisk({ level, children }: { level: RiskLevel; children: ReactNode }) {
  return <span className={`sp-risk sp-risk--${spLevel(level)}`}>{children}</span>
}

/**
 * "샘플" 표식 — 임의 데이터라는 뜻. 실제 상황이 아니다(스테이징에서만 값이 깔린다).
 * noData면 "데이터 없음" — 받은 데이터가 없다는 표식. 프로토타입·로컬은 이때 샘플 숫자를 깔지 않고 값을 비워 둔다.
 */
export function SpSample({ noData, title }: { noData?: boolean; title?: string }) {
  return (
    <span className="sp-sample" title={title ?? (noData ? "받은 데이터가 없어 값을 비워 두었습니다" : "임의 데이터입니다 — 실제 상황이 아닙니다")}>
      {noData ? "데이터 없음" : "샘플"}
    </span>
  )
}

/** 입력 패널에서 사용자가 직접 넣은 값이라는 표식 — 실제 관측·발표 데이터가 아니다 */
export function SpInputTag() {
  return (
    <span className="sp-sample sp-sample--input" title="입력 패널에서 직접 넣은 값입니다 — 이 브라우저에만 저장됩니다">
      입력값
    </span>
  )
}

/** 영역(part)의 출처 표식 — 샘플이면 "샘플", 입력값이면 "입력값". 탭 전체가 샘플이면 머리 제목 옆에 한 번만 달고 영역에는 생략한다 */
export function PartTag({ sample, fully }: { sample: boolean; fully: boolean }) {
  if (sample) return fully ? null : <SpSample noData={!IS_STAGING} />
  return <SpInputTag />
}

export function SpLive() {
  return <span className="sp-live">실시간</span>
}
