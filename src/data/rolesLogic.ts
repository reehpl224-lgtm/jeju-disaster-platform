/**
 * 사용자 역할·권한 정의 — 요구사항 '사용자·역할 관리'·'역할별 화면·운영환경 대응'.
 * 1차년도는 권한 체계 정의와 프로토타입 수준 적용: 역할 4종이 화면(메뉴·경로)과 서비스(데이터) 단위로 접근 범위를 가진다.
 * 초기값은 임의의 값이고, 관리자가 역할·권한 화면에서 고칠 수 있다(이 브라우저에만 저장). 실제 인증·서버 검증은 없다.
 */
export type RoleId = "control" | "vendor" | "field" | "admin"
export type UserRole = RoleId | "restricted"

export const ROLES: { id: RoleId; label: string; summary: string; home: string; demoAccount: string }[] = [
  { id: "control", label: "재난상황실 운영자", summary: "상황 감시·전파·보고, 대응 진행", home: "/dashboard?tab=summary", demoAccount: "control" },
  { id: "vendor", label: "시스템·운영업체 담당자", summary: "연계·모니터링 등 시스템 운영", home: "/monitoring", demoAccount: "vendor" },
  { id: "field", label: "현장 시설 운영자", summary: "담당 현장 서비스 확인·절차 이행", home: "/dashboard?tab=gis", demoAccount: "field" },
  { id: "admin", label: "관리자·의사결정자", summary: "결재·판단, 권한·e-SOP 정의", home: "/approvals", demoAccount: "jeju-ax" },
]
export const roleLabel = (r: UserRole) => (r === "restricted" ? "권한 없음" : (ROLES.find((x) => x.id === r)?.label ?? r))

/** 화면(메뉴) 단위 권한 — paths가 비어 있으면 화면이 아니라 화면 안의 기능(편집 버튼 등)에 쓰는 권한 */
export const PERMS = [
  { key: "dashboard", label: "종합상황·GIS·CCTV·공통 이벤트 조회", paths: ["/dashboard", "/events"] },
  { key: "approvals", label: "통합 결재함", paths: ["/approvals"] },
  { key: "esop", label: "e-SOP 대응·위험 단계 조건 조회", paths: ["/esop", "/criteria"] },
  { key: "esopEdit", label: "e-SOP 절차 정의 편집", paths: [] },
  { key: "orderIssue", label: "대응 지시 등록·전달·사건 종료 기록", paths: [] },
  { key: "orderApprove", label: "대응 지시 승인·반려(실제 조치 승인)", paths: [] },
  { key: "orderResult", label: "조치 결과 등록(수행 시작·완료·실패)", paths: [] },
  { key: "propagation", label: "상황전파·보고체계", paths: ["/propagation"] },
  { key: "reports", label: "이력·보고서", paths: ["/reports"] },
  { key: "system", label: "시스템 상태·연계현황·실증현황", paths: ["/monitoring", "/data-systems", "/data-usage", "/pilot-status", "/mock-api"] },
  { key: "input", label: "패널 입력·더미데이터", paths: ["/panel-input", "/dummy-data"] },
  { key: "roles", label: "역할·권한 관리", paths: ["/roles"] },
  { key: "audit", label: "이용 이력 조회", paths: ["/audit"] },
  { key: "integration", label: "연계 오류·검증", paths: ["/integration"] },
  { key: "scenario", label: "상황판단 시나리오 구성·시험", paths: ["/scenarios"] },
] as const
export type PermKey = (typeof PERMS)[number]["key"]

/** 서비스(데이터) 접근 범위 — 경로 접두사와 같은 id */
export const SERVICE_IDS = ["heavy-rain", "typhoon", "heat", "wildfire", "tsunami", "snow", "river", "aqua", "coast"] as const
export type ServiceId = (typeof SERVICE_IDS)[number]

export interface RolePolicy {
  perms: Record<RoleId, Record<PermKey, boolean>>
  services: Record<RoleId, ServiceId[]>
}

const allow = (keys: PermKey[]) => Object.fromEntries(PERMS.map((p) => [p.key, keys.includes(p.key)])) as Record<PermKey, boolean>

export function defaultPolicy(): RolePolicy {
  return {
    perms: {
      control: allow(["dashboard", "approvals", "esop", "orderIssue", "orderResult", "propagation", "reports", "input", "scenario"]),
      vendor: allow(["dashboard", "system", "input", "audit", "integration", "scenario"]),
      field: allow(["dashboard", "esop", "orderResult", "propagation"]),
      admin: allow(PERMS.map((p) => p.key)),
    },
    services: {
      control: [...SERVICE_IDS],
      vendor: [...SERVICE_IDS],
      field: ["river", "aqua", "coast"],
      admin: [...SERVICE_IDS],
    },
  }
}

/** 저장된 값이 깨졌거나 항목이 늘어도 기본값 위에 얹어 항상 완전한 정의를 만든다. 관리자의 '역할·권한 관리'는 잠금 방지를 위해 항상 허용 */
export function mergePolicy(saved: unknown): RolePolicy {
  const base = defaultPolicy()
  const s = (saved ?? {}) as Partial<RolePolicy>
  for (const r of ROLES) {
    for (const p of PERMS) {
      const v = s.perms?.[r.id]?.[p.key]
      if (typeof v === "boolean") base.perms[r.id][p.key] = v
    }
    const sv = s.services?.[r.id]
    if (Array.isArray(sv)) base.services[r.id] = SERVICE_IDS.filter((id) => sv.includes(id))
  }
  base.perms.admin.roles = true
  return base
}

/** 로그인 없이 볼 수 있는 화면과, 역할과 상관없이 허용하는 보조 화면 */
const ALWAYS = ["/403", "/login", "/vlm", "/ax-hub", "/demo-version", "/styleguide"]
const under = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`)

export function serviceOf(pathname: string): ServiceId | undefined {
  return SERVICE_IDS.find((id) => under(pathname, `/${id}`))
}

/** 이 역할이 이 경로를 열 수 있는가 — 서비스 경로는 서비스 범위, 그 밖의 화면은 화면 권한을 본다. 정의에 없는 경로는 허용 */
export function canAccess(role: UserRole, pathname: string, policy: RolePolicy): boolean {
  if (role === "restricted") return false
  if (ALWAYS.some((p) => under(pathname, p))) return true
  const svc = serviceOf(pathname)
  if (svc) return policy.services[role].includes(svc)
  const perm = PERMS.find((p) => p.paths.some((path) => under(pathname, path)))
  return perm ? policy.perms[role][perm.key] : true
}

export const hasPerm = (role: UserRole, key: PermKey, policy: RolePolicy) => role !== "restricted" && policy.perms[role][key]
export const canSeeService = (role: UserRole, id: string, policy: RolePolicy) => role !== "restricted" && (policy.services[role] as string[]).includes(id)
