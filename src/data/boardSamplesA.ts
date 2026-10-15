import { bd, type BoardService, type DashLeft, type RightPanel, type ReadyItem, type TodoItem, type LogItem } from "./boardTypes"

/** 서비스 보드 샘플 데이터 A — 하천범람 · 호우 · 태풍 · 폭염. Figma 3단계 시안의 S1(평시)·S2(감지)·S3(진행)·S4(종료) 문구 그대로. 값은 모두 샘플. */

const OFF = "offline" as const
const calmRight = (ready: ReadyItem[]): RightPanel => ({
  head: bd("평시", OFF),
  todo: { badge: bd("0건", OFF), items: [] },
  doing: { badge: bd("0건", OFF), items: [], empty: "진행 중인 조치가 없습니다" },
  ready,
  log: [],
})
const okAct = (...labels: string[]) => labels.map((label, i) => ({ label, kind: (i === 0 ? "ok" : "no") as "ok" | "no" }))
const retry = (title: string, detail: string): TodoItem => ({ tag: "재시도", title, detail, actions: okAct("전체 재시도"), link: { label: "실패 목록 보기 →", route: "alert" } })
const log = (...rows: [string, LogItem["tag"], string][]): LogItem[] => rows.map(([time, tag, text]) => ({ time, tag, text }))
const closedStats = (done: string, fail: string) => [
  { label: "완료", value: done },
  { label: "승인 대기", value: "0건" },
  { label: "미실시·실패", value: fail, bad: true },
]

// ================================================================== 하천범람
const riverCalm: DashLeft = {
  chips: ["범위 효돈천(돈내코·쇠소깍)", "출처 실증사·기상청(연계 전)"],
  status: {
    title: "지점 상태",
    rows: [
      { name: "효돈천(쇠소깍)", badge: bd("판단 전", OFF) },
      { name: "효돈천(돈내코)", badge: bd("판단 전", OFF) },
    ],
    note: "관측값 없음 — 범람 도달 해당 없음 · 갱신 -",
  },
  steps: { done: 0, active: -1, note: "평시 — 진행 중인 사건이 없어 시작된 단계가 없습니다." },
  tiles: [
    { label: "수위", value: "-", sub: "관측값 없음" },
    { label: "강우량", value: "-", sub: "관측값 없음" },
    { label: "레이더", value: "-", sub: "감지 없음" },
    { label: "토양 포화도", value: "-", sub: "관측값 없음" },
  ],
  brief: [
    ["판단", "관측값 없음 — 영향 예상 해당 없음"],
    ["전개", "감지된 신호 없음"],
    ["대응", "공동 대응 기관 평시 대기 · 발령된 경보 없음"],
  ],
  briefLink: "근거·추이는 관측·판단 탭 →",
}
const riverDetect: DashLeft = {
  chips: ["범위 효돈천(돈내코·쇠소깍)", "기준 12:00"],
  status: {
    title: "지점 상태",
    rows: [
      { name: "효돈천(돈내코) · Q 61%", badge: bd("주의", "warning"), sub: "범람 도달 약 55분 · 갱신 12:00" },
      { name: "효돈천(쇠소깍) · Q 38%", badge: bd("정상", "safe"), sub: "징후 감시 · 범람 도달 해당 없음 · 갱신 12:00" },
    ],
  },
  steps: { done: 2, active: 2, note: "판단 단계 — 팀장 승인 대기" },
  tiles: [
    { label: "수위", value: "1.85m", sub: "돈내코 · 경계 3.0m", tone: "warning" },
    { label: "강우량", value: "45mm/h", sub: "예보 20mm/h 대비 초과", tone: "warning" },
    { label: "레이더", value: "강한 에코 접근", sub: "신뢰도 보통" },
    { label: "토양 포화도", value: "78%", sub: "높음" },
  ],
  brief: [
    ["판단", "돈내코 61% 주의, 쇠소깍 38% 정상(징후 감시)"],
    ["전개", "관측 상승 중 · 강우 실측이 예보보다 25mm/h 높음"],
    ["영향", "하상도로 통제 대상 1곳"],
    ["대응", "경보 발송 전 · 출동 승인 1건 대기"],
  ],
  briefLink: "근거·추이는 관측·판단 탭 →",
}
const riverProgress: DashLeft = {
  ...riverDetect,
  chips: ["범위 효돈천(돈내코·쇠소깍)", "기준 12:15"],
  status: {
    title: "지점 상태",
    rows: [
      { name: "효돈천(돈내코) · Q 61%", badge: bd("주의", "warning"), sub: "범람 도달 약 55분 · 갱신 12:15" },
      { name: "효돈천(쇠소깍) · Q 38%", badge: bd("정상", "safe"), sub: "징후 감시 · 범람 도달 해당 없음 · 갱신 12:15" },
    ],
  },
  steps: { done: 4, active: 4, note: "대응 단계 — 현장 조치 진행 중 · 조치 필요 2건" },
  brief: [
    ["판단", "돈내코 61% 주의, 쇠소깍 38% 정상(징후 감시)"],
    ["전개", "관측 상승 중 · 강우 실측이 예보보다 25mm/h 높음"],
    ["영향", "하상도로 통제 대상 1곳"],
    ["대응", "경보 발령(12:10) · 출동 중 · 차단기 오류 조치 필요"],
  ],
}
const riverTrigger = { name: "호우주의보 발효 중 · 제주도 남부", advice: "권장 조치: 경보 발송 승인 검토 · 출동 요청 대기" }

export const RIVER: BoardService = {
  id: "river",
  base: "/river",
  title: "하천범람",
  dash: { calm: riverCalm, detect: riverDetect, progress: riverProgress },
  history: {
    id: "RV-2026-0001 · 효돈천 돈내코 범람 주의 대응",
    title: "하천범람",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "하천 범람 주의"], ["위치", "효돈천(돈내코)"], ["소요 시간", "약 3시간 20분 (11:55 ~ 15:15)"], ["대응 기관", "4곳 (재난안전과 · 상황실 · 소방서 · 경찰서)"]] },
      { title: "AI 분석 요약", rows: [["예측 일치율", "87% (목표 85% 이상)"], ["선행 시간", "48분 (목표 60분)"], ["최고 단계", "주의 (Q 66%)"]] },
      { title: "관측 결과", rows: [["최대 수위", "2.05m (돈내코)"], ["최대 강우", "45mm/h"], ["조치 실패", "1건 (차단기 오류)"]] },
    ],
    conditions: [
      { ok: true, text: "유량비가 징후 감시 구간(20%) 아래로 1시간 유지" },
      { ok: true, text: "호우주의보 해제 확인" },
      { ok: false, text: "현장 통제 해제 확인(차단기 복구 — 직접 확인)" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "하천범람 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "조사 중"], ["개선 사항", "차단기 통신 이중화 검토"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS)·현장 단말·상황판", sub: "연결 확인", badge: bd("3/3 연결", "safe") },
      { title: "공동 대응 기관 4곳 — 연락망", sub: "제주도청 · 서귀포시 · 소방서 · 경찰서", badge: bd("등록됨", "info") },
    ]),
    detect: {
      head: bd("감지 후 5분", "warning"),
      trigger: riverTrigger,
      todo: {
        badge: bd("3건 대기", "warning"),
        items: [
          { tag: "승인", title: "돈내코 단계 상향 · 경보 발령(주의)", detail: "근거 Q 61% · 수위 1.85m(경계 3.0m) · 문안 확인 후 승인", actions: okAct("승인", "반려"), link: { label: "문안 확인·편집 →", route: "alert" } },
          { tag: "확인", title: "돌발 강우 감지 — 단계 상향 판단", detail: "예보 20mm/h → 실측 45mm/h", actions: okAct("확인"), link: { label: "근거 보기 →", route: "analysis" } },
          { tag: "승인", title: "출동 요청 — 효돈천(돈내코) 하상도로 통제 지원", detail: "11:58 요청 접수 · 소방서(서귀포)·경찰서", actions: okAct("승인", "반려"), link: { label: "출동 요청서 보기 →", route: "dispatch" } },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "승인 후 시작됩니다 — 현재 단계: 판단" },
      log: log(["12:00", "감지", "돈내코 관측 갱신 — Q 61% · 주의"], ["11:55", "감지", "돌발 강우 감지 — 예보 20mm/h → 실측 45mm/h"], ["11:40", "판단", "쇠소깍 관심 유지 — Q 38%"], ["11:20", "판단", "돈내코 관심 → 주의 상승 — Q 52%"]),
    },
    progress: {
      head: bd("감지 후 17분", "alert"),
      trigger: { name: "호우주의보 발효 중 · 제주도 남부", advice: "권장 조치: 경보 발송 상태 확인 · 현장 통제 점검" },
      todo: {
        badge: bd("조치 필요 2건", "alert"),
        items: [
          { tag: "조치 실패", fail: true, title: "차단기 오류 — 효돈천 하상도로 현장 수동 차단 필요", detail: "12:12 원인 통신 두절 · 현장 수동 차단을 요청했습니다", actions: okAct("수동 차단 요청 접수 확인"), link: { label: "현장 통제 상세 →", route: "control" } },
          retry("문자(CBS/SMS) 발송 실패 17건", "성공 1,323 · 실패 17 · 최종 12:12"),
        ],
      },
      doing: {
        badge: bd("5건", "info"),
        items: [
          { title: "경보 발송 — 돈내코 주의 경보", detail: "12:10 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "출동 요청 — 효돈천 하상도로 통제 지원", detail: "소방서(서귀포)·경찰서", badge: bd("출동 중", "info") },
          { title: "문자(CBS/SMS) — 발송 1,340건", detail: "성공률 98.7%", badge: bd("일부 미전달", "warning") },
          { title: "현장 단말 · 상황판 방송", detail: "3개소 · 4개소 모두 100%", badge: bd("발송 완료", "safe") },
          { title: "제주도청 재난안전과 · 서귀포시 상황실", detail: "상황 공유 · 현장 대응", badge: bd("공조 중", "info") },
        ],
      },
      log: log(["12:12", "조치", "차단기 오류 — 현장 수동 차단 요청"], ["12:12", "조치", "문자 발송 완료 — 성공 1,323 · 실패 17"], ["12:10", "조치", "돈내코 주의 경보 발령 · 소방서·경찰서 출동"], ["12:08", "조치", "출동 요청 승인 — 팀장"], ["11:58", "조치", "출동 요청 접수 — 효돈천(돈내코)"]),
    },
    closed: {
      head: bd("종료 · 총 3시간 20분", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "차단기 복구 — 현장 통제 해제 확인", detail: "종료 조건 중 직접 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 차단기 오류(12:12)", stats: closedStats("5건", "1건") },
      log: log(["15:15", "종료", "사건 종료 — 종료 보고서 작성(재난안전과)"], ["14:30", "판단", "호우주의보 해제 — 제주도남부"], ["12:12", "조치", "차단기 오류 — 현장 수동 차단 요청"], ["12:10", "조치", "돈내코 주의 경보 발령"]),
    },
  },
}

// ================================================================== 호우
const rainCalm: DashLeft = {
  chips: ["범위 제주 전체"],
  status: { title: "서비스 상태", badge: bd("판단 전", OFF), lines: ["감지된 돌발 강우 없음", "관측소 데이터 없음 — 평시 감시 중"] },
  tiles: [
    { label: "최대 실측 강우", value: "-", sub: "예보 비교 불가" },
    { label: "경보·주의 관측소", value: "-", sub: "관측소 없음" },
    { label: "누적 강우 1위", value: "-", sub: "" },
    { label: "자동통보", value: "0건", sub: "" },
  ],
  brief: [["판단", "감지된 돌발 강우 없음"], ["전개", "실측과 예보를 비교할 관측소 자료 없음"], ["대응", "발령된 경보 없음"]],
  briefLink: "근거·추이는 관측·판단 탭 →",
}
const rainDetect: DashLeft = {
  chips: ["범위 제주 전체", "기준 14:35 · 샘플"],
  status: { title: "서비스 상태", badge: bd("AI 조기경고", "warning"), heading: "예보 30mm/h 대비 실측 초과", lines: ["감지 14:20 · 경보·주의 관측소 2/6"] },
  tiles: [
    { label: "최대 실측 강우", value: "42mm/h", sub: "예보 30mm/h", tone: "warning" },
    { label: "경보·주의 관측소", value: "2/6", sub: "관측소 6곳 중", tone: "warning" },
    { label: "누적 강우 1위", value: "86mm", sub: "한천" },
    { label: "자동통보", value: "2건", sub: "최근 14:32" },
  ],
  brief: [["판단", "한천 침수센서·어승생 우량계가 예보 초과"], ["전개", "누적 강우 상승 중 · 한천 하류 주의"], ["대응", "문자전광판·자동음성 2건 송출"]],
  briefLink: "근거·추이는 관측·판단 탭 →",
}
export const HEAVY_RAIN: BoardService = {
  id: "heavy-rain",
  base: "/heavy-rain",
  title: "호우",
  dash: {
    calm: rainCalm,
    detect: rainDetect,
    progress: { ...rainDetect, brief: [["판단", "한천 침수센서·어승생 우량계가 예보 초과"], ["전개", "누적 강우 상승 중 · 한천 하류 주의"], ["대응", "호우 주의 발령(14:32) · 문자 실패 12건 재발송 검토"]] },
  },
  history: {
    id: "HR-2026-0001 · 한천 일대 돌발 강우 대응",
    title: "호우",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "돌발 강우"], ["위치", "한천 일대"], ["소요 시간", "2시간 10분 (14:20 ~ 16:30)"], ["대응 기관", "2곳 (제주시 안전총괄과 · 제주소방서)"]] },
      { title: "관측 결과", rows: [["최대 실측 강우", "42mm/h (한천)"], ["누적 강우", "86mm"], ["경보·주의 관측소", "2곳"]] },
    ],
    conditions: [
      { ok: true, text: "실측이 예보 아래로 1시간 유지" },
      { ok: true, text: "호우주의보 해제 확인" },
      { ok: false, text: "현장 점검 결과 보고" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "돌발 강우 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "조사 중"], ["개선 사항", "취약지점 예찰 주기 단축 검토"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)·재해문자전광판·자동음성", sub: "연결 확인", badge: bd("3/3 연결", "safe") },
      { title: "관측망 — 우량계·침수센서", sub: "관측소 6곳 · 관측값 없음", badge: bd("수신 전", OFF) },
    ]),
    detect: {
      head: bd("감지 후 15분", "warning"),
      trigger: { name: "호우주의보 발효 중 · 제주도북부·산지", advice: "권장 조치: 자동침수경보 발령 여부 판단 · 취약지점 예찰" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          { tag: "확인", title: "자동침수경보 발령 여부 판단", detail: "한천 침수센서·어승생 우량계가 예보 초과 · 경보·주의 관측소 2/6", actions: okAct("확인"), link: { label: "근거 보기 →", route: "analysis" } },
          { tag: "지시", title: "취약지점 현장 예찰", detail: "지시 권고 · 한천 하류 저지대", actions: okAct("지시") },
        ],
      },
      doing: {
        badge: bd("2건", "info"),
        items: [
          { title: "자동통보 — 재해문자전광판", detail: "14:32 송출 · 한천 일대 침수 주의", badge: bd("송출 완료", "safe") },
          { title: "자동통보 — 자동음성", detail: "14:30 송출 · 한천 하류 통행 주의", badge: bd("송출 완료", "safe") },
        ],
      },
      log: log(["14:32", "조치", "재해문자전광판 송출 — 한천 일대 침수 주의"], ["14:30", "조치", "자동음성 송출 — 한천 하류 통행 주의"], ["14:20", "감지", "예보 초과 감지 — 한천 42 · 어승생 38mm/h"]),
    },
    progress: {
      head: bd("감지 후 13분", "alert"),
      trigger: { name: "호우주의보 발효 중 · 제주도북부·산지", advice: "권장 조치: 문자 실패 재발송 검토 · 강풍주의보(제주도남부) 확인" },
      todo: { badge: bd("1건 대기", "warning"), items: [retry("문자(CBS/SMS) 발송 실패 12건", "발송 1,200건 · 성공 1,188 · 최종 14:33")] },
      doing: {
        badge: bd("4건", "info"),
        items: [
          { title: "경보 발송 — 호우 주의(한천 일대 약 1,200명)", detail: "14:32 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.0%", badge: bd("일부 미전달", "warning") },
          { title: "재해문자전광판", detail: "4개소 모두 100%", badge: bd("발송 완료", "safe") },
          { title: "자동음성 송출", detail: "한천 하류 통행 주의 · 14:30", badge: bd("송출 완료", "safe") },
        ],
      },
      log: log(["14:33", "조치", "문자 발송 완료 — 성공 1,188 · 실패 12"], ["14:32", "조치", "호우 주의 발령 — 한천 일대 (승인 재난안전과장)"], ["14:30", "조치", "자동음성 송출 — 한천 하류 통행 주의"], ["14:20", "감지", "예보 초과 감지 — 한천 42 · 어승생 38mm/h"]),
    },
    closed: {
      head: bd("종료 · 총 2시간 10분", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "현장 점검 결과 보고", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 12건(재발송 검토)", stats: closedStats("4건", "1건") },
      log: log(["16:30", "종료", "호우 상황 종료 — 종료 보고서 작성 (재난안전과)"], ["16:10", "판단", "호우주의보 해제 — 제주도북부·산지"], ["14:32", "조치", "호우 주의 발령 — 한천 일대"]),
    },
  },
}

// ================================================================== 태풍
const tyCalm: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 발표"],
  status: { title: "서비스 상태", badge: bd("발표 없음", OFF), heading: "발표 중인 태풍 없음", lines: ["기상청 발표 태풍 정보가 없습니다 — 평시 감시 중"] },
  tiles: [
    { label: "제주까지", value: "-", sub: "" },
    { label: "최근접 예상", value: "-", sub: "" },
    { label: "최대 풍속", value: "-", sub: "" },
    { label: "중심 기압", value: "-", sub: "" },
  ],
  brief: [["판단", "발표 중인 태풍 없음"], ["전개", "예상 경로 없음 — 기상청이 태풍을 발표하면 제주 접근 경로가 표시됩니다"], ["대응", "대비 안내 발송 없음"]],
  briefLink: "경로·세력은 관측·판단 탭 →",
}
const tyDetect: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 발표", "기준 09/21 15:00"],
  status: { title: "제99호 태풍 · 태풍주의보", badge: bd("태풍주의보", "warning"), heading: "서귀포 남쪽 약 380km 해상", lines: ["기상청 발표 09/21 15:00"] },
  tiles: [
    { label: "제주까지", value: "380km", sub: "이동 18km/h" },
    { label: "최근접 예상", value: "120km", sub: "09/22 06:00" },
    { label: "최대 풍속", value: "35m/s", sub: "", tone: "warning" },
    { label: "중심 기압", value: "965hPa", sub: "" },
  ],
  brief: [["판단", "태풍주의보 발표 · 제주 최근접 120km 예상"], ["전개", "09/22 06시 최근접 후 북동진 · 풍속 30m/s 안팎"], ["대응", "대비 안내 발송 전 · 대응반 소집 권고"]],
  briefLink: "경로·세력은 관측·판단 탭 →",
}
export const TYPHOON: BoardService = {
  id: "typhoon",
  base: "/typhoon",
  title: "태풍",
  dash: {
    calm: tyCalm,
    detect: tyDetect,
    progress: { ...tyDetect, chips: ["범위 제주 전체", "출처 기상청 발표", "기준 09/21 16:15"], brief: [["판단", "태풍주의보 발표 · 제주 최근접 120km 예상"], ["전개", "09/22 06시 최근접 후 북동진 · 풍속 30m/s 안팎"], ["대응", "대비 안내 발령(16:10) · 문자 실패 282건 재발송 검토"]] },
  },
  history: {
    id: "TY-2026-0001 · 제99호 태풍 특보 해제",
    title: "태풍",
    badge: bd("해제", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "태풍"], ["소요 시간", "약 41시간 (09/21 15:00 ~ 09/23 08:00)"], ["대응 기관", "2곳 (제주도 재난안전과 · 제주소방서)"]] },
      { title: "관측 결과", rows: [["제주 최근접(예보)", "120km (09/22 06:00)"], ["최대 풍속(기상청 발표)", "35m/s"], ["해양관측부이 최대 파고", "4.8m"]] },
    ],
    conditions: [
      { ok: true, text: "태풍특보 해제 확인" },
      { ok: true, text: "대비 안내 해제 문자 발송" },
      { ok: false, text: "피해 현황 집계" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "태풍 대비 SOP"], ["인명 피해", "없음"], ["재산 피해", "조사 중"], ["개선 사항", "해안 시설물 사전 고정 안내 시점 앞당김 검토"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)", sub: "연결 확인", badge: bd("연결", "safe") },
      { title: "민방위경보시스템", sub: "중앙 시스템과만 연계 — 도 자체 연계 없음", badge: bd("확인 필요", "warning") },
    ]),
    detect: {
      head: bd("감지 후 12시간", "warning"),
      trigger: { name: "태풍주의보 발효 중 · 제주도남쪽먼바다·앞바다", advice: "권장 조치: 대비 안내 발송 승인 · 민방위경보 연계 확인" },
      todo: {
        badge: bd("3건 대기", "warning"),
        items: [
          { tag: "승인", title: "대비 안내 발송 승인", detail: "태풍주의보 발표 · 제주 최근접 120km 예상(09/22 06:00)", actions: okAct("승인", "반려"), link: { label: "안내 문안 확인·편집 →", route: "alert" } },
          { tag: "지시", title: "대응반 소집·시설물 고정 등 대비태세 점검", detail: "지시 권고", actions: okAct("지시") },
          { tag: "확인", title: "민방위경보시스템 연계 확인", detail: "병행 조치 확인 · 중앙 시스템과만 연계", actions: okAct("확인") },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "승인 후 시작됩니다 — 현재 단계: 판단" },
      log: log(["15:00", "감지", "기상청 발표 · 태풍주의보 — 서귀포 남쪽 약 380km 해상"], ["03:00", "감지", "기상청 발표 · 예비특보 — 서귀포 남남동쪽 약 640km 해상"]),
    },
    progress: {
      head: bd("감지 후 1시간 12분", "alert"),
      trigger: { name: "태풍주의보 발효 중 · 서귀포 남쪽 약 380km 해상", advice: "권장 조치: 대비 안내 발송 확인 · 민방위경보 연계 확인" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          retry("문자(CBS/SMS) 발송 실패 282건", "발송 52,300건 · 성공 52,018 · 최종 16:12"),
          { tag: "확인", title: "민방위경보시스템 연계 확인", detail: "중앙 시스템과만 연계 — 도 자체 연계 없음", actions: okAct("확인") },
        ],
      },
      doing: {
        badge: bd("3건", "info"),
        items: [
          { title: "대비 안내 — 태풍 대비(강풍·호우)", detail: "제주도 전역 · 16:10 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.5%", badge: bd("일부 미전달", "warning") },
          { title: "병행 조치 — 민방위경보 연계", detail: "도 자체 연계 없음", badge: bd("확인 필요", "warning") },
        ],
      },
      log: log(["16:12", "조치", "문자 발송 완료 — 성공 52,018 · 실패 282"], ["16:10", "조치", "대비 안내 발령 — 제주도 전역 (승인 재난안전과장)"], ["15:00", "감지", "기상청 발표 · 태풍주의보 — 서귀포 남쪽 약 380km 해상"]),
    },
    closed: {
      head: bd("종료 · 총 1일 17시간", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "피해 현황 집계", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 282건(재발송 검토)", stats: closedStats("3건", "1건") },
      log: log(["09/23 08:00", "종료", "기상청 발표 · 태풍특보 해제 — 제주도 전 해상·육상"], ["09/22 06:00", "감지", "제주 최근접 — 약 120km (기상청 예측)"], ["09/21 16:10", "조치", "대비 안내 발령 — 제주도 전역"]),
    },
  },
}

// ================================================================== 폭염
const heatCalm: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보·예보"],
  status: { title: "서비스 상태", badge: bd("판단 전", OFF), heading: "체감온도 관측값 없음", lines: ["기상청 폭염특보 기준 — 체감 33℃ 이상 2일 이상 지속 시 주의보, 35℃ 이상 시 경보"] },
  tiles: [
    { label: "체감온도", value: "-", sub: "" },
    { label: "주의보 기준 지속", value: "-", sub: "체감 33℃ 이상 연속" },
    { label: "경보(35℃)까지", value: "-", sub: "" },
    { label: "무더위쉼터", value: "0개소", sub: "등록된 쉼터 없음" },
  ],
  brief: [["판단", "체감온도 관측값 없음"], ["전개", "체감 35℃ 이상 지속 시 폭염경보로 격상 — 관측값 없음"], ["대응", "안내 발송 없음 · 등록된 쉼터 없음"]],
  briefLink: "특보·추이는 관측·판단 탭 →",
}
const heatDetect: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보·예보", "기준 08/18 14:00"],
  status: { title: "서비스 상태", badge: bd("폭염주의보", "warning"), heading: "체감온도 34.1℃", lines: ["기상청 폭염특보 기준 — 체감 33℃ 이상 2일 이상 지속 시 주의보, 35℃ 이상 시 경보"] },
  tiles: [
    { label: "체감온도", value: "34.1℃", sub: "", tone: "warning" },
    { label: "주의보 기준 지속", value: "3일", sub: "체감 33℃ 이상 연속" },
    { label: "경보(35℃)까지", value: "0.9℃", sub: "남은 격차" },
    { label: "무더위쉼터", value: "758개소", sub: "등록 12,345" },
  ],
  brief: [["판단", "체감 34.1℃ · 주의보 기준 3일째 지속"], ["전개", "체감 35℃ 이상 지속 시 폭염경보로 격상 — 현재 0.9℃ 부족"], ["대응", "안내 문자 발송 완료 · 쉼터 786개소 · 수용 21,430명"]],
  briefLink: "특보·추이는 관측·판단 탭 →",
}
export const HEAT: BoardService = {
  id: "heat",
  base: "/heat",
  title: "폭염 대응",
  dash: { calm: heatCalm, detect: heatDetect, progress: { ...heatDetect, chips: ["범위 제주 전체", "출처 기상청 특보·예보", "기준 08/16 11:35"] } },
  history: {
    id: "HT-2026-0001 · 폭염주의보 해제",
    title: "폭염",
    badge: bd("해제", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "폭염"], ["소요 시간", "5일 (08/16 11:00 ~ 08/21 11:00)"], ["대응 기관", "2곳 (제주도 재난안전과 · 보건소)"]] },
      { title: "관측 결과", rows: [["최고 체감온도(기상청)", "34.5℃ (08/17)"], ["최고기온", "35.0℃ (08/17)"], ["쉼터 운영", "786곳"]] },
    ],
    conditions: [
      { ok: true, text: "폭염특보 해제 확인" },
      { ok: true, text: "쉼터 운영 종료 안내" },
      { ok: false, text: "온열질환자 집계" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "폭염 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "해당 없음"], ["개선 사항", "쉼터 정원 미등록 시설 정비 검토"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)", sub: "연결 확인", badge: bd("연결", "safe") },
      { title: "무더위쉼터 자료", sub: "행안부 스냅샷 786곳 · 정원 일부 미등록", badge: bd("스냅샷", "info") },
    ]),
    detect: {
      head: bd("감지 후 2일 3시간", "warning"),
      trigger: { name: "폭염주의보 발효 중 · 제주도북부·남부", advice: "권장 조치: 폭염경보 격상 판단 · 무더위쉼터 운영 점검" },
      todo: {
        badge: bd("3건 대기", "warning"),
        items: [
          { tag: "확인", title: "폭염경보(35℃) 격상 판단", detail: "체감 34.1℃ · 경보까지 0.9℃ · 추이 관찰", actions: okAct("확인"), link: { label: "추이 보기 →", route: "analysis" } },
          { tag: "지시", title: "무더위쉼터 운영·그늘길 안내 점검", detail: "지시 권고 · 쉼터 786곳 스냅샷", actions: okAct("지시"), link: { label: "쉼터 전체 보기 →", route: "home" } },
          { tag: "확인", title: "해제 조건 확인", detail: "해제 전 확인 · 특보 해제 시 쉼터 운영 종료 안내", actions: okAct("확인") },
        ],
      },
      doing: { badge: bd("1건", "info"), items: [{ title: "안내 발송 — 폭염주의보 안내 문자", detail: "제주도 전역 · 08/16 11:30 발송", badge: bd("발송 완료", "safe") }] },
      log: log(["08/18 14:00", "감지", "기준 · 폭염주의보 유지 — 체감 34.1℃"], ["08/17", "감지", "최고 35.0℃ · 체감 34.5℃"], ["08/16 11:30", "조치", "안내 발송 — 폭염주의보 안내 문자 (제주도 전역)"], ["08/16 11:00", "감지", "기상청 발표 · 폭염주의보 — 제주도"]),
    },
    progress: {
      head: bd("감지 후 32분", "alert"),
      trigger: { name: "폭염주의보 발효 중 · 제주도", advice: "권장 조치: 무더위쉼터 안내 · 낮 시간 야외활동 자제 안내" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          retry("문자(CBS/SMS) 발송 실패 147건", "발송 48,900건 · 성공 48,753 · 최종 11:32"),
          { tag: "확인", title: "무더위쉼터·이동 경로 안내 반영 확인", detail: "쉼터 786곳 스냅샷 · 정원 일부 미등록 · 앞 40곳만 표시", actions: okAct("확인"), link: { label: "쉼터 전체 보기 →", route: "home" } },
        ],
      },
      doing: {
        badge: bd("4건", "info"),
        items: [
          { title: "안내 발송 — 폭염주의보 안내", detail: "제주도 전역 · 11:30 발송 · 승인 재난안전과장", badge: bd("발송", "safe") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.7%", badge: bd("일부 미전달", "warning") },
          { title: "무더위쉼터 안내", detail: "786곳 · 수용 21,430명(스냅샷)", badge: bd("안내 중", "info") },
          { title: "이동 경로 안내(그늘길·주의 구간)", detail: "경로 자료는 샘플", badge: bd("안내 중", "info") },
        ],
      },
      log: log(["11:32", "조치", "문자 발송 완료 — 성공 48,753 · 실패 147"], ["11:30", "조치", "안내 발송 — 폭염주의보 안내 (승인 재난안전과장)"], ["11:00", "감지", "기상청 발표 · 폭염주의보 — 제주도"]),
    },
    closed: {
      head: bd("종료 · 총 5일", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "온열질환자 집계", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 147건(재발송 검토)", stats: closedStats("3건", "1건") },
      log: log(["08/21 11:00", "종료", "기상청 발표 · 폭염특보 해제 — 제주도"], ["08/17", "감지", "최고 35.0℃ · 체감 34.5℃"], ["08/16 11:30", "조치", "안내 발송 — 폭염주의보 안내 (제주도 전역)"]),
    },
  },
}
