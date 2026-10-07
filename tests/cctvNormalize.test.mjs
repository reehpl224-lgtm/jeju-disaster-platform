import assert from "node:assert/strict"
import test from "node:test"
import { normalizeCctvItems } from "../vercel-proxy/kma-weather-proxy/lib/cctv.ts"

// 2026-10-07 실제 응답에서 가져온 항목 모양(월파 서비스)
const wave = [
  { dataCd: "51", laCrdnt: "33.517967", loCrdnt: "126.528205", spotSe: "W", spotNm: "탑동서부두", cctvUrl: "http://211.114.96.121:1935/jejusi6/11-11.stream/playlist.m3u8", useYn: "Y" },
  { dataCd: "52", laCrdnt: "33.517104", loCrdnt: "126.515778", spotSe: "W", spotNm: "동한두기", cctvUrl: "http://211.114.96.121:1935/jejusi6/11-12.stream/playlist.m3u8", useYn: "N" },
]

test("좌표·이름·사용 여부를 화면용으로 옮긴다", () => {
  const [a, b] = normalizeCctvItems("wave", wave)
  assert.deepEqual(a, {
    id: "wave-51",
    kind: "wave",
    name: "탑동서부두",
    lat: 33.517967,
    lng: 126.528205,
    streamUrl: "http://211.114.96.121:1935/jejusi6/11-11.stream/playlist.m3u8",
    inUse: true,
  })
  assert.equal(b.inUse, false)
})

test("좌표가 숫자가 아닌 항목은 버린다", () => {
  const items = normalizeCctvItems("river", [{ dataCd: "1", laCrdnt: "", loCrdnt: "126.5", spotNm: "x", cctvUrl: "", useYn: "Y" }, ...wave])
  assert.equal(items.length, 2)
})

test("이름이 비어 있으면 종류와 번호로 대신한다", () => {
  const [c] = normalizeCctvItems("snow", [{ dataCd: "77", laCrdnt: "33.4", loCrdnt: "126.5", spotNm: "  ", cctvUrl: "", useYn: "Y" }])
  assert.equal(c.name, "적설 CCTV 77")
})
