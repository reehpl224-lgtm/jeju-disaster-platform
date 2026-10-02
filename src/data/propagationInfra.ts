import type { RiskLevel } from "../types/domain"
import { coastSafetyAssets } from "./mockCoast"
import { heavyRainAlertDispatch, legacySystems } from "./mockHeavyRain"

export interface PropagationInfraRow {
  id: string
  name: string
  status: string
  level: RiskLevel
  /** 값이 있을 때만 "성공률 n%" 형태로 — 가용률 실측이 없어 채널 발송 성공률로 대신한다 */
  rate: string
}

const LINK_LEVEL: Record<(typeof legacySystems)[number]["linkStatus"], RiskLevel> = {
  "연계 진행중": "info",
  "협의 중": "caution",
  미연계: "offline",
}

const NONE = (id: string, name: string): PropagationInfraRow => ({ id, name, status: "정보 없음", level: "offline", rate: "-" })

/**
 * 종합상황 '전파·경보 인프라 현황'(화면목록 S1-04) — 새 수치를 만들지 않고 기존 mock에서만 읽는다.
 * 연계 정보가 아직 없는 인프라(자동음성·UHD·PS-LTE)는 "정보 없음"으로 보여 준다.
 */
export function propagationInfra(): PropagationInfraRow[] {
  const board = heavyRainAlertDispatch.channels.find((c) => c.id === "hc-3")
  const civil = legacySystems.find((s) => s.id === "ls-5")
  const poles = coastSafetyAssets
  const polesOk = poles.filter((p) => p.status === "정상").length

  return [
    NONE("voice", "자동음성통보"),
    {
      id: "board",
      name: "재해문자전광판",
      status: board && board.sent > 0 ? "운영" : "발송 이력 없음",
      level: board && board.sent > 0 ? "safe" : "offline",
      rate: board && board.rate !== "-" ? `성공률 ${board.rate}` : "-",
    },
    civil
      ? { id: "civil", name: "민방위경보", status: civil.linkStatus, level: LINK_LEVEL[civil.linkStatus], rate: "-" }
      : NONE("civil", "민방위경보"),
    NONE("uhd", "UHD"),
    NONE("pslte", "PS-LTE"),
    poles.length > 0
      ? { id: "pole", name: "스마트폴", status: `정상 ${polesOk}/${poles.length}기`, level: polesOk === poles.length ? "safe" : "warning", rate: "-" }
      : { id: "pole", name: "스마트폴", status: "설치 정보 없음", level: "offline", rate: "-" },
  ]
}
