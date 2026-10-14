/**
 * 레거시 시스템에서 받을 데이터 항목 — '1차년도 사용 가능 레거시 데이터 현황' 문서의 시스템별 데이터(경보 이력·수위·강우량·유속 등)를 표 모양으로 정리한 것.
 * 섬엔지니어링 협의 결과(실제 필드·주기)가 오기 전이라 컬럼은 문서의 항목명 기준 가안이고, 값은 모두 임의 샘플이다(10월 중순 수령 예정).
 * 스테이징은 샘플 행을 보여주고, 프로토타입은 컬럼(수신 예정 항목)만 보여 주며 값은 '연계 전'으로 비워 둔다. 실제 값이 오면 rows만 교체한다.
 * 시스템 id는 mockHeavyRain.ts의 legacySystems와 같다.
 */
import { LEVEL_SAMPLE, levelStageOf, type LevelPoint } from "./levelAlerts"

export interface LegacyFeed {
  /** 수신 항목 설명(문서 기준) */
  items: string
  /** 수집 주기 — 협의 전 가안 */
  cycle: string
  columns: string[]
  /** 임의 샘플 행(컬럼 수와 같아야 한다) */
  rows: string[][]
  asOf: string
}

const AS_OF = "2026-10-13 09:40"
const hm = (at: string) => at.slice(11, 16)
/** 수위 표 — 값·기준은 levelAlerts.ts의 임의 샘플이고, 헤더 알림과 같은 값을 쓴다 */
const levelFeed = (system: LevelPoint["system"], items: string, cycle: string, nameCol: string): LegacyFeed => ({
  items,
  cycle,
  columns: [nameCol, "위치", "수위(m)", "주의 기준(m)", "판정", "관측 시각"],
  rows: LEVEL_SAMPLE.filter((p) => p.system === system).map((p) => [p.group, p.place, p.levelM.toFixed(2), p.steps.주의.toFixed(2), levelStageOf(p) ?? "—", hm(p.at)]),
  asOf: AS_OF,
})

/** 레거시 경보 발령 이력 — 조기경보 통합·강우량 연동 자동경보·자동 침수 경보가 쌓아 둔 이력(개통 시점부터 DB 누적, 사후분석·임계치 설정에 활용). 모두 임의 값 */
export type LegacyAlertSystem = "ls-ews" | "ls-rain-alert" | "ls-flood-warn"
export interface LegacyAlertRecord {
  /** "YYYY-MM-DD HH:mm" */
  at: string
  system: LegacyAlertSystem
  target: string
  stage: "관심" | "주의" | "경계" | "심각"
  value: string
  /** 해제 시각 — 해제 전이면 null */
  clearedAt: string | null
}
export const LEGACY_ALERT_HISTORY: LegacyAlertRecord[] = [
  { at: "2026-10-13 09:35", system: "ls-ews", target: "한천 용연", stage: "주의", value: "수위 1.12m", clearedAt: null },
  { at: "2026-10-13 09:30", system: "ls-flood-warn", target: "침수센서 J-037 제주시 건입동", stage: "경계", value: "수위 0.47m", clearedAt: null },
  { at: "2026-10-13 09:20", system: "ls-rain-alert", target: "한라산 어리목", stage: "경계", value: "1시간 54.5mm", clearedAt: null },
  { at: "2026-10-12 18:10", system: "ls-ews", target: "한천 용연", stage: "관심", value: "수위 0.90m", clearedAt: "2026-10-12 19:40" },
  { at: "2026-10-12 17:55", system: "ls-rain-alert", target: "제주시 연동", stage: "주의", value: "1시간 32.0mm", clearedAt: "2026-10-12 19:10" },
  { at: "2026-10-11 07:50", system: "ls-ews", target: "산지천 동문교", stage: "주의", value: "수위 1.20m", clearedAt: "2026-10-11 09:05" },
  { at: "2026-10-05 14:12", system: "ls-flood-warn", target: "침수센서 J-014 제주시 한천 인근", stage: "주의", value: "수위 0.31m", clearedAt: "2026-10-05 15:02" },
  { at: "2026-09-05 11:05", system: "ls-rain-alert", target: "서귀포 남원", stage: "심각", value: "1시간 72.0mm", clearedAt: "2026-09-05 12:30" },
]
/** 해제된 경보의 지속 시간(분) — 해제 전이면 null */
export const alertMinutes = (r: LegacyAlertRecord): number | null =>
  r.clearedAt ? Math.round((new Date(r.clearedAt.replace(" ", "T")).getTime() - new Date(r.at.replace(" ", "T")).getTime()) / 60000) : null

/** 레거시 수집 상태 — 시스템별 최근 수신 시각과 상태(임의 값). 운영 모니터링의 레거시 칸 */
export interface LegacyCollection {
  id: string
  lastAt: string
  state: "정상" | "지연" | "누락"
  note: string
}
export const LEGACY_COLLECTION: LegacyCollection[] = [
  { id: "ls-ews", lastAt: "2026-10-13 09:35", state: "정상", note: "이벤트 수신" },
  { id: "ls-flood-mgmt", lastAt: "2026-10-13 09:30", state: "정상", note: "10분 주기" },
  { id: "ls-rain-alert", lastAt: "2026-10-13 09:40", state: "정상", note: "10분 주기" },
  { id: "ls-flood-warn", lastAt: "2026-10-13 09:22", state: "지연", note: "5분 주기 — 18분 지연" },
  { id: "ls-river-mon", lastAt: "2026-10-13 09:40", state: "정상", note: "10분 주기" },
  { id: "ls-river-flow", lastAt: "2026-10-12 21:10", state: "누락", note: "10분 주기 — 12시간 이상 수신 없음" },
  { id: "ls-sgp-rain", lastAt: "2026-10-13 09:40", state: "정상", note: "10분 주기" },
  { id: "ls-snow", lastAt: "2026-10-13 09:40", state: "정상", note: "10분 주기" },
  { id: "ls-quake", lastAt: "2026-10-13 09:40", state: "정상", note: "상시" },
  { id: "ls-2", lastAt: "2026-10-13 00:10", state: "정상", note: "이력 일괄(일 1회)" },
  { id: "ls-prov-cctv", lastAt: "2026-10-13 09:40", state: "정상", note: "목록·상태" },
  { id: "ls-alert-dispatch", lastAt: "2026-10-13 09:36", state: "정상", note: "이벤트 수신" },
]

export const LEGACY_FEEDS: Record<string, LegacyFeed> = {
  "ls-ews": {
    items: "경보 이력 · 조기경보 수치",
    cycle: "이벤트 발생 시 + 이력 일괄",
    columns: ["발령 시각", "대상 지점", "경보 단계", "수치", "해제 시각"],
    rows: LEGACY_ALERT_HISTORY.filter((r) => r.system === "ls-ews").map((r) => [r.at, r.target, r.stage, r.value, r.clearedAt ?? "—"]),
    asOf: AS_OF,
  },
  "ls-flood-mgmt": {
    items: "풍수해 관련 종합 현황",
    cycle: "10분 가안",
    columns: ["항목", "제주시", "서귀포시", "합계"],
    rows: [
      ["호우 특보 발효", "1건", "1건", "2건"],
      ["침수 신고", "3건", "1건", "4건"],
      ["도로 통제", "2곳", "1곳", "3곳"],
      ["대피 인원", "0명", "0명", "0명"],
    ],
    asOf: AS_OF,
  },
  "ls-rain-alert": {
    items: "강우량 데이터 · 경보 발령 이력",
    cycle: "10분 가안",
    columns: ["관측소", "10분(mm)", "1시간(mm)", "12시간(mm)", "경보"],
    rows: [
      ["제주시 연동", "4.5", "32.0", "61.5", "주의"],
      ["한라산 어리목", "7.0", "54.5", "118.0", "경계"],
      ["서귀포 남원", "2.0", "18.0", "40.5", "—"],
      ["성산", "1.0", "9.5", "22.0", "—"],
    ],
    asOf: AS_OF,
  },
  "ls-flood-warn": levelFeed("ls-flood-warn", "수위 측정 데이터 · 침수 경보 이력", "5분 가안", "센서"),
  "ls-river-mon": levelFeed("ls-river-mon", "하천 수위 데이터", "10분 가안", "하천"),
  "ls-river-flow": {
    items: "유속 수치 데이터",
    cycle: "10분 가안",
    columns: ["하천", "지점", "유속(m/s)", "관측 시각"],
    rows: [
      ["한천", "용연", "1.35", "09:40"],
      ["산지천", "동문교", "0.92", "09:40"],
      ["화북천", "화북교", "0.74", "09:40"],
    ],
    asOf: AS_OF,
  },
  "ls-sgp-rain": {
    items: "서귀포지역 강우량 측정 수치",
    cycle: "10분 가안",
    columns: ["관측소", "10분(mm)", "1시간(mm)", "12시간(mm)"],
    rows: [
      ["서귀포 중문", "3.0", "21.5", "48.0"],
      ["서귀포 효돈", "5.5", "38.0", "72.5"],
      ["표선", "1.5", "12.0", "30.0"],
    ],
    asOf: AS_OF,
  },
  "ls-snow": {
    items: "적설계 관측값",
    cycle: "10분 가안",
    columns: ["지점", "적설(cm)", "기온(℃)", "관측 시각"],
    rows: [
      ["한라산 1100고지", "12.5", "-3.2", "09:40"],
      ["어승생", "6.0", "-1.1", "09:40"],
      ["제주시 산간 도로", "1.5", "0.4", "09:40"],
    ],
    asOf: AS_OF,
  },
  "ls-quake": {
    items: "지진가속도 계측값",
    cycle: "상시 + 이벤트 시",
    columns: ["설치 위치", "최대 가속도(gal)", "계측 진도", "상태", "최근 계측"],
    rows: [
      ["제주도청", "0.02", "Ⅰ", "정상", "09:40"],
      ["제주시청", "0.03", "Ⅰ", "정상", "09:40"],
      ["서귀포시청", "0.01", "Ⅰ", "정상", "09:40"],
    ],
    asOf: AS_OF,
  },
  "ls-2": {
    items: "피해 현황 이력(시스템에서 엑셀로 추출 가능)",
    cycle: "이력 일괄 가안",
    columns: ["일시", "재난", "피해 유형", "건수", "조치 상태"],
    rows: [
      ["2026-09-05", "태풍", "도로 침수", "7", "완료"],
      ["2026-09-05", "태풍", "시설물 파손", "4", "복구 중"],
      ["2026-08-19", "호우", "하천 범람 우려 통제", "2", "완료"],
    ],
    asOf: AS_OF,
  },
  "ls-prov-cctv": {
    items: "CCTV 구분별 규모·표출 방식(영상은 저장 없이 스트리밍 링크)",
    cycle: "목록 일괄 + 상태 상시 가안",
    columns: ["구분", "대수(약)", "표출 방식", "보관"],
    rows: [
      ["도 자체 관제", "12,000", "실시간 스트리밍 링크", "30일 순환 삭제"],
      ["불법주정차 포함", "18,000", "실시간 스트리밍 링크", "30일 순환 삭제"],
      ["풍수해 관제용(하천·해안·산지)", "1,150", "실시간 스트리밍 링크", "30일 순환 삭제"],
      ["자치경찰단 ITS(일부 연계 검토)", "320", "라이선스 협의 후", "—"],
    ],
    asOf: AS_OF,
  },
  "ls-alert-dispatch": {
    items: "경보 전파 이력(수단·대상·결과)",
    cycle: "이벤트 발생 시 가안",
    columns: ["발송 시각", "수단", "대상", "결과"],
    rows: [
      ["09:36", "재해문자전광판", "한천 일대", "성공 4/4"],
      ["09:35", "자동음성", "한천 하류", "송출 완료"],
      ["09:35", "안전안내문자", "제주시 건입동", "성공 1,188 · 실패 12"],
    ],
    asOf: AS_OF,
  },
}
