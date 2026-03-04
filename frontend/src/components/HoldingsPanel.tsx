import type{ MarketPrice } from "../hooks/useMarketPrices"
import { useMemo } from "react"

interface Props {
  portfolio: any
  marketPrices?: MarketPrice[]
}

export default function HoldingsPanel({
  portfolio,
  marketPrices = []
}: Props) {

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {}

    marketPrices.forEach(p => {
      map[p.ticker] = p.price
    })

    return map
  }, [marketPrices])

  return (
    <div className="p-6">
      <div className="text-orange-400 text-xs uppercase mb-4 tracking-widest">
        Positions ({portfolio.holdings_count})
      </div>

      <div className="grid grid-cols-4 text-xs text-gray-500 border-b border-gray-800 pb-2 mb-2">
        <div>TICKER</div>
        <div>NAME</div>
        <div className="text-right">QTY</div>
        <div className="text-right">VALUE</div>
      </div>

      {portfolio.holdings.length === 0 ? (
        <div className="text-gray-600 text-sm mt-4">
          NO OPEN POSITIONS
        </div>
      ) : (
        portfolio.holdings.map((h: any, i: number) => {

          const livePrice = priceMap[h.asset.ticker]

          const value =
            livePrice !== undefined
              ? livePrice * h.quantity
              : h.current_value

          return (
            <div
              key={i}
              className="grid grid-cols-4 text-sm py-2 border-b border-gray-900 transition-all duration-300"
            >
              <div className="text-white font-bold">
                {h.asset.ticker}
              </div>

              <div className="text-gray-400">
                {h.asset.name}
              </div>

              <div className="text-right">
                {h.quantity}
              </div>

              <div className="text-right text-green-400">
                ${value.toFixed(2)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}