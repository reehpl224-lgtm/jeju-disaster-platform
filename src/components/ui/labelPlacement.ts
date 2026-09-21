export type LabelDir = "right" | "left" | "top" | "bottom"
export interface LabelSpot { dir: LabelDir; offset: [number, number] }

const FONT = 12
const HEIGHT = 18
export const labelWidth = (s: string) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? FONT * 0.95 : FONT * 0.58), 0) + 16

interface Box { x1: number; y1: number; x2: number; y2: number }
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))

/**
 * 화면 좌표(px)에 놓인 마커들의 이름표 자리를 정한다 — 오른쪽 위/아래, 왼쪽 위/아래, 위, 아래 중
 * 이미 놓인 이름표·다른 마커 점과 가장 덜 겹치는 곳(맵 밖으로 나가면 큰 감점).
 */
export function placeTileLabels(items: { id: string; name: string; x: number; y: number }[], width: number, height: number): Record<string, LabelSpot> {
  const dots: Box[] = items.map(({ x, y }) => ({ x1: x - 10, y1: y - 10, x2: x + 10, y2: y + 10 }))
  const order = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const chosen = new Map<string, { spot: LabelSpot; box: Box }>()

  const candidates = ({ name, x, y }: { name: string; x: number; y: number }) => {
    const w = labelWidth(name)
    const h = HEIGHT / 2
    return [
      { spot: { dir: "right", offset: [6, -10] } as LabelSpot, box: { x1: x + 8, x2: x + 8 + w, y1: y - 10 - h, y2: y - 10 + h } },
      { spot: { dir: "right", offset: [6, 10] } as LabelSpot, box: { x1: x + 8, x2: x + 8 + w, y1: y + 10 - h, y2: y + 10 + h } },
      { spot: { dir: "left", offset: [-6, -10] } as LabelSpot, box: { x1: x - 8 - w, x2: x - 8, y1: y - 10 - h, y2: y - 10 + h } },
      { spot: { dir: "left", offset: [-6, 10] } as LabelSpot, box: { x1: x - 8 - w, x2: x - 8, y1: y + 10 - h, y2: y + 10 + h } },
      { spot: { dir: "top", offset: [0, -10] } as LabelSpot, box: { x1: x - w / 2, x2: x + w / 2, y1: y - 10 - HEIGHT, y2: y - 10 } },
      { spot: { dir: "bottom", offset: [0, 10] } as LabelSpot, box: { x1: x - w / 2, x2: x + w / 2, y1: y + 10, y2: y + 10 + HEIGHT } },
    ]
  }

  // 1차: 위에서 아래로 탐욕 배치, 이후 2회: 각 이름표를 빼고 다른 이름표 기준으로 다시 고르기
  for (let pass = 0; pass < 3; pass++) {
    for (const item of order) {
      const others = [...dots, ...[...chosen.entries()].filter(([id]) => id !== item.id).map(([, v]) => v.box)]
      let best = candidates(item)[0]
      let bestScore = Infinity
      for (const c of candidates(item)) {
        let score = others.reduce((s, b) => s + overlap(c.box, b), 0)
        if (c.box.x1 < 0 || c.box.x2 > width || c.box.y1 < 0 || c.box.y2 > height) score += 1e4
        if (score < bestScore) {
          best = c
          bestScore = score
        }
      }
      chosen.set(item.id, best)
    }
  }
  const out: Record<string, LabelSpot> = {}
  chosen.forEach((v, id) => (out[id] = v.spot))
  return out
}
