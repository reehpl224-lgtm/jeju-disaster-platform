import { readSheet, type SheetData } from "read-excel-file/browser"
import type { RiverTimelinePoint } from "../types/riverRun"

/**
 * 하천 시계열 시나리오 엑셀 파서 — dummyWorkbook.ts(수집상태 엑셀)와는 완전히 별도 파일·별도 업로드
 * 화면이다(§1-2 사용자 결정: "이건 수집 장애고 이건 시나리오 값"이 헷갈리는 걸 막기 위함).
 * 항목ID 중복 금지 로직을 재사용하지 않는다 — 같은 지점의 여러 시각(시계열) 값을 허용해야 하므로
 * "지점+관측시각"을 키로 중복만 막는다(§2-2).
 */

const REQUIRED_COLUMNS = ["지점", "관측시각", "계획홍수량비율(%)"]
const LOCATIONS: RiverTimelinePoint["location"][] = ["돈내코", "쇠소깍"]
const SHEET_NAME = "시간별입력"

function cellText(value: unknown): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    // Excel 날짜는 시간대가 없고, 파서는 표시 시각을 UTC Date로 반환한다(dummyWorkbook.ts와 동일 이유).
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`
  }
  return String(value ?? "").trim()
}

function toRecords(rows: SheetData) {
  if (!rows.length) throw new Error(`'${SHEET_NAME}' 시트가 비어 있습니다.`)
  const headers = rows[0].map((v) => String(v ?? "").trim())
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(", ")}`)
  return rows
    .slice(1)
    .filter((row) => row.some((v) => String(v ?? "").trim()))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])))
}

export async function parseRiverTimelineWorkbook(file: File): Promise<RiverTimelinePoint[]> {
  const records = toRecords(await readSheet(file, SHEET_NAME))
  const seen = new Set<string>()

  const points = records.map((record, index): RiverTimelinePoint => {
    const rowNumber = index + 2
    const location = cellText(record["지점"]) as RiverTimelinePoint["location"]
    const observedAt = cellText(record["관측시각"])
    const flowRatioRaw = cellText(record["계획홍수량비율(%)"])

    if (!LOCATIONS.includes(location)) {
      throw new Error(`${rowNumber}행: 지점 '${location}'은 돈내코·쇠소깍 중 하나여야 합니다.`)
    }
    if (!/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/.test(observedAt)) {
      throw new Error(`${rowNumber}행: 관측시각 형식이 올바르지 않습니다(YYYY-MM-DD HH:mm). 값: '${observedAt}'`)
    }
    const flowRatioPercent = Number(flowRatioRaw)
    if (!Number.isFinite(flowRatioPercent) || flowRatioPercent < 0) {
      throw new Error(`${rowNumber}행: 계획홍수량비율(%)은 0 이상의 숫자여야 합니다. 값: '${flowRatioRaw}'`)
    }

    const key = `${location}:${observedAt}`
    if (seen.has(key)) throw new Error(`${rowNumber}행: 같은 지점·같은 관측시각이 중복됩니다(${key}).`)
    seen.add(key)

    return { location, observedAt, flowRatioPercent }
  })

  if (points.length === 0) throw new Error("입력된 시간별 관측이 없습니다.")
  return points
}
