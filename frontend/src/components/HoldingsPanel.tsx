export default function HoldingsPanel({ portfolio }: any) {
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
        portfolio.holdings.map((h: any, i: number) => (
          <div
            key={i}
            className="grid grid-cols-4 text-sm py-2 border-b border-gray-900"
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
              ${h.current_value.toFixed(2)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}