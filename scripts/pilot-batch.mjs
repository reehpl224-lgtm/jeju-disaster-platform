// 실증 3사 샘플 배치 — public/data/pilot-batch.json 을 만든다.
// 사용: npm run batch:pilot [기준시각(예: 2026-10-02T14:00)]   (생략하면 지금 시각)
// 실증사 실데이터가 붙으면 같은 모양(src/data/pilotBatch/generate.ts 의 PilotBatch)의 JSON으로 이 파일을 교체한다.
import { mkdirSync, writeFileSync } from "node:fs"
import { generatePilotBatch } from "../src/data/pilotBatch/generate.ts"

const arg = process.argv[2]
const base = arg ? new Date(arg) : new Date()
if (Number.isNaN(base.getTime())) {
  console.error(`기준시각을 읽을 수 없습니다: ${arg}`)
  process.exit(1)
}
const batch = generatePilotBatch(base)
const out = new URL("../public/data/pilot-batch.json", import.meta.url)
mkdirSync(new URL("../public/data/", import.meta.url), { recursive: true })
writeFileSync(out, JSON.stringify(batch, null, 2) + "\n", "utf8")
console.log(
  `pilot-batch.json 생성 완료 — 기준 ${batch.generatedAt} · 하천 ${batch.river.points.length}개소 · 연안 ${batch.coast.sites.length}곳 · 저염분 히트맵 ${batch.aqua.heatmap.length}구간`,
)
