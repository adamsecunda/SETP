import StatBlock from '../StatBlock'
import type { MarketPrice } from "../hooks/useMarketPrices"
import { useMemo } from "react"

interface Props {
  portfolio: any
  marketPrices?: MarketPrice[]
}

export default function PortfolioSummary({
  portfolio,
  marketPrices = []
}: Props) {

  const portfolioValue = useMemo(() => {
    const priceMap: Record<string, number> = {}

    marketPrices.forEach(p => {
      priceMap[p.ticker] = p.price
    })

    let holdingsValue = 0

    portfolio.holdings.forEach((h: any) => {
      const livePrice = priceMap[h.asset.ticker]

      if (livePrice !== undefined) {
        holdingsValue += livePrice * h.quantity
      } else {
        holdingsValue += h.current_value
      }
    })

    const cash = portfolio.balance

    return {
      cash,
      holdings: holdingsValue,
      total: cash + holdingsValue
    }

  }, [portfolio, marketPrices])

  return (
    <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-800">
      <StatBlock
        label="Cash"
        value={portfolioValue.cash}
      />

      <StatBlock
        label="Holdings"
        value={portfolioValue.holdings}
      />

      <StatBlock
        label="Total"
        value={portfolioValue.total}
      />
    </div>
  )
}