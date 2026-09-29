/**
 * 데이터 종류 표식 — 제목 옆에 붙는 작은 태그. 시나리오 더미는 제목 앞 "*"(Card/Group의 dummy)로 이미 구분하므로
 * 여기서는 나머지 두 종류를 밝힌다: 실시간(API를 조회할 때마다 호출) / 스냅샷(실제 관측값이지만 자동 갱신 안 됨, 기준 시각 표시).
 */
import type { DataSource } from "./dataSource"

export function SourceTag({ source }: { source: DataSource }) {
  if (source.kind === "live") {
    return (
      <span className="src-tag src-tag--live" title="기상청 등 API를 조회할 때마다 호출한 실시간 값입니다">
        실시간
      </span>
    )
  }
  return (
    <span
      className="src-tag src-tag--snapshot"
      title={source.asOf ? `실제 관측값이지만 자동 갱신되지 않는 스냅샷입니다 — ${source.asOf} 기준` : "스냅샷 데이터가 비어 있습니다"}
    >
      {source.asOf ? `스냅샷 · ${source.asOf} 기준` : "스냅샷 · 데이터 없음"}
    </span>
  )
}
