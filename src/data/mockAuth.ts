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

export function login(orgId: string): MockUser {
  const user = DEMO_USERS[orgId] ?? DEMO_USERS["jeju-ax"]
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
