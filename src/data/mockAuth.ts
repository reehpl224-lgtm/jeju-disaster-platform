export type UserRole = "operator" | "restricted"

export interface MockUser {
  orgId: string
  name: string
  org: string
  role: UserRole
}

// 새 창(target=_blank)으로 연 "대시보드 상세 화면"에서도 로그인 상태가 이어지도록 localStorage 사용
// (sessionStorage는 탭마다 별도라 새 창을 열면 다시 로그인해야 했음 — 2026-09-28 수정)
const STORAGE_KEY = "jeju-ax-session"

const DEMO_USERS: Record<string, MockUser> = {
  "jeju-ax": { orgId: "jeju-ax", name: "홍길동", org: "제주특별자치도 재난대응1팀", role: "operator" },
  "guest": { orgId: "guest", name: "체험 계정", org: "권한 미승인", role: "restricted" },
}

/** 데모 계정 사원번호 목록 — 로그인 화면 안내가 이 목록을 그대로 보여준다(안내와 실제 동작이 어긋나지 않게) */
export const DEMO_ACCOUNTS = Object.values(DEMO_USERS).map((u) => ({ orgId: u.orgId, name: u.name, role: u.role }))

/**
 * 1차년도 프로토타입 — 어떤 값을 넣어도 로그인된다(실제 인증 없음). 사원번호가 `guest`면 권한 없음 체험 계정,
 * 그 밖의 값(비어 있거나 등록되지 않은 값 포함)은 팀장(jeju-ax) 계정으로 들어간다.
 */
export function login(orgId: string): MockUser {
  const user = DEMO_USERS[orgId.trim()] ?? DEMO_USERS["jeju-ax"]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getCurrentUser(): MockUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockUser
  } catch {
    return null
  }
}
