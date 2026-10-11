import { getAuthorityToken } from './authService'

const API_BASE_URL = 'http://localhost:4000/api'

function headers() {
  return { Accept: 'application/json', Authorization: `Bearer ${getAuthorityToken()}` }
}

export async function getNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications`, { headers: headers() })
  const data = await response.json()
  if (!response.ok || data.success !== true) throw new Error(data.message || 'Unable to load notifications.')
  return data
}

export async function markNotificationRead(id) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH', headers: headers() })
  const data = await response.json()
  if (!response.ok || data.success !== true) throw new Error(data.message || 'Unable to update notification.')
  return data
}
