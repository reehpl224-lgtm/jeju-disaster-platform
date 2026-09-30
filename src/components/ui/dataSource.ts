import { khoaBuoyMarineConditions } from "../../data/mockKhoaBuoy"
import { khoaLiveObservations } from "../../data/mockAqua"
import { khoaMoseulpoTide } from "../../data/mockRiver"

/** 데이터 종류 표식 — SourceTag가 그린다. 시나리오 더미는 제목 앞 "*"(dummy)로 따로 구분한다 */
export type DataSource = { kind: "live" } | { kind: "snapshot"; asOf: string } | { kind: "simulated" }

export const LIVE: DataSource = { kind: "live" }
/** 스테이징(VITE_DATA_MODE=simulation)에서 실호출 대신 모의값을 쓰는 패널의 표식 — 실제 기관 발표로 오인되지 않게 한다 */
export const SIMULATED: DataSource = { kind: "simulated" }

/** "2026-09-09 15:00" → "2026.09.09 15:00" — 스냅샷 기준 시각은 실제 관측 시각이라 시나리오 시계로 옮기지 않는다 */
const asOf = (observedAt: string | undefined): DataSource => ({ kind: "snapshot", asOf: observedAt ? observedAt.slice(0, 16).replace(/-/g, ".") : "" })

/** 가장 오래된 관측 시각을 기준으로 삼는다(여러 지점이 섞여 있을 때 "이 시각 이후 값"으로 읽히지 않게) */
const oldest = (times: string[]) => [...times].sort()[0]

export const KHOA_BUOY_SNAPSHOT = asOf(oldest(khoaBuoyMarineConditions.map((b) => b.observedAt)))
export const KHOA_OBS_SNAPSHOT = asOf(oldest(khoaLiveObservations.map((o) => o.observedAt)))
export const KHOA_TIDE_SNAPSHOT = asOf(khoaMoseulpoTide.observedAt)
