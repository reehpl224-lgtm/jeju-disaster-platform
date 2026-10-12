import { bd, type BoardService, type DashLeft, type LogItem, type ReadyItem, type RightPanel, type TodoItem } from "./boardTypes"

/** 서비스 보드 샘플 데이터 B — 산불 · 지진해일 · 대설(참고 감시형: 자체 자료 없음, 기상청 특보·참고 지표만). 값은 모두 샘플. */

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

// ================================================================== 산불
const fireExt = { title: "레거시·외부 시스템 연계 — 산불 정보 (산림청 산불상황·산불위험예보)", badge: bd("미연계", OFF), detail: "산림청 · 제주특별자치도 · 연계 대상·방식 조사 전" }
const fireCalm: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청·Open-Meteo(참고)"],
  status: {
    title: "서비스 상태",
    badge: bd("미연계", OFF),
    heading: "산불 발생·진화 현황 미연계 · 참고 감시 중",
    lines: ["산불 정보가 아직 연계 전이라 \"이상 없음\"을 뜻하지 않습니다. 기상청 건조·강풍 특보와 습도·풍속 예보를 참고합니다."],
  },
  tiles: [
    { label: "건조·강풍 겹침(48h)", value: "0시간", sub: "제주시 기준" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최저 습도(48h)", value: "52%", sub: "기준 35% 이하" },
    { label: "최대 풍속(48h)", value: "5.8m/s", sub: "기준 7m/s 이상" },
  ],
  brief: [["판단", "참고 지표상 건조·강풍 겹침 없음(48시간)"], ["전개", "산불 정보 연계 전 — 특보·예보로만 참고"], ["대응", "경보 발송 없음"]],
  briefLink: "기상 조건·추이는 관측·판단 탭 →",
  ext: fireExt,
}
const fireDetect: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청·Open-Meteo(참고)", "기준 03/12 14:00"],
  status: { title: "서비스 상태", badge: bd("건조주의보", "warning"), heading: "산불 정보 미연계", lines: ["건조·강풍 겹침 7시간 예상 (제주시·한라산 참고)"] },
  tiles: [
    { label: "건조·강풍 겹침(48h)", value: "7시간", sub: "제주시 기준", tone: "warning" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최저 습도(48h)", value: "28%", sub: "기준 35% 이하", tone: "warning" },
    { label: "최대 풍속(48h)", value: "9.4m/s", sub: "기준 7m/s 이상", tone: "warning" },
  ],
  brief: [["판단", "건조주의보 발표 · 건조·강풍 겹침 7시간 예상"], ["전개", "오늘 오후~밤 습도 하락·강풍 — 산림청 상황은 미연계"], ["대응", "경보 발송 전"]],
  briefLink: "기상 조건·추이는 관측·판단 탭 →",
  ext: fireExt,
}
export const WILDFIRE: BoardService = {
  id: "wildfire",
  base: "/wildfire",
  title: "산불",
  dash: {
    calm: fireCalm,
    detect: fireDetect,
    progress: {
      ...fireDetect,
      tiles: fireDetect.tiles.map((t) => (t.label === "발령 경보" ? { ...t, value: "1건", tone: "warning" as const } : t)),
      brief: [["판단", "건조주의보 발표 · 건조·강풍 겹침 7시간 예상"], ["전개", "오늘 오후~밤 습도 하락·강풍 — 산림청 상황은 미연계"], ["대응", "산불 주의 안내 발령(13:30) · 문자 실패 49건 재발송 검토"]],
    },
  },
  history: {
    id: "SF-2026-0001 · 산불 주의 안내 종료",
    title: "산불",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "산불 주의(건조·강풍)"], ["위치", "한라산 인근 지역"], ["소요 시간", "약 19시간 (03/12 11:00 ~ 03/13 06:00)"], ["대응 기관", "2곳 (제주도 재난안전과 · 산림부서)"]] },
      { title: "관측 결과(참고 지표)", rows: [["최저 습도(예보)", "28% (제주시)"], ["최대 풍속(예보)", "9.4m/s"], ["건조·강풍 겹침", "7시간"]] },
    ],
    conditions: [
      { ok: true, text: "건조·강풍 특보 해제 확인" },
      { ok: true, text: "겹침 시간 해소(예보 기준)" },
      { ok: false, text: "산림청 산불 상황 확인(연계 전 — 직접 확인)" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "산불 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "해당 없음"], ["개선 사항", "산림청 산불 정보 연계 일정 협의"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)·재해문자전광판", sub: "연결 확인", badge: bd("2/2 연결", "safe") },
      { title: "산림청 산불 상황", sub: "연계 전 — 참고 지표만 표시", badge: bd("미연계", OFF) },
    ]),
    detect: {
      head: bd("감지 후 3시간", "warning"),
      trigger: { name: "건조주의보 발효 중 · 제주도산지", advice: "권장 조치: 산불 경보 발령 여부 판단 · 산림청 연계 확인(미연계)" },
      todo: {
        badge: bd("1건 대기", "warning"),
        items: [{ tag: "확인", title: "산불 경보 발령 여부 판단", detail: "건조·강풍 겹침 7시간 예상 · 산림청 상황은 미연계", actions: okAct("확인"), link: { label: "근거 보기 →", route: "analysis" } }],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "확인 후 시작됩니다 — 현재 단계: 확인" },
      log: log(["14:00", "감지", "건조·강풍 겹침 감지 — 제주시 7시간 예상(참고)"], ["11:00", "감지", "기상청 발표 · 건조주의보 — 제주도산지"]),
    },
    progress: {
      head: bd("감지 후 2시간 32분", "alert"),
      trigger: { name: "건조주의보 발효 중 · 제주도산지", advice: "권장 조치: 입산·화기 취급 자제 안내 확인 · 산림청 연계 여부 확인" },
      todo: { badge: bd("1건 대기", "warning"), items: [retry("문자(CBS/SMS) 발송 실패 49건", "발송 8,300건 · 성공 8,251 · 최종 13:32")] },
      doing: {
        badge: bd("4건", "info"),
        items: [
          { title: "산불 주의 안내 — 건조·강풍 주의", detail: "한라산 인근 · 13:30 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.4%", badge: bd("일부 미전달", "warning") },
          { title: "재해문자전광판", detail: "6개소 모두 100%", badge: bd("발송 완료", "safe") },
          { title: "산림청 산불 상황", detail: "연계 전 — 참고 지표만 표시", badge: bd("미연계", OFF) },
        ],
      },
      log: log(["13:32", "조치", "문자 발송 완료 — 성공 8,251 · 실패 49"], ["13:30", "조치", "산불 주의 안내 발령 — 한라산 인근 (승인 재난안전과장)"], ["11:00", "감지", "기상청 발표 · 건조주의보 — 제주도산지"]),
    },
    closed: {
      head: bd("종료 · 총 19시간", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "산림청 산불 상황 확인(연계 전 — 직접 확인)", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 49건(재발송 검토)", stats: closedStats("4건", "1건") },
      log: log(["03/13 06:00", "종료", "기상청 발표 · 건조·강풍 특보 해제 — 제주도산지"], ["03/12 13:30", "조치", "산불 주의 안내 발령 — 한라산 인근"], ["03/12 11:00", "감지", "기상청 발표 · 건조주의보 — 제주도산지"]),
    },
  },
}

// ================================================================== 지진해일
const tsExt = { title: "레거시·외부 시스템 연계 — 민방위경보시스템", badge: bd("미연계", OFF), detail: "도 · 중앙 시스템과만 연계, 도 자체 연계 없음" }
const tsCalm: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보 · USGS(참고)"],
  status: {
    title: "서비스 상태",
    badge: bd("미연계", OFF),
    heading: "지진해일 통보 미연계 · 참고 감시 중",
    lines: ["기상청 지진·지진해일 통보문과 민방위경보가 아직 연계 전이라 \"이상 없음\"을 뜻하지 않습니다. 기상청 특보와 최근 지진을 참고합니다."],
  },
  tiles: [
    { label: "최근 1주 지진", value: "3건", sub: "규모 4.5 이상·동아시아" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최대 규모(USGS)", value: "M4.8", sub: "참고" },
    { label: "제주 최근접", value: "1,420km", sub: "참고" },
  ],
  brief: [["판단", "최근 1주 규모 4.5 이상 지진 3건 — 제주 1,400km 이상 거리(참고)"], ["전개", "통보문 연동 전 — 기상청 지진해일 특보로만 확인"], ["대응", "경보 발송 없음"]],
  briefLink: "최근 지진·특보는 관측·판단 탭 →",
  ext: tsExt,
}
const tsDetect: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보 · USGS(참고)", "기준 03/12 14:40"],
  status: { title: "서비스 상태", badge: bd("지진해일주의보", "warning"), heading: "통보문 미연계", lines: ["제주도남쪽먼바다 · 제주도앞바다에 기상청 지진해일주의보 발표"] },
  tiles: [
    { label: "최근 1주 지진", value: "7건", sub: "규모 4.5 이상·동아시아", tone: "warning" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최대 규모(USGS)", value: "M6.8", sub: "참고 · 해일 경고 표시", tone: "warning" },
    { label: "제주 최근접", value: "520km", sub: "참고" },
  ],
  brief: [["판단", "지진해일주의보 발표 · USGS M6.8 지진(제주 520km)은 참고"], ["전개", "해일 도달 시각은 기상청 통보문 기준 — 통보문 미연동"], ["대응", "대피 안내 발송 전"]],
  briefLink: "최근 지진·특보는 관측·판단 탭 →",
  ext: tsExt,
}
export const TSUNAMI: BoardService = {
  id: "tsunami",
  base: "/tsunami",
  title: "지진해일",
  dash: {
    calm: tsCalm,
    detect: tsDetect,
    progress: {
      ...tsDetect,
      chips: ["범위 제주 전체", "출처 기상청 특보 · USGS(참고)", "기준 03/12 15:00"],
      tiles: tsDetect.tiles.map((t) => (t.label === "발령 경보" ? { ...t, value: "1건", tone: "warning" as const } : t)),
      brief: [["판단", "지진해일주의보 발표 · USGS M6.8 지진(제주 520km)은 참고"], ["전개", "해일 도달 시각은 기상청 통보문 기준 — 통보문 미연동"], ["대응", "대피 안내 발령(14:55) · 문자 실패 173건 재발송 검토"]],
    },
  },
  history: {
    id: "TS-2026-0001 · 지진해일주의보 종료",
    title: "지진해일",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "지진해일주의보"], ["위치", "제주도남쪽먼바다 · 제주도앞바다"], ["소요 시간", "약 5시간 (03/12 14:40 ~ 03/12 19:40)"], ["대응 기관", "2곳 (제주도 재난안전과 · 해양경찰)"]] },
      { title: "관측 결과(참고 지표)", rows: [["USGS 최대 규모", "M6.8 (참고)"], ["제주까지 거리", "520km"], ["기상청 특보", "지진해일주의보 1회 발표"]] },
    ],
    conditions: [
      { ok: true, text: "지진해일특보 해제 확인" },
      { ok: true, text: "대피 안내 해제 문자 발송" },
      { ok: false, text: "해안 시설 점검(직접 확인)" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "지진해일 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "조사 중"], ["개선 사항", "기상청 통보문·해안 대피소 자료 연계 협의"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)·재해문자전광판", sub: "연결 확인", badge: bd("2/2 연결", "safe") },
      { title: "민방위경보시스템 · 기상청 통보문", sub: "중앙 시스템과만 연계 · 통보문 미연동", badge: bd("미연계", OFF) },
    ]),
    detect: {
      head: bd("감지 후 28분", "warning"),
      trigger: { name: "지진해일주의보 발효 중 · 제주도남쪽먼바다 외 1곳", advice: "권장 조치: 대피 안내 판단 · 민방위경보 연계 확인" },
      todo: {
        badge: bd("3건 대기", "warning"),
        items: [
          { tag: "확인", title: "지진해일 특보 확인 · 대피 안내 판단", detail: "USGS M6.8 지진(제주 520km)은 참고 · 통보문 미연동", actions: okAct("확인"), link: { label: "근거 보기 →", route: "analysis" } },
          { tag: "지시", title: "해안 저지대 접근 통제·대피소 점검", detail: "지시 권고", actions: okAct("지시") },
          { tag: "확인", title: "민방위경보시스템 연계 확인", detail: "병행 조치 확인 · 중앙 시스템과만 연계", actions: okAct("확인") },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "확인 후 시작됩니다 — 현재 단계: 확인" },
      log: log(["14:40", "감지", "기상청 발표 · 지진해일주의보 — 제주도남쪽먼바다 외 1곳"], ["14:12", "감지", "USGS 규모 6.8 지진 감지(참고) — 제주 520km"]),
    },
    progress: {
      head: bd("감지 후 17분", "alert"),
      trigger: { name: "지진해일주의보 발효 중 · 제주도남쪽먼바다 외 1곳", advice: "권장 조치: 해안 저지대 대피 안내 확인 · 민방위경보 연계 확인" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          retry("문자(CBS/SMS) 발송 실패 173건", "발송 21,600건 · 성공 21,427 · 최종 14:57"),
          { tag: "확인", title: "민방위경보시스템 연계 확인", detail: "중앙 시스템과만 연계 — 도 자체 연계 없음", actions: okAct("확인") },
        ],
      },
      doing: {
        badge: bd("4건", "info"),
        items: [
          { title: "대피 안내 — 해안 저지대 대피", detail: "제주도 해안 저지대 · 14:55 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.2%", badge: bd("일부 미전달", "warning") },
          { title: "재해문자전광판", detail: "18개소 모두 100%", badge: bd("발송 완료", "safe") },
          { title: "병행 조치 — 민방위경보 연계", detail: "도 자체 연계 없음", badge: bd("확인 필요", "warning") },
        ],
      },
      log: log(["14:57", "조치", "문자 발송 완료 — 성공 21,427 · 실패 173"], ["14:55", "조치", "대피 안내 발령 — 제주도 해안 저지대 (승인 재난안전과장)"], ["14:40", "감지", "기상청 발표 · 지진해일주의보 — 제주도남쪽먼바다 외 1곳"]),
    },
    closed: {
      head: bd("종료 · 총 5시간", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "해안 시설 점검(직접 확인)", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 173건(재발송 검토)", stats: closedStats("4건", "1건") },
      log: log(["19:40", "종료", "기상청 발표 · 지진해일주의보 해제 — 제주도남쪽먼바다 외 1곳"], ["14:55", "조치", "대피 안내 발령 — 제주도 해안 저지대"], ["14:40", "감지", "기상청 발표 · 지진해일주의보 — 제주도남쪽먼바다 외 1곳"]),
    },
  },
}

// ================================================================== 대설
const snowExt = { title: "레거시·외부 시스템 연계 — 자치경찰단 교통정보센터", badge: bd("미연계", OFF), detail: "자치경찰단 · ITS센터 CCTV는 예산·라이선스 문제로 일부만 연계 검토" }
const snowCalm: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보 · Open-Meteo(참고)"],
  status: {
    title: "서비스 상태",
    badge: bd("미연계", OFF),
    heading: "적설 관측 미연계 · 참고 감시 중",
    lines: ["적설계 실측과 도로 결빙·제설 현황이 아직 연계 전이라 \"이상 없음\"을 뜻하지 않습니다. 기상청 특보와 적설·기온 예보를 참고합니다."],
  },
  tiles: [
    { label: "48h 누적 적설", value: "0.0cm", sub: "제주시 기준" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최대 적설깊이", value: "0cm", sub: "제주시 기준" },
    { label: "최저 기온(48h)", value: "4.2℃", sub: "0℃ 이하 시 강조" },
  ],
  brief: [["판단", "참고 지표상 48시간 내 적설 예보 없음"], ["전개", "적설 관측 연계 전 — 특보·예보로만 참고"], ["대응", "경보 발송 없음"]],
  briefLink: "적설·기온 추이는 관측·판단 탭 →",
  ext: snowExt,
}
const snowDetect: DashLeft = {
  chips: ["범위 제주 전체", "출처 기상청 특보 · Open-Meteo(참고)", "기준 01/18 14:00"],
  status: { title: "서비스 상태", badge: bd("대설주의보", "warning"), heading: "적설 관측 미연계", lines: ["48시간 누적 적설 14.2cm 예상 (제주시·한라산 참고)"] },
  tiles: [
    { label: "48h 누적 적설", value: "14.2cm", sub: "제주시 기준", tone: "warning" },
    { label: "발령 경보", value: "없음", sub: "" },
    { label: "최대 적설깊이", value: "9cm", sub: "제주시 기준" },
    { label: "최저 기온(48h)", value: "-3.1℃", sub: "0℃ 이하", tone: "warning" },
  ],
  brief: [["판단", "대설주의보 발표 · 48시간 누적 적설 14.2cm 예상"], ["전개", "오늘 밤~내일 새벽 적설 집중 · 기온 0℃ 이하 — 결빙 우려"], ["대응", "경보 발송 전"]],
  briefLink: "적설·기온 추이는 관측·판단 탭 →",
  ext: snowExt,
}
export const SNOW: BoardService = {
  id: "snow",
  base: "/snow",
  title: "대설",
  dash: {
    calm: snowCalm,
    detect: snowDetect,
    progress: {
      ...snowDetect,
      tiles: snowDetect.tiles.map((t) => (t.label === "발령 경보" ? { ...t, value: "1건", tone: "warning" as const } : t)),
      brief: [["판단", "대설주의보 발표 · 48시간 누적 적설 14.2cm 예상"], ["전개", "오늘 밤~내일 새벽 적설 집중 · 기온 0℃ 이하 — 결빙 우려"], ["대응", "대설 안내 발령(12:30) · 문자 실패 34건 재발송 검토"]],
    },
  },
  history: {
    id: "SN-2026-0001 · 대설주의보 종료",
    title: "대설",
    badge: bd("종료", "safe"),
    owner: "확인: 재난안전과장",
    sections: [
      { title: "사건 개요", rows: [["유형", "대설주의보"], ["위치", "제주도산지"], ["소요 시간", "약 22시간 (01/18 11:00 ~ 01/19 09:00)"], ["대응 기관", "2곳 (제주도 재난안전과 · 자치경찰단)"]] },
      { title: "관측 결과(참고 지표)", rows: [["48h 누적 적설(예보)", "14.2cm (제주시)"], ["최대 적설깊이(예보)", "9cm"], ["최저 기온(예보)", "-3.1℃"]] },
    ],
    conditions: [
      { ok: true, text: "대설·한파 특보 해제 확인" },
      { ok: true, text: "대설 안내 해제 문자 발송" },
      { ok: false, text: "도로 결빙·제설 상황 확인(연계 전 — 직접 확인)" },
    ],
    report: [["작성 부서", "재난안전과"], ["적용 SOP", "대설 대응 SOP"], ["인명 피해", "없음"], ["재산 피해", "조사 중"], ["개선 사항", "교통정보센터 CCTV 연계 협의"]],
  },
  right: {
    calm: calmRight([
      { title: "경보 채널 — 문자(CBS/SMS)·재해문자전광판", sub: "연결 확인", badge: bd("2/2 연결", "safe") },
      { title: "교통정보센터 · 적설 관측", sub: "자치경찰단 · 연계 전", badge: bd("연계 전", OFF) },
    ]),
    detect: {
      head: bd("감지 후 3시간", "warning"),
      trigger: { name: "대설주의보 발효 중 · 제주도산지", advice: "권장 조치: 대설 경보 발령 판단 · 도로 결빙 점검" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          { tag: "확인", title: "대설 경보 발령 여부 판단", detail: "48시간 누적 적설 14.2cm 예상 · 적설 관측은 미연계", actions: okAct("확인"), link: { label: "근거 보기 →", route: "analysis" } },
          { tag: "지시", title: "도로 결빙·제설 구간 점검", detail: "지시 권고", actions: okAct("지시") },
        ],
      },
      doing: { badge: bd("0건", OFF), items: [], empty: "확인 후 시작됩니다 — 현재 단계: 확인" },
      log: log(["14:00", "감지", "적설 예보 감지 — 제주시 48시간 14.2cm 예상(참고)"], ["11:00", "감지", "기상청 발표 · 대설주의보 — 제주도산지"]),
    },
    progress: {
      head: bd("감지 후 1시간 32분", "alert"),
      trigger: { name: "대설주의보 발효 중 · 제주도산지", advice: "권장 조치: 도로 결빙·낙상 주의 안내 확인 · 교통정보센터 연계 확인" },
      todo: {
        badge: bd("2건 대기", "warning"),
        items: [
          retry("문자(CBS/SMS) 발송 실패 34건", "발송 6,900건 · 성공 6,866 · 최종 12:32"),
          { tag: "확인", title: "교통정보센터 연계 확인", detail: "자치경찰단 · 연계 전 — ITS센터 CCTV는 일부만 연계 검토", actions: okAct("확인") },
        ],
      },
      doing: {
        badge: bd("4건", "info"),
        items: [
          { title: "대설 안내 — 도로 결빙·낙상 주의", detail: "한라산 인근·산간도로 · 12:30 발령 · 승인 재난안전과장", badge: bd("발령", "warning") },
          { title: "문자(CBS/SMS)", detail: "성공률 99.5%", badge: bd("일부 미전달", "warning") },
          { title: "재해문자전광판", detail: "8개소 모두 100%", badge: bd("발송 완료", "safe") },
          { title: "교통정보센터", detail: "자치경찰단 · 연계 전", badge: bd("연계 전", OFF) },
        ],
      },
      log: log(["12:32", "조치", "문자 발송 완료 — 성공 6,866 · 실패 34"], ["12:30", "조치", "대설 안내 발령 — 한라산 인근 (승인 재난안전과장)"], ["11:00", "감지", "기상청 발표 · 대설주의보 — 제주도산지"]),
    },
    closed: {
      head: bd("종료 · 총 22시간", "safe"),
      todo: { badge: bd("후속 1건", "info"), items: [{ tag: "확인", title: "도로 결빙·제설 상황 확인(연계 전 — 직접 확인)", detail: "종료 조건 중 확인 1건 · 확인 후 종료 보고에 반영", actions: okAct("확인 완료"), link: { label: "종료 보고 보기 →", route: "closure" } }] },
      doing: { badge: bd("0건", "safe"), items: [], empty: "진행 중인 조치가 없습니다 — 실패 1건은 문자 34건(재발송 검토)", stats: closedStats("4건", "1건") },
      log: log(["01/19 09:00", "종료", "기상청 발표 · 대설주의보 해제 — 제주도산지"], ["01/18 12:30", "조치", "대설 안내 발령 — 한라산 인근"], ["01/18 11:00", "감지", "기상청 발표 · 대설주의보 — 제주도산지"]),
    },
  },
}
