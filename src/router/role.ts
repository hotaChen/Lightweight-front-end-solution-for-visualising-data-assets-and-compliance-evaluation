export type Role = 'VIEWER' | 'ADMIN'

const ROLE_KEY = 'platform_role'

export function currentRole(): Role {
  return localStorage.getItem(ROLE_KEY) === 'ADMIN' ? 'ADMIN' : 'VIEWER'
}
