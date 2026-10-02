/**
 * 실증 3사(하천·연안·저염분) 샘플 배치 데이터 — 실증사 연계 전까지 종합상황(화면목록 S1-02)의 자리 채움용 임의 데이터.
 * 같은 "시(hour)"에는 항상 같은 값을 내는 결정적 생성기라, 배치(npm run batch:pilot)로 JSON을 뽑아도 화면에서 바로 만들어도 같다.
 * 실증사 데이터가 붙으면 같은 모양(PilotBatch)의 JSON을 public/data/pilot-batch.json에 넣어 교체한다.
 *
 * 이 파일은 Node에서 직접 import해 쓰므로(scripts/pilot-batch.mjs) 다른 모듈을 import하지 않는다.
 * 등급 기준은 riverAlertThresholds.ts(하천 Q%)·mockAqua.ts(염분)의 값을 그대로 옮긴 것이다 — 그쪽이 바뀌면 여기도 맞춘다.
 */
export type SampleLevel = "safe" | "caution" | "warning" | "alert" | "danger"

export interface RiverSamplePoint {
  id: string
  name: string
  /** 확정 관측지점(돈내코·쇠소깍)이면 true, 나머지는 샘플 */
  confirmed: boolean
  lat: number
  lng: number
  levelM: number
  flowRatioPercent: number
  level: SampleLevel
  /** 최근 60분(10분 간격, 마지막이 현재) */
  history: { t: string; levelM: number }[]
  /** 예측 수위 — 10·30·60분 후 */
  forecast: { minutes: 10 | 30 | 60; levelM: number }[]
}

export interface PilotBatch {
  version: 1
  /** 실증사 연계 전 임의 샘플 */
  source: "sample"
  /** "YYYY-MM-DDTHH:mm" (Asia/Seoul) */
  generatedAt: string
  river: {
    boundaryM: number
    points: RiverSamplePoint[]
    /** 쇠소깍 감조구간 — 조위와 수위(−12h~+12h, 현재 이후는 예측) */
    tide: { t: string; tideM: number; levelM: number; predicted: boolean }[]
    smartPoles: { id: string; name: string; status: "정상" | "점검" | "오류"; batteryPercent: number }[]
  }
  coast: {
    sites: { id: string; name: string; lat: number; lng: number }[]
    /** 시간당 이용객 수(−12h~현재) */
    crowd: { siteId: string; name: string; limit: number; series: { t: string; count: number }[] }[]
    /** VLM 10분 상황요약(최신순) */
    vlmSummaries: { at: string; siteId: string; text: string; level: SampleLevel }[]
    /** 위험 4단계(관심·주의·경계·심각)별 조치 체크리스트 */
    checklist: { stage: "관심" | "주의" | "경계" | "심각"; action: string; done: boolean }[]
    currentStage: "평시" | "관심" | "주의" | "경계" | "심각"
  }
  aqua: {
    /** 저염수 확산 히트맵 격자(0.02° 간격) — 육지 칸은 화면에서 가린다 */
    heatmap: { horizonHours: 48 | 120; cells: { lat: number; lng: number; salinity: number; level: SampleLevel }[] }[]
    /** 한경 해역 표층 염분·수온(−24h~+24h, 현재 이후는 예측) */
    series: { t: string; salinity: number; tempC: number; predicted: boolean }[]
    /** 취수구별 저염수(30psu 미만) 도달 예상 시간 — 120시간 안에 오지 않으면 null */
    intakes: { id: string; name: string; etaHours: number | null; level: SampleLevel }[]
    checklist: { item: string; done: boolean }[]
  }
}

// ---------------------------------------------------------------- 결정적 난수
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number) => String(n).padStart(2, "0")
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const shift = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000)
const r2 = (n: number) => Math.round(n * 100) / 100

/** 하천 Q% → 등급 (riverAlertThresholds.ts classifyRiverRisk) */
const riverLevel = (q: number): SampleLevel => (q < 20 ? "safe" : q < 50 ? "caution" : q < 70 ? "warning" : q < 100 ? "alert" : "danger")
/** 표층 염분 → 등급 (mockAqua.ts salinityLevels) */
const salinityLevel = (s: number): SampleLevel => (s >= 30 ? "safe" : s >= 28 ? "caution" : s >= 26 ? "warning" : s >= 24 ? "alert" : "danger")

// ---------------------------------------------------------------- 저염수 확산 모델(샘플)
const PLUME_ORIGIN = { lat: 33.3, lng: 126.02 }
const PLUME_TARGET = { lat: 33.3, lng: 126.18 }
/** 위경도 (lat,lng)의 h시간 뒤 표층 염분 — 서쪽 외해에서 한경 해안 쪽으로 번지는 가우시안 */
function plumeSalinity(lat: number, lng: number, hours: number, strength: number) {
  const k = Math.min(1, hours / 120)
  const cx = PLUME_ORIGIN.lng + (PLUME_TARGET.lng - PLUME_ORIGIN.lng) * k
  const cy = PLUME_ORIGIN.lat + (PLUME_TARGET.lat - PLUME_ORIGIN.lat) * k
  const sigma = 0.07 + 0.09 * k
  const d2 = (lng - cx) ** 2 + (lat - cy) ** 2
  return 33.2 - strength * Math.exp(-d2 / (2 * sigma * sigma))
}

const INTAKES = [
  { id: "hangyeong", name: "한경 취수구(샘플)", lat: 33.325, lng: 126.17 },
  { id: "goksan", name: "고산 취수구(샘플)", lat: 33.295, lng: 126.16 },
  { id: "daejeong", name: "대정 취수구(샘플)", lat: 33.23, lng: 126.22 },
]

// ---------------------------------------------------------------- 생성
export function generatePilotBatch(base: Date = new Date()): PilotBatch {
  const hour = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), 0)
  const rand = mulberry32(hour.getFullYear() * 1_000_000 + (hour.getMonth() + 1) * 10_000 + hour.getDate() * 100 + hour.getHours())
  const now = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), Math.floor(base.getMinutes() / 10) * 10)

  // ---- 하천: 효돈천 6개소
  const boundaryM = 3
  const activity = 0.25 + 0.75 * rand()
  const defs = [
    { id: "donnaeko", name: "효돈천(돈내코)", confirmed: true, lat: 33.276, lng: 126.593 },
    { id: "soesokkak", name: "효돈천(쇠소깍)", confirmed: true, lat: 33.247, lng: 126.619 },
    ...[3, 4, 5, 6].map((n) => ({
      id: `sample-${n}`,
      name: `효돈천 관측점 ${n}(샘플)`,
      confirmed: false,
      lat: r2(33.3 - (n - 3) * 0.012 + 0.0),
      lng: r2(126.58 + (n - 3) * 0.011),
    })),
  ]
  const points: RiverSamplePoint[] = defs.map((d, i) => {
    const base0 = 0.35 + 0.75 * rand()
    const levelM = r2(Math.min(3.4, base0 + activity * (1.4 - i * 0.12) * rand()))
    const slope = (rand() - 0.35) * 0.1 * activity // 10분당 변화(m)
    const flow = Math.round((levelM / boundaryM) * 100 * (0.8 + 0.2 * rand()))
    return {
      id: d.id,
      name: d.name,
      confirmed: d.confirmed,
      lat: d.lat,
      lng: d.lng,
      levelM,
      flowRatioPercent: flow,
      level: riverLevel(flow),
      history: Array.from({ length: 7 }, (_, k) => ({
        t: fmt(shift(now, (k - 6) * 10)).slice(11),
        levelM: r2(Math.max(0.1, levelM - slope * (6 - k) + (rand() - 0.5) * 0.03)),
      })),
      forecast: ([10, 30, 60] as const).map((m) => ({ minutes: m, levelM: r2(Math.max(0.1, levelM + slope * (m / 10) + (rand() - 0.5) * 0.02)) })),
    }
  })
  const tideOffset = rand() * 12.42
  const tide = Array.from({ length: 25 }, (_, k) => {
    const h = k - 12
    const tideM = r2(1.1 + 0.9 * Math.sin((2 * Math.PI * (h + tideOffset)) / 12.42))
    return { t: fmt(shift(hour, h * 60)).slice(5, 13).replace("T", " ") + "시", tideM, levelM: r2(Math.max(0.1, points[1].levelM - 0.1 + 0.15 * tideM + (rand() - 0.5) * 0.04)), predicted: h > 0 }
  })
  const poleStates: ("정상" | "점검" | "오류")[] = ["정상", "정상", rand() < 0.3 ? "점검" : "정상"]
  const smartPoles = poleStates.map((status, i) => ({ id: `pole-${i + 1}`, name: `효돈천 스마트폴 ${i + 1}(샘플)`, status, batteryPercent: Math.round(60 + 40 * rand()) }))

  // ---- 연안: 함덕·협재
  const sites = [
    { id: "hamdeok", name: "함덕 해수욕장", lat: 33.543, lng: 126.67 },
    { id: "hyeopjae", name: "협재 해수욕장", lat: 33.394, lng: 126.239 },
  ]
  const peaks = { hamdeok: 140, hyeopjae: 95 } as Record<string, number>
  const crowd = sites.map((s) => ({
    siteId: s.id,
    name: s.name,
    limit: 150,
    series: Array.from({ length: 13 }, (_, k) => {
      const t = shift(hour, (k - 12) * 60)
      const bell = Math.exp(-((t.getHours() - 14) ** 2) / (2 * 3 ** 2))
      return { t: pad(t.getHours()) + "시", count: Math.round(peaks[s.id] * bell * (0.7 + 0.5 * rand())) }
    }),
  }))
  const levelOfCrowd = (c: number): SampleLevel => (c >= 150 ? "warning" : c >= 100 ? "caution" : "safe")
  const siteOffset = Math.floor(rand() * 2)
  const vlmSummaries = [0, 1, 2].map((k) => {
    const site = sites[(k + siteOffset) % 2]
    const c = Math.max(0, crowd.find((x) => x.siteId === site.id)!.series.at(-1)!.count + Math.round((rand() - 0.5) * 16))
    const lv = levelOfCrowd(c)
    const notes = lv === "safe" ? "안전선 침범 없음 · 이안류 징후 없음" : lv === "caution" ? "이용객 다수 · 안전선 근접 1건" : "이용객 밀집 · 안전선 침범 2건 확인 필요"
    return { at: fmt(shift(now, -k * 10)), siteId: site.id, text: `${site.name}: 이용객 약 ${c}명, ${notes}`, level: lv }
  })
  const worst = vlmSummaries.reduce<SampleLevel>((w, v) => (["safe", "caution", "warning", "alert", "danger"].indexOf(v.level) > ["safe", "caution", "warning", "alert", "danger"].indexOf(w) ? v.level : w), "safe")
  const stageIdx = worst === "safe" ? 0 : worst === "caution" ? 1 : 2
  const currentStage = (["평시", "관심", "주의"] as const)[stageIdx]
  const stageActions = [
    ["관심", "상황 모니터링 강화(CCTV·VLM 요약 확인)"],
    ["주의", "안전요원 배치·현장 안내방송"],
    ["경계", "입수 통제·관계기관(해경) 통보"],
    ["심각", "대피 안내·출동 요청·경보 발령"],
  ] as const
  const checklist = stageActions.map(([stage, action], i) => ({ stage, action, done: i < stageIdx }))

  // ---- 저염분: 한경·대정 해역
  const strength = 3 + 5 * rand()
  const heatmap = ([48, 120] as const).map((horizonHours) => {
    const cells: { lat: number; lng: number; salinity: number; level: SampleLevel }[] = []
    for (let lat = 33.1; lat <= 33.4001; lat += 0.02) {
      for (let lng = 126.0; lng <= 126.4001; lng += 0.02) {
        const salinity = r2(plumeSalinity(lat, lng, horizonHours, strength))
        cells.push({ lat: r2(lat), lng: r2(lng), salinity, level: salinityLevel(salinity) })
      }
    }
    return { horizonHours, cells }
  })
  const series = Array.from({ length: 49 }, (_, k) => {
    const h = k - 24
    const salinity = r2(plumeSalinity(33.325, 126.17, Math.max(0, h + 24), strength) + (rand() - 0.5) * 0.15)
    return { t: fmt(shift(hour, h * 60)).slice(5, 13).replace("T", " ") + "시", salinity, tempC: r2(24.5 + 1.5 * Math.sin((2 * Math.PI * (h + 6)) / 24) + (rand() - 0.5) * 0.2), predicted: h > 0 }
  })
  const intakes = INTAKES.map((p) => {
    let eta: number | null = null
    for (let h = 0; h <= 120; h++) {
      if (plumeSalinity(p.lat, p.lng, h, strength) < 30) {
        eta = h
        break
      }
    }
    return { id: p.id, name: p.name, etaHours: eta, level: salinityLevel(plumeSalinity(p.lat, p.lng, 48, strength)) }
  })
  const minEta = intakes.reduce<number>((m, i) => (i.etaHours !== null && i.etaHours < m ? i.etaHours : m), Infinity)
  const items = ["취수 중단 여부 검토", "양식장 수질(염분·수온) 점검", "산소공급기·순환펌프 가동", "출하·이송 조기 검토", "마을어장·연안 생물 예찰 강화(수협·어촌계)"]
  const doneCount = minEta <= 24 ? 3 : minEta <= 48 ? 2 : minEta <= 120 ? 1 : 0

  return {
    version: 1,
    source: "sample",
    generatedAt: fmt(now),
    river: { boundaryM, points, tide, smartPoles },
    coast: { sites, crowd, vlmSummaries, checklist, currentStage },
    aqua: { heatmap, series, intakes, checklist: items.map((item, i) => ({ item, done: i < doneCount })) },
  }
}
