import type { Watchlist, AssetSearchResult } from '../types/watchlist'

const BASE_URL = 'http://127.0.0.1:8000/api'

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(token),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let errData
    try {
      errData = await res.json()
    } catch {
      // If not JSON, get text for better error
      const text = await res.text()
      throw new Error(`Request failed: ${res.status} ${res.statusText} - ${text.substring(0, 200)}...`)
    }
    throw new Error(
      errData?.detail ||
      errData?.non_field_errors?.[0] ||
      `Request failed: ${res.status} ${res.statusText}`
    )
  }

  // Handle no-content responses (204, empty DELETE/POST)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null as T  // or true or {} depending on what you expect
  }

  return res.json()
}

// Specific endpoints (unchanged except types)
export const login = (email: string, password: string) =>
  apiRequest<{ access: string }>('/token/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const getPortfolio = (token: string) =>
  apiRequest<any>('/portfolio/', { method: 'GET' }, token)

export const deposit = (token: string, amount: string) =>
  apiRequest('/deposit/', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }, token)

export const getWatchlists = (token: string) =>
  apiRequest<Watchlist[]>('/watchlists/', { method: 'GET' }, token)

export const createWatchlist = (token: string, name: string) =>
  apiRequest<Watchlist>('/watchlists/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, token)

export const addToWatchlist = (token: string, watchlistId: number, assetId: number) =>
  apiRequest(`/watchlists/${watchlistId}/items/`, {
    method: 'POST',
    body: JSON.stringify({ asset_id: assetId }),
  }, token)

export const removeFromWatchlist = (token: string, watchlistId: number, itemId: number) =>
  apiRequest(`/watchlists/${watchlistId}/items/${itemId}/`, {
    method: 'DELETE',
  }, token)

export const searchAssets = (token: string, query: string) =>
  apiRequest<{ results: AssetSearchResult[] }>('/assets/?search=' + encodeURIComponent(query), {
    method: 'GET',
  }, token)