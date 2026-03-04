import { useState, useEffect, useRef, useMemo } from 'react'
import type { MarketPrice } from '../hooks/useMarketPrices'

const BASE_URL = 'http://127.0.0.1:8000'

interface AssetResult { id: number; ticker: string; name: string }
interface Order { id: number; asset: { ticker: string; name: string }; side: 'BUY' | 'SELL'; quantity: number; status: string }

interface Props {
  token: string
  marketPrices?: MarketPrice[]
  onOrderComplete?: () => Promise<void> | void
}

export default function OrdersPanel({ token, marketPrices = [], onOrderComplete }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AssetResult[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetResult | null>(null)
  const [quantity, setQuantity] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const searchRef = useRef<any>(null)

  // 1. Create Price Map (same logic as HoldingsPanel)
  const priceMap = useMemo(() => {
    const map: Record<string, number> = {}
    marketPrices.forEach(p => { map[p.ticker] = p.price })
    return map
  }, [marketPrices])

  // 2. Get live price for selected asset and calculate total
  const currentLivePrice = selectedAsset ? priceMap[selectedAsset.ticker] : null
  const estimatedTotal = currentLivePrice ? (Number(quantity) * currentLivePrice).toFixed(2) : "0.00"

  useEffect(() => {
    if (!token) return
    fetchActiveOrders()
    const interval = setInterval(fetchActiveOrders, 1500)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    if (!searchQuery.trim() || selectedAsset) { setSearchResults([]); return }
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true)
        const res = await fetch(`${BASE_URL}/api/assets/?search=${encodeURIComponent(searchQuery)}`, 
          { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setSearchResults(Array.isArray(data) ? data : data.results || [])
        }
      } finally { setSearchLoading(false) }
    }, 300)
  }, [searchQuery, token, selectedAsset])

  const fetchActiveOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/active/`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setOrders(await res.json())
    } catch (err) { console.error(err) }
  }

  const placeOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAsset || !quantity || Number(quantity) <= 0) return
    const url = side === 'BUY' ? `${BASE_URL}/api/orders/market-buy/` : `${BASE_URL}/api/orders/market-sell/`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_id: selectedAsset.id, quantity: Number(quantity) })
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ msg: `EXECUTED: ${side} ${quantity} ${selectedAsset.ticker}`, type: 'success' })
        setQuantity(''); setSearchQuery(''); setSelectedAsset(null)
        setTimeout(fetchActiveOrders, 500)
        if (onOrderComplete) onOrderComplete()
      } else {
        setFeedback({ msg: data.error || "REJECTED", type: 'error' })
      }
    } catch (err) { setFeedback({ msg: "CONNECTION_LOST", type: 'error' }) }
  }

  const cancelOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/cancel/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 204 || res.ok) fetchActiveOrders()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="bg-black border border-gray-800 rounded p-6 font-mono text-sm text-orange-400 mt-6 shadow-2xl">
      <div className="text-lg font-bold mb-6 tracking-tighter border-b border-gray-900 pb-2">ORDERS_MANAGEMENT.SYS</div>

      <div className="mb-8 border border-gray-800 p-4 rounded bg-gray-950/30">
        {feedback && (
          <div className={`mb-4 p-2 text-[10px] border ${feedback.type === 'success' ? 'border-green-900 text-green-500 bg-green-950/20' : 'border-red-900 text-red-500 bg-red-950/20'} animate-pulse`}>
            {feedback.msg}
          </div>
        )}

        <div className="relative mb-4">
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (selectedAsset) setSelectedAsset(null) }} placeholder="SCAN_ASSET_TICKER" className="w-full bg-black border border-gray-800 p-2 text-orange-400 focus:border-orange-500 outline-none placeholder:text-gray-700" />
          {searchResults.length > 0 && !selectedAsset && (
            <div className="absolute z-50 w-full border border-gray-800 bg-gray-950 shadow-2xl">
              {searchResults.map(a => (
                <div key={a.id} className="p-2 hover:bg-orange-950 cursor-pointer flex justify-between items-center border-b border-gray-900" onClick={() => { setSelectedAsset(a); setSearchQuery(a.ticker) }}>
                  <span className="font-bold">{a.ticker}</span>
                  <span className="text-[10px] text-gray-500 uppercase">${priceMap[a.ticker]?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedAsset && (
          <div className="mb-4 p-3 border border-gray-800 bg-black/50 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">MARKET_PRICE:</span>
              <span className="text-white font-bold">${currentLivePrice?.toFixed(2) || "---"}</span>
            </div>
            <div className="flex justify-between border-t border-gray-900 pt-1 mt-1">
              <span className="text-gray-600">EST_TOTAL:</span>
              <span className="text-orange-500 font-bold">${estimatedTotal}</span>
            </div>
          </div>
        )}

        <input type="number" placeholder="UNIT_QUANTITY" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-black border border-gray-800 p-2 mb-4 text-orange-400 focus:border-orange-500 outline-none" />

        <div className="flex gap-4">
          <button onClick={() => placeOrder('BUY')} className="flex-1 border border-green-600 text-green-500 py-2 hover:bg-green-600 hover:text-black transition-all font-bold">INIT_BUY</button>
          <button onClick={() => placeOrder('SELL')} className="flex-1 border border-red-600 text-red-500 py-2 hover:bg-red-600 hover:text-black transition-all font-bold">INIT_SELL</button>
        </div>
      </div>

      <div className="text-[10px] text-gray-600 mb-3 tracking-widest uppercase">Live_Orders_Queue</div>
      <div className="space-y-2">
        {orders.length === 0 ? (
          <div className="text-gray-800 border border-dashed border-gray-900 p-4 text-center text-xs">BUFFER_EMPTY</div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="flex justify-between items-center bg-gray-950/50 border border-gray-800 p-3 rounded group">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1 border ${order.side === 'BUY' ? 'border-green-900 text-green-500' : 'border-red-900 text-red-500'}`}>{order.side}</span>
                  <span className="text-white font-bold">{order.quantity} {order.asset.ticker}</span>
                </div>
                <div className="text-[9px] text-gray-600 uppercase mt-1">STATUS: {order.status}</div>
              </div>
              {(order.status === 'PENDING' || order.status === 'PARTIAL') && (
                <button onClick={() => cancelOrder(order.id)} className="text-[10px] border border-gray-700 text-gray-500 px-3 py-1 hover:border-red-500 hover:text-red-500 transition-all uppercase">[Abort]</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}