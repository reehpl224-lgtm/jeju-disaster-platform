import { Card } from "../components/ui/Card"
import { IS_SIMULATION_MODE } from "../data/appEnv"

/** 메뉴 > 운영 > 데모버전 — 노출용 플레이스홀더 페이지 */
export function DemoVersionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">데모버전</h1>
        <p className="mt-1 text-sm text-white/50">제주 재난 대응 플랫폼 프로토타입의 데모버전 안내 화면입니다.</p>
      </div>

      <Card title="버전 정보">
        <ul className="flex flex-col gap-2 text-sm text-white/70">
          <li>환경: {IS_SIMULATION_MODE ? "스테이징 (모의 재난대응)" : "프로토타입"}</li>
          <li>구분: 데모버전</li>
        </ul>
      </Card>
    </div>
  )
}
