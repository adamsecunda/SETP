import StatBlock from '../StatBlock'

export default function PortfolioSummary({ portfolio }: any) {
  const holdingsValue =
    portfolio.total_portfolio_value - portfolio.balance

  return (
    <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-800">
      <StatBlock label="Cash" value={portfolio.balance} />
      <StatBlock label="Holdings" value={holdingsValue} />
      <StatBlock label="Total" value={portfolio.total_portfolio_value} />
    </div>
  )
}