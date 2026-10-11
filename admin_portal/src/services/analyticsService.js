import { getAuthorityToken, logoutAuthority } from './authService'

const API_BASE_URL = 'http://localhost:4000/api'

export async function getAnalyticsSummary() {
  const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getAuthorityToken()}`,
    },
  })

  if (response.status === 401) {
    logoutAuthority()
    window.location.href = '/login'
    throw new Error('Your session has expired.')
  }

  const data = await response.json()
  if (!response.ok || data.success !== true) {
    throw new Error(data.message || 'Unable to load analytics.')
  }
  return data.data
}
