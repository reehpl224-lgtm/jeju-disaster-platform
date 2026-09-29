import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate"
import { readSheet } from "read-excel-file/node"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"

// Node에서 실제 앱 모듈을 실행한다. 파일 입력만 같은 라이브러리의 Node 어댑터로 연결한다.
const src = new URL("../src/", import.meta.url).href
const nodeReader = new URL("../node_modules/read-excel-file/node/index.js", import.meta.url).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "read-excel-file/browser") {
      return { url: new URL("./test-excel-reader.js", import.meta.url).href, shortCircuit: true }
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(src) && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of [".ts", ".tsx"]) {
        try { return next(specifier + extension, context) } catch (error) {
          if (error.code !== "ERR_MODULE_NOT_FOUND") throw error
        }
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith("/test-excel-reader.js")) {
      return { format: "module", shortCircuit: true, source: `import { readSheet as read } from ${JSON.stringify(nodeReader)}; export async function readSheet(file, sheet) { return read(Buffer.from(await file.arrayBuffer()), sheet) }` }
    }
    // 지도는 DOM이 필요한 외부 라이브러리라 서버 렌더링 검사에서 제외한다.
    if (url.endsWith("/ui/JejuTileMap.tsx")) {
      return { format: "module", shortCircuit: true, source: "export function JejuTileMap() { return null }" }
    }
    if (url.startsWith(src) && /\.tsx?$/.test(url)) {
      let source = readFileSync(fileURLToPath(url), "utf8").replaceAll("import.meta.env", '{ DEV: false, BASE_URL: "/" }')
      // GIS 레일은 기본적으로 닫혀 있으므로 실제 패널 내용을 직접 렌더링한다.
      if (url.endsWith("/HeavyRainHomePage.tsx")) source += "\nexport { railContent as testRailContent }\n"
      return {
        format: "module", shortCircuit: true,
        source: ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText,
      }
    }
    return next(url, context)
  },
})

const storage = new Map()
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
const workbook = await import("../src/data/dummyWorkbook.ts")
const HR = await import("../src/data/mockHeavyRain.ts")
const RV = await import("../src/data/mockRiver.ts")
const AQ = await import("../src/data/mockAqua.ts")
const CO = await import("../src/data/mockCoast.ts")
const DB = await import("../src/data/mockDashboard.ts")
const { checkConsistency } = await import("../src/data/consistency.ts")
const { heavyRainBrief } = await import("../src/pages/domain/leaderBriefs.ts")
const template = readFileSync(new URL("../public/제주_재난대응_더미데이터_템플릿.xlsx", import.meta.url))
const file = bytes => new File([bytes], "test.xlsx")
const sample = await workbook.parseDummyWorkbook(file(template))
const render = element => renderToStaticMarkup(React.createElement(MemoryRouter, null, element))

test("실제 Excel 날짜 일련번호와 텍스트 시각을 동일하게 읽는다", async () => {
  const zip = unzipSync(template)
  let sheet = strFromU8(zip["xl/worksheets/sheet1.xml"]).replaceAll("x:", "").replace("xmlns:x=", "xmlns=")
  // 2026-09-29 15:20: 시간대 보정 없이 Excel 1900 epoch에서 계산한 일련번호.
  const serial = (Date.UTC(2026, 8, 29, 15, 20) - Date.UTC(1899, 11, 30)) / 86400000
  const styles = strFromU8(zip["xl/styles.xml"]).replaceAll("x:", "").replace("xmlns:x=", "xmlns=")
  const formats = styles.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)
  assert.ok(formats)
  const styleCount = Number(formats[0].match(/count="(\d+)"/)[1])
  zip["xl/styles.xml"] = strToU8(styles.replace(formats[0], `<cellXfs count="${styleCount + 1}">${formats[1]}<xf numFmtId="22" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>`))
  assert.match(sheet, /<c\b[^>]*r="I2"[^>]*>[\s\S]*?<\/c>/)
  sheet = sheet.replace(/<c\b[^>]*r="I2"[^>]*>[\s\S]*?<\/c>/, `<c r="I2" s="${styleCount}"><v>${serial}</v></c>`)
  zip["xl/worksheets/sheet1.xml"] = strToU8(sheet)
  const bytes = Buffer.from(zipSync(zip))
  const raw = await readSheet(bytes, "수집데이터")
  assert.ok(raw[1][8] instanceof Date)
  assert.equal(raw[1][8].toISOString(), "2026-09-29T15:20:00.000Z")
  const parsed = await workbook.parseDummyWorkbook(file(bytes))
  assert.equal(parsed.rows[0].observedAt, "2026-09-29 15:20")
  assert.equal(sample.rows[0].observedAt, parsed.rows[0].observedAt)
})

test("행이 없는 서비스의 시나리오 목록과 집계를 유지한다", () => {
  const snapshot = () => structuredClone({
    "heavy-rain": HR.weatherStations,
    river: RV.riverSensorCheck,
    aqua: { sources: AQ.aquaDataSources, issues: AQ.aquaDataIssues, quality: AQ.aquaSummary.dataQuality },
    coast: { assets: CO.coastSafetyAssets, equipment: CO.coastSummary.equipment },
  })
  for (const selected of Object.keys(workbook.SERVICE_LABELS)) {
    // 비어 있지 않은 시나리오와 장애/집계가 이미 적용된 상태를 만든다.
    workbook.saveDummyWorkbook({ rows: sample.rows.map(row => ({ ...row, status: "지연" })) })
    workbook.applyStoredDummyWorkbook()
    const before = snapshot()
    const rows = sample.rows.filter(row => row.serviceCode === selected).map(row => ({ ...row, itemName: "새 업로드 항목" }))
    workbook.saveDummyWorkbook({ rows })
    workbook.applyStoredDummyWorkbook()
    const after = snapshot()
    for (const service of Object.keys(before)) {
      if (service !== selected) assert.deepEqual(after[service], before[service], `미포함 서비스 ${service}`)
      else assert.notDeepEqual(after[service], before[service], `포함 서비스 ${service}`)
    }
    workbook.saveDummyWorkbook({ rows: [] })
    workbook.applyStoredDummyWorkbook()
    assert.deepEqual(snapshot(), after, "빈 파일은 모든 서비스를 유지")
  }
})

test("오류·지연·누락은 관측소 화면에 표시하고 재난 등급을 바꾸지 않는다", async () => {
  workbook.saveDummyWorkbook(sample)
  workbook.applyStoredDummyWorkbook()
  assert.deepEqual(checkConsistency(), [])
  const riskBefore = structuredClone({ cards: DB.serviceStatusCards, markers: DB.riskMarkers, brief: heavyRainBrief().level })
  const { HeavyRainHomePage, testRailContent } = await import("../src/pages/heavyrain/HeavyRainHomePage.tsx")
  const { HeavyRainAnalysisPage } = await import("../src/pages/heavyrain/HeavyRainAnalysisPage.tsx")
  const { heavyRainConfig } = await import("../src/pages/domain/domainConfigs.tsx")
  for (const status of ["오류", "지연", "누락"]) {
    workbook.saveDummyWorkbook({ rows: sample.rows.map(row => ({ ...row, status })) })
    workbook.applyStoredDummyWorkbook()
    assert.ok(HR.weatherStations.every(station => station.status === "safe" && station.collectionStatus === status))
    assert.deepEqual(checkConsistency(), [])
    assert.deepEqual({ cards: DB.serviceStatusCards, markers: DB.riskMarkers, brief: heavyRainBrief().level }, riskBefore)
    const views = {
      home: render(React.createElement(HeavyRainHomePage)),
      gis: render(testRailContent().sensor),
      analysis: render(React.createElement(HeavyRainAnalysisPage)),
      ...Object.fromEntries(heavyRainConfig().tabs.filter(tab => ["home", "data", "analysis"].includes(tab.key)).map(tab => [`board-${tab.key}`, render(tab.content)])),
    }
    for (const [name, html] of Object.entries(views)) assert.ok(html.includes(`수집 ${status}`), `${name}: 수집 ${status}`)
  }
})
