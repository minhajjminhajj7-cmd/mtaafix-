const API_BASE_URL = 'http://localhost:4000/api'

const TOKEN_KEY = 'mtaafix_admin_token'
const USER_KEY = 'mtaafix_admin_user'

const PORTAL_ROLES = [
  'super_admin',
  'service_provider',
]


function persistPortalSession(data) {
  const role = data.user?.role
  if (!PORTAL_ROLES.includes(role)) {
    throw new Error('This account does not have access to the operations portal.')
  }
  sessionStorage.setItem(TOKEN_KEY, data.token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
  return data
}

export async function requestAuthorityOtp(phone) {
  const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone: phone.trim() }),
  })
  const data = await response.json()
  if (!response.ok || data.success !== true) throw new Error(data.message || 'Unable to send verification code.')
  return data
}

export async function verifyAuthorityOtp(phone, code) {
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
  })
  const data = await response.json()
  if (!response.ok || data.success !== true) throw new Error(data.message || 'Unable to verify code.')
  return persistPortalSession(data)
}

export async function loginAuthority(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      identifier: email.trim(),
      password,
    }),
  })

  const data = await response.json()

  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message || 'Unable to sign in.',
    )
  }

  return persistPortalSession(data)
}

export function getAuthorityToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getAuthorityUser() {
  const raw =
    sessionStorage.getItem(USER_KEY)

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAuthorityAuthenticated() {
  const token = getAuthorityToken()
  const user = getAuthorityUser()

  return Boolean(
    token &&
      user &&
      PORTAL_ROLES.includes(user.role),
  )
}

export function isSuperAdmin() {
  return (
    getAuthorityUser()?.role ===
    'super_admin'
  )
}

export function logoutAuthority() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
