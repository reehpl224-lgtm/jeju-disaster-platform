import assert from "node:assert/strict"
import test from "node:test"
import { fromPilotBatch, fromSpEvent, serviceOfText, toNgsiLd } from "../src/data/commonEvent.ts"
import { generatePilotBatch } from "../src/data/pilotBatch/generate.ts"

const sp = (o) => ({ id: "x", source: "warnings", category: "weather", icon: "", level: "warning", status: "발령", title: "호우주의보 (기상특보)", detail: "서귀포시 남부 · 기상청 발표", at: new Date("2026-10-13T01:00:00Z"), sample: false, ...o })

test("특보는 경보 결과로, 태풍은 관측 수치로 공통 이벤트가 된다", () => {
  const w = fromSpEvent(sp())
  assert.equal(w.serviceId, "heavy-rain")
  assert.equal(w.risk.level, "warning")
  assert.equal(w.alert.status, "발령")
  assert.equal(w.source.origin, "기상청")
  assert.equal(w.subject.name, "서귀포시 남부")
  const t = fromSpEvent(sp({ source: "typhoon", title: "제27호", detail: "도쿄 동북동쪽", level: "caution", meta: [{ label: "중심기압", value: "965hPa" }] }))
  assert.equal(t.serviceId, "typhoon")
  assert.equal(t.alert, undefined)
  assert.deepEqual(t.observation, [{ name: "중심기압", value: "965hPa" }])
  assert.equal(fromSpEvent(sp({ sample: true })).source.origin, "샘플")
  assert.equal(fromSpEvent(sp({ source: "messages", title: "재난문자", detail: "제주시 · 강풍경보" })).source.origin, "행정안전부")
  assert.equal(serviceOfText("알 수 없는 내용"), "common")
})

test("실증사 배치는 관측점·구역·취수구마다 하나씩, 관측값·예측값·위험도를 한 구조에 담는다", () => {
  const b = generatePilotBatch(new Date(2026, 9, 13, 10, 0))
  const ev = fromPilotBatch(b)
  assert.equal(ev.length, b.river.points.length + b.coast.sites.length + b.aqua.intakes.length)
  const r = ev.find((e) => e.serviceId === "river")
  assert.ok(r.observation.length >= 2)
  assert.equal(r.prediction.values.length, 3)
  assert.equal(r.source.origin, "샘플")
  assert.equal(new Set(ev.map((e) => e.id)).size, ev.length)
})

test("NGSI-LD 변환: urn ID, 좌표는 [경도, 위도], 값 없는 항목은 만들지 않는다", () => {
  const b = generatePilotBatch(new Date(2026, 9, 13, 10, 0))
  const river = fromPilotBatch(b).find((e) => e.serviceId === "river")
  const n = toNgsiLd(river)
  assert.ok(n.id.startsWith("urn:ngsi-ld:CommonEvent:"))
  assert.equal(n.type, "CommonEvent")
  assert.deepEqual(n.location.value.coordinates, [river.subject.lng, river.subject.lat])
  assert.ok(n.prediction)
  const w = toNgsiLd(fromSpEvent(sp()))
  assert.equal(w.location, undefined)
  assert.equal(w.prediction, undefined)
  assert.equal(w.alert.status.value, "발령")
})

import { validateCommonEvent } from "../src/data/commonEvent.ts"
import { readFileSync } from "node:fs"

test("구조 검사: 만들어 내는 이벤트와 Mock API 파일은 모두 통과하고, 어긋난 값은 필드별로 알려 준다", () => {
  const b = generatePilotBatch(new Date(2026, 9, 13, 10, 0))
  for (const e of fromPilotBatch(b)) assert.deepEqual(validateCommonEvent(e), [], e.id)
  assert.deepEqual(validateCommonEvent(fromSpEvent(sp())), [])
  const file = JSON.parse(readFileSync(new URL("../public/mock-api/v1/events.json", import.meta.url), "utf8"))
  assert.ok(file.events.length > 0)
  for (const e of file.events) assert.deepEqual(validateCommonEvent(e), [], e.id)

  const broken = structuredClone(fromPilotBatch(b)[0])
  broken.risk.level = "severe"
  delete broken.subject.kind
  broken.observation[0].value = null
  broken.alert = { status: "진행", title: "" }
  const errs = validateCommonEvent(broken)
  assert.ok(errs.some((m) => m.startsWith("risk.level")))
  assert.ok(errs.some((m) => m.startsWith("subject.kind")))
  assert.ok(errs.some((m) => m.startsWith("observation[0].value")))
  assert.ok(errs.some((m) => m.startsWith("alert.status")))
  assert.deepEqual(validateCommonEvent("문자열"), ["이벤트는 객체여야 합니다"])
})
