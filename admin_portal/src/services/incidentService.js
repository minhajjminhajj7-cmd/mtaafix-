import {
  getAuthorityToken,
  logoutAuthority,
} from './authService'

const API_BASE_URL = 'http://localhost:4000/api'

async function authorityRequest(path, options = {}) {
  const token = getAuthorityToken()
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    logoutAuthority()
    window.location.href = '/login'
    throw new Error('Your session has expired.')
  }

  const data = await response.json()
  if (!response.ok || data.success !== true) {
    throw new Error(data.message || 'Unable to complete request.')
  }
  return data
}

export const getIncidents = () => authorityRequest('/incidents')
export const getIncidentById = (id) => authorityRequest(`/incidents/${id}`)

export const createManualIncident = (payload) => authorityRequest('/incidents/manual', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateIncidentPriority = (id, priority) => authorityRequest(`/incidents/${id}/priority`, {
  method: 'PATCH',
  body: JSON.stringify({ priority }),
})

export const restoreIncident = (id, note = '') => authorityRequest(`/incidents/${id}/restore`, {
  method: 'PATCH',
  body: JSON.stringify({ note }),
})

// Super Admin exception controls.
export const assignIncident = (id, authorityId) => authorityRequest(`/incidents/${id}/assign`, {
  method: 'PATCH',
  body: JSON.stringify({ authorityId }),
})

export const archiveIncident = (id, note = '') => authorityRequest(`/incidents/${id}/archive`, {
  method: 'PATCH',
  body: JSON.stringify({ note }),
})

export const deleteIncident = (id) => authorityRequest(`/incidents/${id}`, {
  method: 'DELETE',
})

export const messageDepartment = (id, message) => authorityRequest(`/incidents/${id}/message-department`, {
  method: 'POST',
  body: JSON.stringify({ message }),
})

// Department-owned operational workflow.
export const reviewIncident = (id, note = '') => authorityRequest(`/incidents/${id}/review`, {
  method: 'PATCH',
  body: JSON.stringify({ note }),
})

export const acceptIncident = (id) => authorityRequest(`/incidents/${id}/accept`, { method: 'PATCH' })
export const startIncidentWork = (id) => authorityRequest(`/incidents/${id}/start-work`, { method: 'PATCH' })

export async function addIncidentProgress(id, note = '', evidenceFiles = []) {
  const form = new FormData()
  form.append('note', note)
  evidenceFiles.forEach((file) => form.append('evidence', file))
  return authorityRequest(`/incidents/${id}/progress`, { method: 'POST', body: form })
}

export async function resolveIncident(id, resolutionNote, evidenceFiles = []) {
  const form = new FormData()
  form.append('resolutionNote', resolutionNote)
  evidenceFiles.forEach((file) => form.append('evidence', file))
  return authorityRequest(`/incidents/${id}/resolve`, { method: 'PATCH', body: form })
}
