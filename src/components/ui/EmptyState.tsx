/**
 * 목록/카드/표가 비어 있을 때 쓰는 공통 안내 문구 — "데이터 있음/없음" 모드 전환(DataModeContext) 및
 * 실제 데이터가 0건인 경우 모두에서 재사용한다. AGENTS.md 4장 "빈 배열은 하드코딩 예시 대신 명시적
 * 안내 문구로" 원칙에 따른 공통 컴포넌트.
 */
interface EmptyStateProps {
  message?: string
  className?: string
}

export function EmptyState({ message = "표시할 데이터가 없습니다.", className }: EmptyStateProps) {
  return <p className={`py-6 text-center text-xs text-white/30 ${className ?? ""}`}>{message}</p>
}

/** 표(<table>) 안에서 쓰는 변형 — colSpan을 맞춰 한 행으로 표시 */
export function EmptyStateRow({ colSpan, message = "표시할 데이터가 없습니다." }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td className="py-3 text-center text-xs text-white/30" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  )
}
