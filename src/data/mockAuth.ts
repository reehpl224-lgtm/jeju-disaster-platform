export type UserRole = "operator" | "restricted"

export interface MockUser {
  orgId: string
  name: string
  org: string
  role: UserRole
}

const STORAGE_KEY = "jeju-ax-session"

const DEMO_USERS: Record<string, MockUser> = {
  "jeju-ax": { orgId: "jeju-ax", name: "홍길동", org: "제주특별자치도 재난대응1팀", role: "operator" },
  "guest": { orgId: "guest", name: "체험 계정", org: "권한 미승인", role: "restricted" },
}

export function login(orgId: string): MockUser {
  const user = DEMO_USERS[orgId] ?? DEMO_USERS["jeju-ax"]
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function getCurrentUser(): MockUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MockUser
  } catch {
    return null
  }
}
