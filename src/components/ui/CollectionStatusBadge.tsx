import type { WeatherStationReading } from "../../types/heavyRain"
import { RiskBadge } from "./RiskBadge"

/** 수집 장애를 재난 위험등급과 구분해서 표시한다. */
export function CollectionStatusBadge({ status }: { status: WeatherStationReading["collectionStatus"] }) {
  if (!status || status === "정상") return null

  return <RiskBadge level={status === "지연" ? "caution" : "offline"} label={`수집 ${status}`} />
}
