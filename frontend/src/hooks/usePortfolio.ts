import { useState, useEffect } from 'react'
import { getPortfolio } from '../api/api'

export function usePortfolio(token: string | null) {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPortfolio(token)
        setPortfolio(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  return { portfolio, loading, error }
}