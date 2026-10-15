import type { ServiceId } from "./rolesLogic"
import type { EsopLevel } from "./esopLogic"

/**
 * 상황 전파 업무 메시지 구조 — 요구사항 '상황 전파'(이벤트 유형별 사용자 맞춤 전파 화면과 업무 메시지 구조).
 * 도 재난대응 매뉴얼의 재난문자 송출 기준·채널 구분·문안 구조(시각·지역·상황·행동 지시·기관명)·글자 수 제한을 일반화한 것이다.
 * 문안은 구조를 보이기 위한 예시이고 실제 발송은 하지 않는다. 순수 계산만 둔다(화면·저장 없음).
 */
export type MsgKind = "bulletin" | "advice" | "order" | "release"
export type MsgChannel = "안전안내" | "긴급재난"

export const MSG_KINDS: { id: MsgKind; label: string; channel: MsgChannel; note: string }[] = [
  { id: "bulletin", label: "특보 발효", channel: "안전안내", note: "주의보·경보 발효 사실과 행동 요령" },
  { id: "advice", label: "사전대피 권고", channel: "안전안내", note: "행정처분 효력이 없는 선제적 보호조치" },
  { id: "order", label: "대피명령 발령", channel: "긴급재난", note: "발령 시 시간과 관계없이 송출, 불응 시 과태료 안내 포함" },
  { id: "release", label: "대피명령 해제", channel: "안전안내", note: "발령 때 쓴 수단으로 해제 안내" },
]

/** 재난문자·방송 글자 수 제한 */
export const MSG_LIMITS = [
  { id: "cbs", label: "휴대폰 재난문자(CBS)", max: 90 },
  { id: "dmb", label: "DMB", max: 400 },
  { id: "broadcast", label: "재난방송(TV 자막·라디오)", max: 500 },
] as const

interface TypeText {
  /** 문안에 쓰는 재난 이름 */
  name: string
  /** 특보 서비스인가 — 그렇다면 단계를 주의보·경보로 적는다 */
  bulletin: boolean
  region: string
  act: string
  rule: string
}

const TYPE_TEXT: Partial<Record<ServiceId, TypeText>> = {
  "heavy-rain": { name: "호우", bulletin: true, region: "제주시·서귀포시", act: "저지대·하천변·지하공간 접근 금지, 안전한 곳으로 대피", rule: "호우 주의보·경보는 주간(06~21시)에 보내고 야간(21시~익일 06시)에는 경보만 보냅니다. 기상청은 1시간 50mm와 3시간 90mm 동시 또는 1시간 72mm 이상이면 직접 긴급재난문자를 보냅니다." },
  typhoon: { name: "태풍", bulletin: true, region: "제주도 전역", act: "해안·항포구 접근 금지, 선박 결박, 외출 자제", rule: "태풍 주의보·경보는 주간에 보내고 야간에는 경보만 보냅니다." },
  snow: { name: "대설", bulletin: true, region: "산간·중산간 도로", act: "도로 결빙 주의, 불필요한 외출 자제", rule: "대설 주의보·경보는 주간에 보내고 야간에는 경보만 보냅니다." },
  tsunami: { name: "폭풍해일", bulletin: true, region: "제주 해안 저지대", act: "해안 저지대·방파제에서 높은 곳으로 즉시 대피", rule: "폭풍해일은 경보를 보냅니다." },
  river: { name: "하천 범람", bulletin: false, region: "서귀포시 효돈천 일대", act: "하천변·세월교 접근 금지, 인근 주민은 높은 곳으로 대피", rule: "서비스 단계 기준입니다. 공식 송출 기준은 도청 확인 전입니다." },
  coast: { name: "연안 위험", bulletin: false, region: "함덕·협재 해수욕장", act: "해수욕장·갯바위·방파제 접근과 입수 금지", rule: "서비스 단계 기준입니다. 공식 송출 기준은 도청 확인 전입니다." },
  aqua: { name: "저염분·고수온", bulletin: false, region: "한경·대정 양식장", act: "취수 조절과 비상 대응 장비 점검", rule: "서비스 단계 기준입니다. 공식 송출 기준은 도청 확인 전입니다." },
}

export const MSG_SERVICES = Object.keys(TYPE_TEXT) as ServiceId[]
export const msgTypeName = (svc: ServiceId) => TYPE_TEXT[svc]?.name ?? svc
export const msgDefaultRegion = (svc: ServiceId) => TYPE_TEXT[svc]?.region ?? ""
export const msgRule = (svc: ServiceId) => TYPE_TEXT[svc]?.rule ?? ""
export const COMMON_RULE = "대피명령을 발령할 때는 시간과 관계없이 보냅니다. 위급재난은 민방공 경보라 쓰지 않고, 대피명령은 긴급재난, 나머지는 안전안내 채널입니다."

/** 단계 → 문안에 적는 등급 이름 */
export function gradeText(svc: ServiceId, level: EsopLevel): string {
  if (TYPE_TEXT[svc]?.bulletin) return level === "warning" ? "주의보" : "경보"
  return `${level === "warning" ? "주의" : level === "alert" ? "경계" : "심각"} 단계`
}

/** 문안 한 건을 만든다 — [기관] 시각 지역 상황. 행동 지시 */
export function buildMessage(svc: ServiceId, kind: MsgKind, level: EsopLevel, region: string, at: string): string {
  const t = TYPE_TEXT[svc]
  if (!t) return ""
  const head = `[제주도] ${at}`
  const place = region.trim() || t.region
  switch (kind) {
    case "bulletin":
      return `${head} ${place} ${t.name}${t.bulletin ? "" : " "}${gradeText(svc, level)} 발효. ${t.act}`
    case "advice":
      return `${head} ${place} ${t.name} 피해가 우려됩니다. 주민은 안전한 곳으로 미리 대피하세요`
    case "order":
      return `${head} ${place} ${t.name} 대피명령 발령. 즉시 지정 장소로 대피하세요. 불응 시 200만원 이하 과태료`
    case "release":
      return `${head} ${place} 대피명령 해제. 귀가 시 도로 파손·침수·낙하물에 주의하세요`
  }
}

/** 채널별 글자 수 점검 — 공백 포함, 제한을 넘으면 ok=false */
export function checkLength(text: string) {
  const len = [...text].length
  return MSG_LIMITS.map((l) => ({ id: l.id, label: l.label, max: l.max, len, ok: len <= l.max }))
}

export const channelOf = (kind: MsgKind): MsgChannel => MSG_KINDS.find((k) => k.id === kind)?.channel ?? "안전안내"
