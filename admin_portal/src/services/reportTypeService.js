import { getAuthorityToken, logoutAuthority } from './authService'

const API_BASE_URL = 'http://localhost:4000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getAuthorityToken()}`,
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

export const getCategoriesAdmin = () => request('/categories?includeInactive=true')
export const createCategory = (payload) => request('/categories', { method: 'POST', body: JSON.stringify(payload) })
export const updateCategory = (id, payload) => request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' })

export const getProblemTypesAdmin = () => request('/problem-types?includeInactive=true')
export const createProblemType = (payload) => request('/problem-types', { method: 'POST', body: JSON.stringify(payload) })
export const updateProblemType = (id, payload) => request(`/problem-types/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteProblemType = (id) => request(`/problem-types/${id}`, { method: 'DELETE' })
