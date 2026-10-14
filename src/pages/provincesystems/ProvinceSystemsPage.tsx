import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import { LegacySystemList } from "../../components/ui/LegacySystemList"
import { IS_STAGING } from "../../data/appMode"

/**
 * 운영 > 제주도청 시스템 — 요구사항 '제주도청 시스템 연계'(CCTV 시스템·조기경보 통합 상황 관리 연계시스템·강우량 연동 자동 경보 발령 시스템)에
 * 풍수해 상황 관리시스템·경보 전파 시스템(현황 정보 요청표 2026-09-20)을 더해 본다. 모두 섬엔지니어링이 유지보수하고, 도청 공문 승인 뒤 자료를 받는다(2026-10-02 면담).
 * 자료는 10월 중순 수령 예정이라 값은 임의 샘플이고 스테이징만 보여 준다(프로토타입은 '연계 전').
 */
const GROUPS: { title: string; subtitle: string; ids: string[] }[] = [
  { title: "경보·강우 시스템", subtitle: "조기경보 통합 상황 관리 연계시스템 · 강우량 연동 자동 경보 발령 시스템", ids: ["ls-ews", "ls-rain-alert"] },
  { title: "풍수해 상황·전파", subtitle: "풍수해 상황 관리시스템 · 경보 전파 시스템", ids: ["ls-flood-mgmt", "ls-alert-dispatch"] },
  { title: "CCTV", subtitle: "통합 관제 센터 CCTV — 영상은 저장하지 않고 스트리밍 링크로만 표출", ids: ["ls-prov-cctv"] },
]

export function ProvinceSystemsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">제주도청 시스템</h1>
        <p className="mt-1 text-sm text-white/50">
          제주도(자연재난과) 소관 시스템의 연계 상태와 받을 데이터 항목입니다. 도청이 직접 관리하지 않고 유지보수 업체(섬엔지니어링)가 있어, 도청 공문 승인 뒤 자료를 받는 절차입니다. 행정시 전용 시스템은{" "}
          <Link to="/city-systems" className="text-accent hover:underline">
            행정시 전용 시스템
          </Link>
          에서 봅니다.
        </p>
        <p className="mt-1 text-[11px] text-white/35">
          {IS_STAGING ? "스테이징 — 값은 모두 임의 샘플입니다(자료 10월 중순 수령 예정)." : "프로토타입 — 자료 수령 전이라 값 없이 '연계 전'으로 표시합니다."}
        </p>
      </div>
      {GROUPS.map((g) => (
        <Card key={g.title} title={g.title} subtitle={g.subtitle}>
          <LegacySystemList ids={g.ids} />
        </Card>
      ))}
    </div>
  )
}
