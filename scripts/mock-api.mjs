// 읽기 전용 Mock API 파일 — public/mock-api/v1/events.json 을 만든다.
// 사용: npm run batch:mock-api [기준시각(예: 2026-10-13T10:00)]   (생략하면 지금 시각)
// 실증사 샘플 배치(generatePilotBatch)를 공통 이벤트 구조(CommonEvent)로 바꾼 값이라, 실증사가 확정한 규격이 오기 전까지 연계 화면·시험의 입력으로 쓴다.
import { mkdirSync, writeFileSync } from "node:fs"
import { fromPilotBatch, validateCommonEvent } from "../src/data/commonEvent.ts"
import { generatePilotBatch } from "../src/data/pilotBatch/generate.ts"

const arg = process.argv[2]
const base = arg ? new Date(arg) : new Date()
if (Number.isNaN(base.getTime())) {
  console.error(`기준시각을 읽을 수 없습니다: ${arg}`)
  process.exit(1)
}
const events = fromPilotBatch(generatePilotBatch(base))
const bad = events.flatMap((e) => validateCommonEvent(e).map((m) => `${e.id}: ${m}`))
if (bad.length) {
  console.error("구조에 맞지 않는 이벤트가 있습니다:\n" + bad.join("\n"))
  process.exit(1)
}
const dir = new URL("../public/mock-api/v1/", import.meta.url)
mkdirSync(dir, { recursive: true })
writeFileSync(new URL("events.json", dir), JSON.stringify({ version: 1, kind: "mock", generatedAt: base.toISOString(), events }, null, 2) + "\n", "utf8")
console.log(`events.json 생성 완료 — 공통 이벤트 ${events.length}건(전부 구조 검사 통과)`)
