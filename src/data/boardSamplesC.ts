import { bd, type BoardService, type DashLeft, type LogItem, type RightPanel } from "./boardTypes"

/** 서비스 보드 샘플 데이터 C — 저염분 고수온 · 연안 안전관리(실증 서비스: e-SOP 6단계·현장 경보 채널이 있다). 값은 모두 샘플. */

const OFF = "offline" as const
const okAct = (...labels: string[]) => labels.map((label, i) => ({ label, kind: (i === 0 ? "ok" : "no") as "ok" | "no" }))
const log = (...rows: [string, LogItem["tag"], string][]): LogItem[] => rows.map(([time, tag, text]) => ({ time, tag, text }))
const calm = (ready: RightPanel["ready"]): RightPanel => ({
  head: bd("평시", OFF),
  todo: { badge: bd("0건", OFF), items: [] },
  doing: { badge: bd("0건", OFF), items: [], empty: "진행 중인 조치가 없습니다" },
  ready,
  log: [],
})

// ================================================================== 저염분 고수온
const aquaCalm: DashLeft = {
  chips: ["범위 제주 서남부 한경·대정", "출처 KHOA·위성·모델(연계 전)"],
  status: {
    title: "관측지점 상태",
    rows: [
      { name: "한경 금등", badge: bd("판단 전", OFF) },
      { name: "한경 용수", badge: bd("판단 전", OFF) },
      { name: "대정 일과", badge: bd("판단 전", OFF) },
    ],
    note: "관측값 없음 — 저염분수·고수온 도달 해당 없음 · 갱신 -",
  },
  steps: { done: 0, active: -1, note: "평시 — 진행 중인 사건이 없어 시작된 단계가 없습니다." },
  tiles: [
    { label: "활성 위험", value: "0건", sub: "진행 중 위험 없음" },
    { label: "승인 대기", value: "0건", sub: "승인 대기 없음" },
    { label: "영향 양식장", value: "0개소", sub: "영향 양식장 없음" },
    { label: "데이터 품질", value: "-", sub: "수집 데이터 없음" },
  ],
  brief: [["판단", "감지된 저염분수·고수온 신호 없음 — 염분·수온 관측값 없음"], ["전개", "저염분수 도달 해당 없음 · 고수온 도달 해당 없음"], ["대응", "경보 초안 없음 · 담당 기관 평시"]],
  briefLink: "관측·예측은 관측·판단 탭 →",
}
const aquaDetect: DashLeft = {
  chips: ["범위 제주 서남부 한경·대정", "기준 14:10"],
  status: {
    title: "관측지점 상태",
    rows: [
      { name: "한경 금등 · 27.6psu · 26.7℃", badge: bd("주의", "warning") },
      { name: "한경 용수 · 27.2psu · 26.9℃", badge: bd("주의", "warning") },
      { name: "대정 일과 · 30.6psu · 25.8℃", badge: bd("정상", "safe") },
    ],
    note: "저염분수 도달 약 31시간 후(한경 취수구) · 갱신 14:10",
  },
  steps: { done: 2, active: 2, note: "판단 단계 — 경보 초안 결재 2/4단계" },
  tiles: [
    { label: "활성 위험", value: "1건", sub: "저염분수 접근", tone: "warning" },
    { label: "승인 대기", value: "1건", sub: "경보 초안 결재 2/4", tone: "warning" },
    { label: "영향 양식장", value: "3개소", sub: "전일 대비 +1" },
    { label: "데이터 품질", value: "92%", sub: "수집 소스 4/5 정상" },
  ],
  brief: [["판단", "한경 용수 염분 27.2psu·수온 26.9℃ — 주의 단계"], ["전개", "한경 취수구 약 31시간 후 저염분수 도달 예상 · 고수온 해당 없음"], ["대응", "경보 발송 전 · 체크리스트 완료 2/5건"]],
  briefLink: "관측·예측은 관측·판단 탭 →",
}
const aquaTrigger = { name: "고수온 주의보 · 제주 동부 연안 (수산과학원 연동 전 임의 샘플)", advice: "기관 발표가 아닙니다 · 권장 조치: 경보 초안 결재 · 체크리스트 진행" }
const aquaDraft = (title: string) => ({ tag: "승인", title, detail: "결재 2/4단계 · 도달 예상 약 31시간 후(한경 취수구) · AI는 초안까지만 제공, 최종 발령은 담당자 승인 후", actions: okAct("승인", "반려"), link: { label: "경보 문안 확인·편집 →", route: "alert" as const } })

export const AQUA: BoardService = {
  id: "aqua",
  base: "/aqua",
  title: "저염분 고수온",
  dash: { calm: aquaCalm, detect: aquaDetect, progress: { ...aquaDetect, steps: { done: 3, active: 3, note: "경보 단계 — 초안 결재 2/4단계" } } },
  history: {
    id: "AQ-2026-0001 · 한경 용수 저염분수 주의 대응",
    title: "저염분 고수온",
    badge: bd("해제", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["위치", "제주시 한경 용수 인근"], ["기간", "10/03 14:10 → 10/05 09:30 (약 43시간 20분)"], ["최종 등급", "주의"]] },
      { title: "대응 경과", rows: [["10/03 14:10", "한경 용수 염분 27.2psu — 주의 진입"], ["10/03 15:30", "경보 초안 최종 승인 · 발송 완료"], ["10/04 09:00", "e-SOP 체크리스트 5/5 완료"], ["10/05 09:30", "염분 28.9psu 회복 — 해제"]] },
      { title: "예측 검증", rows: [["예측 염분(48시간 후)", "28.8psu"], ["실측 염분", "28.9psu"], ["오차", "0.1psu"]] },
      { title: "재학습", rows: [["대상", "ROMS·NEMO 편향보정"], ["상태", "다음 정기 학습 대기"], ["갱신", "10/05"]] },
    ],
    conditions: [
      { ok: true, text: "저염분수 도달 시각 오차 2시간 이내" },
      { ok: true, text: "위성 표층염분과 편차 0.4psu 이내" },
    ],
    report: [],
  },
  right: {
    calm: calm([
      { title: "경보 채널 — 문자(CBS/SMS)·현장 단말·상황판", sub: "연결 확인", badge: bd("3/3 연결", "safe") },
      { title: "수협·어촌계 전파", sub: "역할 협의 전", badge: bd("협의 전", OFF) },
    ]),
    detect: {
      head: bd("감지 후 30분", "warning"),
      trigger: aquaTrigger,
      todo: {
        badge: bd("3건 대기", "warning"),
        items: [
          { ...aquaDraft("저염분수 주의 경보 — 결재") },
          { tag: "확인", title: "e-SOP 미완료 조치 확인", detail: "미완료 3/5건 · 다음: 산소공급기·순환펌프 가동", actions: okAct("완료 체크"), link: { label: "운영 > e-SOP 대응 →", route: "esop" } },
          { tag: "확인", title: "데이터 수집 이상 조치", detail: "이상 1건 · 수집 소스 4/5 정상", actions: okAct("확인"), link: { label: "데이터 수집 보기 →", route: "data" } },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "승인 후 시작됩니다 — 현재 단계: 판단" },
      log: log(["14:10", "감지", "한경 용수 염분 27.2psu — 주의 진입"], ["14:00", "조치", "경보 초안 1차 검토 완료 — 재난안전과"], ["13:40", "조치", "한경 금등 염분 27.6psu · 경보 초안 작성"]),
    },
    progress: {
      head: bd("감지 후 30분", "alert"),
      trigger: aquaTrigger,
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          { ...aquaDraft("저염분수 주의 경보 초안 — 제주 서남부(한경·대정)"), detail: "결재 2/4단계 · 도달 예상 약 31시간 후(한경 취수구) · 모델 신뢰도 88% · AI는 초안까지만 제공, 최종 발령은 담당자 승인 후" },
          { tag: "확인", title: "체크리스트 — 산소공급기·순환펌프 가동", detail: "완료 2/5 · 다음: 출하·이송 조기 검토", actions: okAct("완료 체크"), link: { label: "운영 > e-SOP 대응 →", route: "esop" } },
        ],
      },
      doing: {
        badge: bd("5건", "info"),
        items: [
          { title: "경보 초안 결재", detail: "작성 ✓ · 1차 검토 ✓ · 승인 요청 ● · 최종 승인 ○", badge: bd("결재 2/4", "warning") },
          { title: "대응 체크리스트(e-SOP)", detail: "완료 2건 · 대기 3건", badge: bd("2/5 완료", "info") },
          { title: "현장 예찰 — 한경면·대정읍", detail: "한경 용수 예찰 · 대정 상시 관찰", badge: bd("예찰 중", "info") },
          { title: "예측 검증 — 해양수산연구원", badge: bd("검증 중", "info") },
          { title: "수협·어촌계 전파", detail: "어업인 경보 전파·마을어장 예찰 — 역할 협의 전", badge: bd("협의 전", OFF) },
        ],
      },
      log: log(["14:10", "감지", "한경 용수 염분 27.2psu — 주의 진입"], ["14:00", "조치", "경보 초안 1차 검토 완료 — 재난안전과"], ["13:40", "조치", "경보 초안 작성 — 상황관리자"]),
    },
    closed: {
      head: bd("종료 · 총 43시간 20분", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "재학습 반영 확인 — ROMS·NEMO 편향보정", detail: "다음 정기 학습 대기 · 예측 검증 오차 0.1psu", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: {
        badge: bd("0건", "safe"),
        items: [],
        empty: "진행 중인 조치가 없습니다 — 해제 후 예측 검증·재학습만 남았습니다",
        stats: [{ label: "완료", value: "6건" }, { label: "승인 대기", value: "0건" }, { label: "미실시·실패", value: "0건" }],
      },
      log: log(["10/05 09:30", "종료", "염분 28.9psu 회복 — 해제 · 종료 보고서 작성"], ["10/04 09:00", "조치", "e-SOP 체크리스트 5/5 완료"], ["10/03 15:30", "조치", "경보 초안 최종 승인 · 발송 완료"], ["10/03 14:10", "감지", "한경 용수 염분 27.2psu — 주의 진입"]),
    },
  },
}

// ================================================================== 연안 안전관리
const coastEmptyEvent = { badge: bd("0건", OFF), title: "평시 — 진행 중 이벤트 없음", detail: "AI가 익수 의심·위험구역 진입·이안류·월파를 감지하면 이곳에 올라옵니다." }
const coastCalm: DashLeft = {
  chips: ["범위 함덕·협재 해수욕장", "출처 AI CCTV·스마트폴(연계 전)"],
  status: {
    title: "해수욕장 상태",
    rows: [
      { name: "함덕 해수욕장", badge: bd("판단 전", OFF) },
      { name: "협재 해수욕장", badge: bd("판단 전", OFF) },
    ],
    note: "관측값 없음 — 평시 감시 중 · 갱신 -",
  },
  event: coastEmptyEvent,
  steps: { done: 0, active: -1, note: "평시 — 진행 중인 사건이 없어 시작된 단계가 없습니다." },
  tiles: [
    { label: "진행 중 이벤트", value: "0건", sub: "평시" },
    { label: "미확인", value: "0건", sub: "확인 대기 없음" },
    { label: "기관 공조", value: "0건", sub: "출동 공조 없음" },
    { label: "스마트폴", value: "-", sub: "등록된 기기 없음(설계 단계)" },
  ],
  brief: [["판단", "위험 신호 없음 — 이안류 위험 -, 영상 탐지 없음"], ["전개", "현재 위험 신호가 감지되지 않았습니다 — 평시 모니터링 유지 중"], ["대응", "위험 신호 감지 시 출동 요청 초안이 자동 생성됩니다"]],
  briefLink: "관측·판단 근거는 관측·판단 탭 →",
}
const coastDetect: DashLeft = {
  chips: ["범위 함덕·협재 해수욕장", "기준 14:30"],
  status: {
    title: "해수욕장 상태",
    rows: [
      { name: "협재 해수욕장 · 이안류 감지", badge: bd("주의", "warning") },
      { name: "함덕 해수욕장", badge: bd("정상", "safe") },
    ],
    note: "파고 1.8m · 풍속 11m/s — 주의 구간 · 갱신 14:30",
  },
  event: { badge: bd("1건", "warning"), title: "진행 중 이벤트", item: { name: "이안류 감지 · 협재 해수욕장", badge: bd("주의", "warning"), sub: "14:28 · AI CCTV · 미확인 · 신뢰도 87%" }, link: "경보 발송 상세 화면에서 승인 →" },
  steps: { done: 1, active: 1, note: "확인 단계 — 미확인 이벤트 1건" },
  tiles: [
    { label: "진행 중 이벤트", value: "1건", sub: "이안류 감지", tone: "warning" },
    { label: "미확인", value: "1건", sub: "확인 대기", tone: "warning" },
    { label: "기관 공조", value: "0건", sub: "출동 요청 초안 1건" },
    { label: "스마트폴", value: "-", sub: "등록된 기기 없음(설계 단계)" },
  ],
  brief: [["판단", "협재 이안류 감지(신뢰도 87%) — 주의 구간"], ["전개", "파고 상승 중 · 시간당 이용객 약 100명(상한 150)"], ["대응", "대외 경보 승인 대기 · 출동 요청 초안 생성"]],
  briefLink: "관측·판단 근거는 관측·판단 탭 →",
}
const coastProgress: DashLeft = {
  ...coastDetect,
  chips: ["범위 함덕·협재 해수욕장", "기준 14:36"],
  status: { ...coastDetect.status, rows: [{ name: "협재 해수욕장 · 이안류 감지", badge: bd("경계", "alert") }, { name: "함덕 해수욕장", badge: bd("정상", "safe") }] },
  event: { badge: bd("1건", "alert"), title: "진행 중 이벤트", item: { name: "이안류 감지 · 협재 해수욕장", badge: bd("경계", "alert"), sub: "14:28 · AI CCTV · 미확인 · 신뢰도 87%" }, link: "경보 발송 상세 화면에서 확인 →" },
  steps: { done: 4, active: 4, note: "대응 단계 — 경보 발령 · 출동 중 · 채널 실패 1건" },
  tiles: [
    { label: "진행 중 이벤트", value: "1건", sub: "이안류 감지", tone: "alert" },
    { label: "미확인", value: "0건", sub: "" },
    { label: "기관 공조", value: "3곳", sub: "해경 · 119 · 서귀포시", tone: "warning" },
    { label: "스마트폴", value: "-", sub: "등록된 기기 없음(설계 단계)" },
  ],
  brief: [["판단", "협재 이안류 감지(신뢰도 87%) — 주의 구간"], ["전개", "파고 상승 중 · 시간당 이용객 약 100명(상한 150)"], ["대응", "주의 경보 발령(14:34) → 경계 상향(14:36) · 출동 중 · 현장 채널 실패 1건"]],
}
export const COAST: BoardService = {
  id: "coast",
  base: "/coast",
  title: "연안 안전관리",
  dash: { calm: coastCalm, detect: coastDetect, progress: coastProgress },
  history: {
    id: "CO-2026-0001 · 협재 이안류 대응",
    title: "연안 안전관리",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "이안류 감지"], ["위치", "협재 해수욕장 서쪽 구간"], ["소요 시간", "약 2시간 (14:28 ~ 16:30)"], ["대응 기관", "4곳 (해경·119·재난안전과·서귀포시 상황실)"]] },
      { title: "AI 분석 요약", rows: [["최초 감지 → 승인", "6분"], ["AI 신뢰도", "87%"], ["오탐 여부", "실제 이안류 확인 (해경 현장 확인)"], ["최고 단계", "경계"]] },
      { title: "관측 결과", rows: [["최대 파고", "2.6m (KHOA 중문)"], ["최대 풍속", "14.2m/s"], ["최고 이용객", "시간당 106명"], ["조치 실패", "1건 (지향성 스피커 통신)"]] },
    ],
    conditions: [
      { ok: true, text: "파고 1.5m 미만 30분 유지" },
      { ok: true, text: "해경 현장 확인 완료" },
      { ok: false, text: "지향성 스피커 통신 복구(직접 확인)" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "연안 이안류 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "해당 없음"], ["개선 사항", "지향성 스피커 통신 이중화 검토"]],
  },
  right: {
    calm: calm([
      { title: "현장 경보 채널 — LED 경광·지향성 스피커·음성 안내", sub: "스마트폴 설계 단계 — 구축 예정", badge: bd("구축 예정", OFF) },
      { title: "관계 기관 — 해경·소방", sub: "실시간 SMS 전파 체계", badge: bd("등록됨", "info") },
    ]),
    detect: {
      head: bd("감지 후 10분", "warning"),
      trigger: { name: "풍랑주의보 발효 중 · 제주도앞바다", advice: "권장 조치: 대외 경보 승인 검토 · 출동 요청 대기" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          { tag: "승인", title: "이안류 감지 · 협재 — 대외 경보 발령 승인", detail: "신뢰도 87% · 주의 구간 · 파고 1.8m · 문안 확인 후 승인", actions: okAct("승인", "반려"), link: { label: "경보 문안 확인·편집 →", route: "alert" } },
          { tag: "승인", title: "해경·소방 출동 요청(초안)", detail: "14:30 요청 초안 생성 · 제주해양경찰서·119 해상구조대", actions: okAct("승인", "반려"), link: { label: "출동 요청서 보기 →", route: "dispatch" } },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "승인 후 시작됩니다 — 현재 단계: 확인" },
      log: log(["14:30", "조치", "출동 요청 초안 생성 — 해경·소방"], ["14:28", "감지", "이안류 감지 — 협재 해수욕장 (AI CCTV)"], ["14:20", "감지", "파고 1.6m → 1.8m 상승 — 주의 구간(KHOA 부이)"]),
    },
    progress: {
      head: bd("감지 후 8분", "alert"),
      trigger: { name: "풍랑주의보 발효 중 · 제주도앞바다", advice: "권장 조치: 현장 채널 실패 점검 · 입수 통제 유지" },
      todo: {
        badge: bd("조치 필요 2건", "alert"),
        items: [
          { tag: "조치 실패", fail: true, title: "지향성 스피커 응답 없음 — 현장 안전요원 수동 안내 필요", detail: "14:36 원인 통신 두절 · 현장 안전요원 수동 안내를 요청했습니다", actions: okAct("수동 안내 요청 접수 확인"), link: { label: "경보 발송 상세 →", route: "alert" } },
          { tag: "확인", title: "체크리스트(경계) — 입수 통제·관계기관(해경) 통보", detail: "진행 중 · 다음: 대피 안내·출동 요청·경보 발령(심각)", actions: okAct("완료 체크"), link: { label: "운영 > e-SOP 대응 →", route: "esop" } },
        ],
      },
      doing: {
        badge: bd("5건", "info"),
        items: [
          { title: "경보 발송 — 협재 이안류 주의 경보", detail: "14:34 발령 → 14:36 경계 상향 · 승인 재난안전과장(샘플)", badge: bd("발령", "warning") },
          { title: "현장 경보 채널", detail: "LED 경광 · 음성 안내 · 관제자 알림 정상 / 지향성 스피커 응답 없음", badge: bd("일부 실패", "alert") },
          { title: "출동 요청 — 제주해양경찰서·119 해상구조대", detail: "연안구조정 1척(샘플) 도착 예상 14:48", badge: bd("출동 중", "info") },
          { title: "관계 기관 SMS 전파 — 해경·소방", detail: "사고 감지 시 실시간 전파", badge: bd("발송 완료", "safe") },
          { title: "기관 공조", detail: "해경 출동 중 · 제주시 상황 공유 완료 · 서귀포시 현장 지원", badge: bd("공조 중", "info") },
        ],
      },
      log: log(["14:36", "조치", "지향성 스피커 응답 없음 — 현장 수동 안내 요청"], ["14:36", "판단", "위험도 주의 → 경계 상향 — 파고 2.6m"], ["14:36", "조치", "연안구조정 출동 — 해경·119"], ["14:34", "조치", "주의 경보 발령 · 출동 요청 승인"], ["14:28", "감지", "이안류 감지 — 협재 해수욕장 (AI CCTV)"]),
    },
    closed: {
      head: bd("종료 · 총 2시간 2분", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "지향성 스피커 통신 복구(직접 확인)", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: {
        badge: bd("0건", "safe"),
        items: [],
        empty: "진행 중인 조치가 없습니다 — 실패 1건은 지향성 스피커 응답 없음(14:36)",
        stats: [{ label: "완료", value: "5건" }, { label: "승인 대기", value: "0건" }, { label: "미실시·실패", value: "1건", bad: true }],
      },
      log: log(["16:30", "종료", "사건 종료 — 종료 보고서 작성 (재난안전과)"], ["16:00", "판단", "경계 → 주의 하향 · 입수 통제 해제"], ["14:36", "판단", "위험도 주의 → 경계 상향 — 파고 2.6m"], ["14:28", "감지", "이안류 감지 — 협재 해수욕장 (AI CCTV)"]),
    },
  },
}
