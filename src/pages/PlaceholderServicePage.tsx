import { Card } from "../components/ui/Card"

interface PlaceholderServicePageProps {
  title: string
  description: string
  flowSource: string
  screenCount: number
  domainColor: string
}

export function PlaceholderServicePage({
  title,
  description,
  flowSource,
  screenCount,
  domainColor,
}: PlaceholderServicePageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/50">{description}</p>
      </div>

      <Card>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{ background: domainColor + "33" }}
          >
            🚧
          </span>
          <p className="text-sm font-semibold text-white/80">다음 단계에서 구현 예정입니다</p>
          <p className="max-w-md text-xs text-white/40">
            와이어프레임 <span className="font-medium text-white/60">{flowSource}</span> 기준 총{" "}
            <span className="font-medium text-white/60">{screenCount}개 화면</span>(상태 분기 포함)이 이 영역에
            매핑되어 있습니다. 1단계에서는 플랫폼 공통 셸(로그인·내비게이션·통합 대시보드·시스템 모니터링)까지만
            구현합니다.
          </p>
        </div>
      </Card>
    </div>
  )
}
