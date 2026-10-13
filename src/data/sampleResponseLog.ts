import { useMemo } from "react"
import { IS_STAGING } from "./appMode"
import { useResponseLog } from "./responseLog"
import { addLog, advanceOrder, closeIncident, emptyStore, issueOrder, type ResponseStore } from "./responseLogic"

/**
 * 사건 이력 샘플 — 스테이징 전용. 기록이 하나도 없으면 이력 조회·분석 화면이 비어 보여서 구성을 확인할 수 있게 종료된 사건 하나를 둔다.
 * 이 사건은 코드에서 만든 읽기 전용 값이고 브라우저에 저장되지 않는다. 프로토타입·로컬에는 없다(기록이 없으면 비어 있음).
 */
const at = (h: number, m: number) => new Date(2026, 9, 12, h, m)
function build(): ResponseStore {
  let s = emptyStore()
  const by = "김상황(재난상황실 운영자)"
  s = addLog(s, "river", { kind: "감지", text: "효돈천(돈내코) 유량비 61% — 경계 기준 접근", by }, at(9, 12))
  s = addLog(s, "river", { kind: "판단", text: "상황판단 회의 — 경계 단계 대응 결정", by }, at(9, 20))
  s = issueOrder(s, "river", { title: "효돈천 하천변 출입 통제·안내 문자 발송", assignee: "행정시 상황실·읍면동", dept: "하천 소관 부서" }, by, at(9, 25))
  const id = s.orders[0].id
  s = advanceOrder(s, id, "전달", by, at(9, 26))
  s = advanceOrder(s, id, "수행 중", "박현장(현장 시설 운영자)", at(9, 32))
  s = advanceOrder(s, id, "완료", "박현장(현장 시설 운영자)", at(9, 58), "통제선 설치, 안내 문자 발송 완료")
  s = addLog(s, "river", { kind: "메모", text: "수위 하강 확인 — 대응 인력 철수 준비", by: "박현장(현장 시설 운영자)" }, at(11, 5))
  return closeIncident(s, "river", by, at(11, 40))
}
export const SAMPLE_RESPONSE_LOG: ResponseStore = build()
export const SAMPLE_INCIDENT_IDS = new Set(SAMPLE_RESPONSE_LOG.incidents.map((i) => i.id))

/** 이력 조회 화면용 — 저장된 기록이 있으면 그 기록, 스테이징은 샘플 사건을 함께 보여준다 */
export function useResponseView(): ResponseStore {
  const stored = useResponseLog()
  return useMemo(
    () =>
      IS_STAGING
        ? {
            incidents: [...SAMPLE_RESPONSE_LOG.incidents, ...stored.incidents],
            orders: [...SAMPLE_RESPONSE_LOG.orders, ...stored.orders],
            logs: [...SAMPLE_RESPONSE_LOG.logs, ...stored.logs],
          }
        : stored,
    [stored],
  )
}
