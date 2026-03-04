import { useState, useEffect, useCallback } from 'react'
import { getPortfolio } from '../api/api'

export function usePortfolio(token: string | null) {

  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchPortfolio = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await getPortfolio(token)
      setPortfolio(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  return {
    portfolio,
    loading,
    error,
    refresh: fetchPortfolio
  }
}