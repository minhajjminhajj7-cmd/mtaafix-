import {
  getAuthorityToken,
  logoutAuthority,
} from './authService'

const API_BASE_URL =
  'http://localhost:4000/api'

async function request(path, options = {}) {
  const token = getAuthorityToken()

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
  )

  if (response.status === 401) {
    logoutAuthority()
    window.location.href = '/login'

    throw new Error(
      'Your session has expired.',
    )
  }

  const data = await response.json()

  if (
    !response.ok ||
    data.success !== true
  ) {
    throw new Error(
      data.message ||
        'Unable to complete request.',
    )
  }

  return data
}

export function getServiceProviders() {
  return request('/service-providers')
}

export function getServiceProvider(id) {
  return request(
    `/service-providers/${id}`,
  )
}

export function createServiceProvider(payload) {
  return request('/service-providers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateServiceProvider(
  id,
  payload,
) {
  return request(
    `/service-providers/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function saveServiceProviderAccount(
  id,
  payload,
) {
  return request(
    `/service-providers/${id}/account`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function updateServiceProviderStatus(
  id,
  isActive,
) {
  return request(
    `/service-providers/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        isActive,
      }),
    },
  )
}
