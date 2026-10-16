/**
 * 기상청 API허브 기상특보 자료(wrn_met_data.php) 프록시 — /heat(폭염), /heavy-rain(호우) 등의
 * 특보 상태를 실시간으로 대체하기 위한 용도. KMA_APIHUB_KEY 필요(태풍정보와 동일 키).
 *
 * 제주 지역 코드는 wrn_reg.php(특보구역)로 2026-09-09 실측 확인:
 *   L1091300 제주시(산지 제외) — 하위 L1091310/1320/1330/1340(서부/북부/동부/중산간)
 *   L1091400 서귀포시(산지 제외) — 하위 L1091410/1420/1430/1440(서부/남부/동부/중산간)
 * 실제 특보는 이 하위 세분구역 단위로 발표되는 걸 확인했음(예: L1091310 제주시서부) —
 * 그래서 접두사(L10913/L10914)로 매칭한다.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import { fetchUpstream, staleCache } from "../lib/upstream"

const WARNING_URL = "https://apihub.kma.go.kr/api/typ01/url/wrn_met_data.php"

const JEJU_REGION_PREFIXES: { prefix: string; label: string }[] = [
  { prefix: "L10913", label: "제주시" },
  { prefix: "L10914", label: "서귀포시" },
]

// 기상특보 종류 코드(wrn_met_data.php 문서 기준)
const WRN_LABEL: Record<string, string> = {
  W: "강풍",
  R: "호우",
  C: "한파",
  D: "건조",
  O: "폭풍해일",
  N: "지진해일",
  V: "풍랑",
  T: "태풍",
  S: "대설",
  Y: "황사",
  H: "폭염",
  F: "안개",
  K: "열대야",
}

// LVL: 기상청 wrn_met_data의 특보수준 — 1=예비특보, 2=주의보, 3=경보
const LVL_LABEL: Record<string, string> = {
  "1": "예비특보",
  "2": "주의보",
  "3": "경보",
}

function applyCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function parseDelimitedText(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split(",").map((v) => v.trim()))
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0")
}

// KST 기준 YYYYMMDDHHmm 문자열
function formatKst(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}`
}

interface WarningEntry {
  tmFc: string // 발표시각(KST, YYYYMMDDHHmm)
  tmEf: string // 발효시각(KST, YYYYMMDDHHmm)
  regId: string
  regionLabel: string
  wrn: string
  wrnLabel: string
  lvl: string
  lvlLabel: string
  /** 발표 구분 코드(CMD) — 1 발표, 2 대치, 3 해제, 4 대치해제, 5 연장, 6 변경, 7 변경해제 */
  cmd: string
  /** 등급(GRD) — 원본 그대로 */
  grd: string
}

/** 직전 정상 응답 — 기상청이 504를 줘도 10분까지는 이 값을 stale 표시와 함께 준다 */
const stale = staleCache<{ windowStart: string; windowEnd: string; entries: WarningEntry[] }>(10 * 60 * 1000)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res)
  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  const authKey = process.env.KMA_APIHUB_KEY
  if (!authKey) {
    res.status(500).json({ error: "KMA_APIHUB_KEY 환경변수가 설정되지 않았습니다." })
    return
  }

  try {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tmfc1 = formatKst(dayAgo)
    const tmfc2 = formatKst(now)

    const url = `${WARNING_URL}?reg=0&tmfc1=${tmfc1}&tmfc2=${tmfc2}&disp=1&help=0&authKey=${encodeURIComponent(authKey)}`
    const buf = await fetchUpstream(url)
    const text = new TextDecoder("euc-kr").decode(buf)

    const rows = parseDelimitedText(text)
    // 컬럼 순서(문서): TM_FC, TM_EF, TM_IN, STN, REG_ID, WRN, LVL, CMD, GRD, CNT, RPT, ...
    const entries: WarningEntry[] = []
    for (const row of rows) {
      const [tmFc, tmEf, , , regId, wrn, lvl, cmd = "", grd = ""] = row
      if (!regId) continue
      const region = JEJU_REGION_PREFIXES.find((r) => regId.startsWith(r.prefix))
      if (!region) continue
      entries.push({
        tmFc,
        tmEf,
        regId,
        regionLabel: region.label,
        wrn,
        wrnLabel: WRN_LABEL[wrn] ?? wrn,
        lvl,
        lvlLabel: LVL_LABEL[lvl] ?? lvl,
        cmd,
        grd,
      })
    }
    entries.sort((a, b) => b.tmFc.localeCompare(a.tmFc))

    res.setHeader("Cache-Control", "no-store")
    // periodNote: 이 API는 '현재 발효 중' 플래그가 없어 최근 24시간 내 발표 이력을 보여주는 것임을
    // 명시(해제 여부까지 확정 못 하므로 "발표됨"으로만 표현 — 지어내지 않음).
    const payload = { windowStart: tmfc1, windowEnd: tmfc2, entries }
    stale.set("warnings", payload)
    res.status(200).json(payload)
  } catch (err) {
    const hit = stale.get("warnings")
    if (hit) {
      res.setHeader("Cache-Control", "no-store")
      res.status(200).json({ ...hit.value, stale: true, staleSeconds: hit.ageSec })
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    res.status(502).json({ error: message })
  }
}
