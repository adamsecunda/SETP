import React from 'react' // Import React for memo

interface Props {
  onLogout: () => void
  balance?: number
}

const TopBar = React.memo(function TopBar({ onLogout, balance }: Props) {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 border-b border-gray-800 bg-black text-orange-400 font-mono text-xs">
      <div className="tracking-widest font-bold">
        SETP//TERMINAL
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">LIQUIDITY:</span>
          <span className="text-green-500">
            ${typeof balance === 'number' ? balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="border border-red-900 px-2 py-1 text-red-500 hover:bg-red-500 hover:text-black transition-all"
        >
          DISCONNECT
        </button>
      </div>
    </nav>
  )
})

export default TopBar