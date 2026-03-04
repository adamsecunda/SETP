import { useState, useEffect, useRef } from 'react'

const BASE_URL = 'http://127.0.0.1:8000'

interface AssetResult { id: number; ticker: string; name: string }
interface Order { id: number; asset: { ticker: string; name: string }; side: 'BUY' | 'SELL'; quantity: number; status: string }

export default function OrdersPanel({ token, onOrderComplete }: { token: string; onOrderComplete?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AssetResult[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetResult | null>(null)
  const [quantity, setQuantity] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<any>(null)

  const fetchActiveOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/active/`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setOrders(await res.json())
    } catch (err) { console.error(err) }
  }

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
        const res = await fetch(`${BASE_URL}/api/assets/?search=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setSearchResults(Array.isArray(data) ? data : data.results || [])
        }
      } finally { setSearchLoading(false) }
    }, 300)
  }, [searchQuery, token, selectedAsset])

  const placeOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAsset || !quantity || Number(quantity) <= 0) return
    const url = side === 'BUY' ? `${BASE_URL}/api/orders/market-buy/` : `${BASE_URL}/api/orders/market-sell/`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_id: selectedAsset.id, quantity: Number(quantity) })
      })
      if (res.ok) {
        setQuantity(''); setSearchQuery(''); setSelectedAsset(null);
        setTimeout(fetchActiveOrders, 500);
        if (onOrderComplete) onOrderComplete();
      }
    } catch (err) { console.error(err) }
  }

  const cancelOrder = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}/cancel/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 204 || res.ok) fetchActiveOrders()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="bg-black font-mono text-sm text-orange-400 p-4">
      <div className="mb-6 border border-gray-800 p-4 rounded bg-gray-950/30">
        <div className="relative mb-4">
          <input value={searchQuery} onChange={e => {setSearchQuery(e.target.value); if(selectedAsset) setSelectedAsset(null)}} placeholder="TICKER_SEARCH" className="w-full bg-black border border-gray-800 p-2 text-orange-400 focus:border-orange-500 outline-none" />
          {searchResults.length > 0 && !selectedAsset && (
            <div className="absolute z-50 w-full max-h-48 overflow-y-auto border border-gray-800 bg-gray-900 shadow-2xl">
              {searchResults.map(a => (
                <div key={a.id} className="p-2 hover:bg-orange-900 cursor-pointer flex justify-between border-b border-gray-800 last:border-0" onClick={() => {setSelectedAsset(a); setSearchQuery(a.ticker); setSearchResults([])}}>
                  <span className="font-bold">{a.ticker}</span>
                  <span className="text-gray-400 text-[10px] uppercase">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <input type="number" placeholder="QTY" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-black border border-gray-800 p-2 mb-4 text-orange-400 focus:border-orange-500 outline-none" />
        <div className="flex gap-4">
          <button onClick={() => placeOrder('BUY')} className="flex-1 border border-green-500 text-green-400 py-2 hover:bg-green-500 hover:text-black font-bold uppercase">Buy</button>
          <button onClick={() => placeOrder('SELL')} className="flex-1 border border-red-500 text-red-400 py-2 hover:bg-red-500 hover:text-black font-bold uppercase">Sell</button>
        </div>
      </div>
      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="flex justify-between items-center bg-gray-900/50 border border-gray-800 p-3 rounded group">
            <div>
              <span className={`font-bold ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{order.side}</span>
              <span className="text-white ml-2">{order.quantity} × {order.asset.ticker}</span>
              <div className="text-[9px] text-gray-500 uppercase mt-1">Status: {order.status}</div>
            </div>
            {(order.status === 'PENDING' || order.status === 'PARTIAL') && (
              <button onClick={() => cancelOrder(order.id)} className="text-[10px] border border-gray-700 text-gray-500 px-3 py-1 hover:border-red-500 hover:text-red-500 transition uppercase">[Terminate]</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}