import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test from "node:test"

const src = new URL("../src/", import.meta.url).href
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith(src) && !/\.[a-z]+$/i.test(specifier)) {
      for (const extension of [".ts", ".tsx"]) {
        try { return next(specifier + extension, context) } catch (error) {
          if (error.code !== "ERR_MODULE_NOT_FOUND") throw error
        }
      }
    }
    return next(specifier, context)
  },
})
const { SAMPLE_WARNING_ENTRIES, warningLayerPoints, parseModelLayer, modelCellValue, modelCellColor, MODEL_GRID, DISASTER_INFO_SAMPLES } = await import("../src/data/weatherLayers.ts")

test("특보 칩: 켠 종류만, 주의보 이상·발효 중만, 시·종류별 한 점(높은 등급 우선)", () => {
  assert.deepEqual(warningLayerPoints(SAMPLE_WARNING_ENTRIES, []), [])
  const rain = warningLayerPoints(SAMPLE_WARNING_ENTRIES, ["heavy-rain"])
  assert.deepEqual(rain.map((p) => p.name).sort(), ["서귀포시 · 호우경보", "제주시 · 호우주의보"])
  assert.equal(rain.find((p) => p.name.startsWith("서귀포시")).level, "alert")
  const both = warningLayerPoints(SAMPLE_WARNING_ENTRIES, ["heavy-rain", "strong-wind", "tsunami"])
  const seo = both.filter((p) => p.name.startsWith("서귀포시"))
  assert.equal(seo.length, 3)
  assert.equal(new Set(seo.map((p) => `${p.lat}|${p.lng}`)).size, 3) // 같은 시의 여러 종류는 겹치지 않게 비껴 찍는다
  const released = SAMPLE_WARNING_ENTRIES.map((e) => ({ ...e, state: "released" }))
  assert.deepEqual(warningLayerPoints(released, ["heavy-rain"]), [])
  assert.deepEqual(warningLayerPoints([{ ...SAMPLE_WARNING_ENTRIES[0], lvl: "1" }], ["heavy-rain"]), [])
})

test("기상모델 격자: id 해석, 같은 칸은 늘 같은 값, 범위 안, 모델마다 다르다", () => {
  assert.deepEqual(parseModelLayer("de-wind"), { model: "de", element: "wind" })
  assert.equal(parseModelLayer("xx-rain"), null)
  assert.equal(parseModelLayer("norain"), null)
  const c = MODEL_GRID[10]
  assert.equal(modelCellValue(c.lat, c.lng, "kma", "rain"), modelCellValue(c.lat, c.lng, "kma", "rain"))
  for (const g of MODEL_GRID) {
    const v = modelCellValue(g.lat, g.lng, "us", "temp")
    assert.ok(v >= 8 && v <= 24, String(v))
  }
  assert.notEqual(MODEL_GRID.map((g) => modelCellValue(g.lat, g.lng, "kma", "rain")).join(), MODEL_GRID.map((g) => modelCellValue(g.lat, g.lng, "de", "rain")).join())
  assert.match(modelCellColor("rain", 30), /^rgba\(30,120,255,0\.58\)$/)
  assert.equal(Object.keys(DISASTER_INFO_SAMPLES).sort().join(), "earthquake,flood,landslide")
})
