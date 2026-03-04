import { useState, useEffect } from 'react'

const BASE_URL = 'http://127.0.0.1:8000'

export default function OrderHistory({ token }: { token: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchHistory = async (newOffset: number = 0) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/history/?limit=15&offset=${newOffset}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(prev => newOffset === 0 ? data.results : [...prev, ...data.results])
        setHasMore(!!data.next)
      }
    } catch (err) {
      console.error("LOG_SYNC_ERR", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchHistory(0) }, [token])

  const loadMore = () => {
    const nextOffset = offset + 15
    setOffset(nextOffset)
    fetchHistory(nextOffset)
  }

  if (loading && history.length === 0) return (
    <div className="p-20 text-center font-mono text-xs text-gray-600 animate-pulse tracking-[0.3em]">
      FETCHING_HISTORICAL_STREAMS...
    </div>
  )

  return (
    <div className="font-mono text-[11px] p-2 select-none text-white">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-gray-500 border-b border-gray-800 font-bold uppercase tracking-tighter bg-white/[0.02]">
        <div className="col-span-3">TIMESTAMP</div>
        <div className="col-span-2">TICKER</div>
        <div className="col-span-2 text-center">SIDE</div>
        <div className="col-span-2 text-right">QTY</div>
        <div className="col-span-3 text-right">STATUS</div>
      </div>

      <div className="max-h-[480px] overflow-y-auto no-scrollbar border-x border-gray-900/50">
        {history.length === 0 ? (
          <div className="py-20 text-center text-gray-700 italic border border-dashed border-gray-800 m-4 uppercase tracking-widest">
            Null_Archive_Result
          </div>
        ) : (
          history.map((order, idx) => (
            <div 
              key={order.id} 
              className={`grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-900/40 items-center transition-all duration-150 hover:bg-white/[0.04] ${idx % 2 === 0 ? 'bg-black' : 'bg-white/[0.01]'}`}
            >
              {/* Date - Dimmed Gray */}
              <div className="col-span-3 text-gray-600 font-light truncate">
                {new Date(order.timestamp).toLocaleDateString([], {month:'numeric', day:'numeric'})} <span className="opacity-40">{new Date(order.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>

              {/* Ticker - Pure White */}
              <div className="col-span-2 text-white font-black tracking-tight">
                {typeof order.asset === 'string' ? order.asset : order.asset.ticker}
              </div>

              {/* Side - Subdued Status Colors */}
              <div className={`col-span-2 text-center font-bold ${order.side === 'BUY' ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                {order.side === 'BUY' ? 'BUY' : 'SELL'}
              </div>

              <div className="col-span-2 text-right text-gray-400 font-mono">
                {order.quantity.toLocaleString()}
              </div>
              <div className="col-span-3 text-right">
                <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${
                  order.status === 'FILLED' 
                  ? 'border-gray-600 text-gray-300 bg-white/5' 
                  : 'border-gray-800 text-gray-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        )}

        {hasMore && (
          <button 
            onClick={loadMore}
            className="w-full py-4 text-gray-600 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest text-[9px] border-t border-gray-800"
          >
            [ + ] Request_More_Data
          </button>
        )}
      </div>

      <div className="mt-4 p-2 bg-black border border-gray-800 flex justify-between items-center text-[9px] text-gray-600">
        <div className="flex gap-4 uppercase">
          <span>Logs: {history.length}</span>
          <span className="opacity-30">|</span>
          <span>Buffer: Optimized</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          CONNECTED
        </div>
      </div>
    </div>
  )
}