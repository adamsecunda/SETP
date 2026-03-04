import { useEffect, useState } from "react"

export interface MarketPrice {
  ticker: string
  price: number
}

export function useMarketPrices(token: string | null) {
  const [prices, setPrices] = useState<MarketPrice[]>([])

  useEffect(() => {
    if (!token) return

    const fetchPrices = () => {
      fetch("http://localhost:8000/api/market/prices/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error("Unauthorized")
          return res.json()
        })
        .then(setPrices)
        .catch(() => {})
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 1000)

    return () => clearInterval(interval)
  }, [token])

  return { prices }
}