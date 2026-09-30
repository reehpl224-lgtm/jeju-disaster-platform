import { readSheet, type SheetData } from "read-excel-file/browser"
import { scopedKey } from "./appEnv"
import { aquaDataIssues, aquaDataSources, aquaSummary } from "./mockAqua"
import { coastSafetyAssets, coastSummary } from "./mockCoast"
import { weatherStations } from "./mockHeavyRain"
import { riverSensorCheck } from "./mockRiver"

export const SERVICE_LABELS = {
  "heavy-rain": "호우",
  river: "하천범람",
  aqua: "저염분 고수온",
  coast: "연안 안전관리",
} as const

export type DummyServiceCode = keyof typeof SERVICE_LABELS
type CollectionStatus = "정상" | "지연" | "오류" | "누락"
type HeavyRainItemType = "침수센서" | "우량계" | "적설계" | "풍속풍향계"

export interface DummyCollectionRow {
  serviceCode: DummyServiceCode
  itemId: string
  itemName: string
  itemType: string
  location: string
  value: string
  unit: string
  status: CollectionStatus
  observedAt: string
  cycle: string
  qualityScore: number | null
  detail: string
}

export interface DummyWorkbookData {
  rows: DummyCollectionRow[]
  importedAt?: string
  fileName?: string
}

const REQUIRED_COLUMNS = [
  "서비스코드",
  "항목ID",
  "항목명",
  "항목유형",
  "위치",
  "측정값",
  "단위",
  "수집상태",
  "관측시각",
  "수집주기",
  "품질점수",
  "세부설명",
]
const COLLECTION_STATUSES: CollectionStatus[] = ["정상", "지연", "오류", "누락"]
const HEAVY_RAIN_ITEM_TYPES: HeavyRainItemType[] = ["침수센서", "우량계", "적설계", "풍속풍향계"]
const STORAGE_KEY = scopedKey("jeju-ax-dummy-workbook")

function toAquaStatus(status: CollectionStatus): "normal" | "delayed" | "error" | "missing" {
  if (status === "정상") return "normal"
  if (status === "지연") return "delayed"
  if (status === "누락") return "missing"
  return "error"
}

function toAquaIssueType(status: Exclude<CollectionStatus, "정상">): "delayed" | "error" | "missing" {
  if (status === "지연") return "delayed"
  if (status === "누락") return "missing"
  return "error"
}

function formatCellValue(value: unknown) {
  if (!(value instanceof Date)) return String(value ?? "").trim()

  const pad = (part: number) => String(part).padStart(2, "0")
  // Excel 날짜는 시간대가 없고, 파서는 해당 표시 시각을 UTC Date로 반환한다.
  // 로컬 시각으로 바꾸면 서울에서는 9시간이 더해지므로 UTC 필드를 그대로 사용한다.
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`
}

function cellValue(row: Record<string, unknown>, column: string) {
  return formatCellValue(row[column])
}

function toRecords(rows: SheetData) {
  if (!rows.length) throw new Error("'수집데이터' 시트가 비어 있습니다.")

  const headers = rows[0].map((value) => String(value ?? "").trim())
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column))
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(", ")}`)

  return rows
    .slice(1)
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
}

export async function parseDummyWorkbook(file: File): Promise<DummyWorkbookData> {
  const seen = new Set<string>()
  const records = toRecords(await readSheet(file, "수집데이터"))
  const rows = records.map((record, index): DummyCollectionRow => {
    const rowNumber = index + 2
    const serviceCode = cellValue(record, "서비스코드") as DummyServiceCode
    const itemId = cellValue(record, "항목ID")
    const status = cellValue(record, "수집상태") as CollectionStatus
    const itemType = cellValue(record, "항목유형")

    if (!(serviceCode in SERVICE_LABELS)) {
      throw new Error(`${rowNumber}행: 지원하지 않는 서비스코드 '${serviceCode}'`)
    }
    if (!itemId || seen.has(`${serviceCode}:${itemId}`)) {
      throw new Error(`${rowNumber}행: 항목ID가 비었거나 중복됩니다.`)
    }
    if (!COLLECTION_STATUSES.includes(status)) {
      throw new Error(`${rowNumber}행: 수집상태 '${status}'는 정상·지연·오류·누락 중 하나여야 합니다.`)
    }
    if (serviceCode === "heavy-rain" && !HEAVY_RAIN_ITEM_TYPES.includes(itemType as HeavyRainItemType)) {
      throw new Error(`${rowNumber}행: 호우 항목유형 '${itemType}'은 침수센서·우량계·적설계·풍속풍향계 중 하나여야 합니다.`)
    }

    seen.add(`${serviceCode}:${itemId}`)
    const rawQualityScore = cellValue(record, "품질점수")
    const qualityScore = rawQualityScore === "" ? null : Number(rawQualityScore)
    if (qualityScore !== null && (!Number.isFinite(qualityScore) || qualityScore < 0 || qualityScore > 100)) {
      throw new Error(`${rowNumber}행: 품질점수는 0~100이어야 합니다.`)
    }

    return {
      serviceCode,
      itemId,
      itemName: cellValue(record, "항목명"),
      itemType,
      location: cellValue(record, "위치"),
      value: cellValue(record, "측정값"),
      unit: cellValue(record, "단위"),
      status,
      observedAt: cellValue(record, "관측시각"),
      cycle: cellValue(record, "수집주기"),
      qualityScore,
      detail: cellValue(record, "세부설명"),
    }
  })

  return { rows, importedAt: new Date().toISOString(), fileName: file.name }
}

export function saveDummyWorkbook(data: DummyWorkbookData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadDummyWorkbook(): DummyWorkbookData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDummyWorkbook() {
  localStorage.removeItem(STORAGE_KEY)
}

export function applyStoredDummyWorkbook() {
  const data = loadDummyWorkbook()
  if (!data) return

  const byService = (serviceCode: DummyServiceCode) => data.rows.filter((row) => row.serviceCode === serviceCode)
  const valueWithUnit = (row: DummyCollectionRow) => `${row.value}${row.unit ? ` ${row.unit}` : ""}`

  const heavyRainRows = byService("heavy-rain")
  // 파일에 없는 서비스는 시나리오의 목록과 집계값을 그대로 유지한다.
  if (heavyRainRows.length) {
    weatherStations.splice(
      0,
      weatherStations.length,
      ...heavyRainRows.map((row) => ({
        id: row.itemId,
        name: row.itemName,
        type: row.itemType as HeavyRainItemType,
        value: valueWithUnit(row),
        collectionStatus: row.status,
        status: "safe" as const,
        updatedAt: row.observedAt,
      })),
    )
  }

  const riverRows = byService("river")
  if (riverRows.length) {
    riverSensorCheck.splice(
      0,
      riverSensorCheck.length,
      ...riverRows.map((row) => ({
        id: row.itemId,
        name: row.itemName,
        status: (row.status === "정상" ? "정상" : "이상") as "정상" | "이상",
        value: valueWithUnit(row),
        detail: row.detail || `${row.location} · ${row.observedAt}`,
      })),
    )
  }

  const aquaRows = byService("aqua")
  if (aquaRows.length) {
    aquaDataSources.splice(
      0,
      aquaDataSources.length,
      ...aquaRows.map((row) => ({
        id: row.itemId,
        name: row.itemName,
        detail: row.location || row.itemType,
        updatedAt: row.observedAt,
        cycle: row.cycle,
        status: toAquaStatus(row.status),
        qualityScore: row.qualityScore,
        note: row.detail || valueWithUnit(row),
      })),
    )

    const qualityScores = aquaRows.map((row) => row.qualityScore).filter((score): score is number => score !== null)
    aquaSummary.dataQuality.percent = qualityScores.length
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    aquaDataIssues.splice(
      0,
      aquaDataIssues.length,
      ...aquaRows
        .filter((row) => row.status !== "정상")
        .map((row) => ({
          id: `issue-${row.itemId}`,
          type: toAquaIssueType(row.status as Exclude<CollectionStatus, "정상">),
          title: `${row.itemName} ${row.status}`,
          cause: row.detail || "업로드된 수집상태 확인 필요",
          impact: `${row.location || row.itemType} 데이터 품질에 영향`,
        })),
    )
  }

  const coastRows = byService("coast")
  if (coastRows.length) {
    coastSafetyAssets.splice(
      0,
      coastSafetyAssets.length,
      ...coastRows.map((row) => ({
        id: row.itemId,
        name: row.itemName,
        location: row.location,
        status: (row.status === "정상" ? "정상" : "오류") as "정상" | "오류",
        detail: row.detail || `${row.itemType} · ${valueWithUnit(row)}`,
      })),
    )

    const normalEquipment = coastSafetyAssets.filter((asset) => asset.status === "정상").length
    const errorEquipment = coastSafetyAssets.length - normalEquipment
    Object.assign(coastSummary.equipment, {
      normal: normalEquipment,
      error: errorEquipment,
      detail: `정상 ${normalEquipment}기 · 오류 ${errorEquipment}기`,
    })
  }
}
