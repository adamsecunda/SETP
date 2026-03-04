import { useState, useEffect, useRef } from 'react'

const BASE_URL = 'http://127.0.0.1:8000'

interface AssetResult {
  id: number
  ticker: string
  name: string
}

interface Order {
  id: number
  asset: { ticker: string; name: string }
  side: 'BUY' | 'SELL'
  quantity: number
  status: string
}

export default function OrdersPanel({
  token,
  onOrderComplete
}: {
  token: string
  onOrderComplete?: () => Promise<void> | void
}) {

  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AssetResult[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetResult | null>(null)
  const [quantity, setQuantity] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  const searchRef = useRef<any>(null)

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  //  Polling logic
  useEffect(() => {
    if (!token) return
    fetchActiveOrders()
    const interval = setInterval(fetchActiveOrders, 1000)
    return () => clearInterval(interval)
  }, [token])

  //  ASSET SEARCH (RESTORED TO ORIGINAL LOGIC) 
  useEffect(() => {
    if (!searchQuery.trim() || selectedAsset) {
      setSearchResults([])
      return
    }

    if (searchRef.current) clearTimeout(searchRef.current)

    searchRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true)
        // Restored to your original working endpoint
        const res = await fetch(
          `${BASE_URL}/api/assets/?search=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) return
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error(err)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (searchRef.current) clearTimeout(searchRef.current)
    }
  }, [searchQuery, token, selectedAsset])

  //  FETCH ORDERS 
  const fetchActiveOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/active/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error(err)
    }
  }

  //  PLACE ORDER 
  const placeOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAsset || !quantity || Number(quantity) <= 0) return

    const url = side === 'BUY'
        ? `${BASE_URL}/api/orders/market-buy/`
        : `${BASE_URL}/api/orders/market-sell/`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          asset_id: selectedAsset.id,
          quantity: Number(quantity)
        })
      })

      if (!res.ok) return

      setQuantity('')
      setSearchQuery('')
      setSelectedAsset(null)
      setSearchResults([])

      setTimeout(fetchActiveOrders, 500)
      if (onOrderComplete) onOrderComplete()

    } catch (err) {
      console.error(err)
    }
  }

  // Cancel
  const cancelOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/cancel/`, {
        method: 'DELETE', // Matches CancelOrderView
        headers: {
          Authorization: `Bearer ${token}`
        },
      })
      
      // status 204 is 'No Content' - standard for successful DELETE
      if (res.status === 204 || res.ok) {
        fetchActiveOrders()
      }
    } catch (err) {
      console.error("Cancellation error:", err)
    }
  }

  return (
    <div className="bg-black border border-gray-800 rounded p-6 font-mono text-sm text-orange-400 mt-6">
      <div className="text-lg font-bold mb-6">
        ORDERS & TRADING
      </div>

      <div className="mb-10 border border-gray-800 p-4 rounded bg-gray-950/30">
        <div className="text-md font-semibold mb-4 uppercase tracking-wider">
          Place Order
        </div>

        <div className="relative mb-4">
          <input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              if (selectedAsset) setSelectedAsset(null)
            }}
            placeholder="SEARCH ASSET TICKER OR NAME"
            className="w-full bg-black border border-gray-800 p-2 text-orange-400 focus:border-orange-500 outline-none"
          />

          {searchLoading && (
            <div className="text-xs text-gray-500 mt-1 animate-pulse">
              SCANNING_DATABASE...
            </div>
          )}

          {searchResults.length > 0 && !selectedAsset && (
            <div className="absolute z-50 w-full max-h-48 overflow-y-auto border border-gray-800 bg-gray-900 shadow-2xl">
              {searchResults.map(asset => (
                <div
                  key={asset.id}
                  className="p-2 hover:bg-orange-900 cursor-pointer flex justify-between border-b border-gray-800 last:border-0"
                  onClick={() => {
                    setSelectedAsset(asset)
                    setSearchQuery(`${asset.ticker} — ${asset.name}`)
                    setSearchResults([])
                  }}
                >
                  <span className="font-bold">{asset.ticker}</span>
                  <span className="text-gray-400 truncate ml-4 uppercase text-[10px]">
                    {asset.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          placeholder="QUANTITY"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-full bg-black border border-gray-800 p-2 mb-4 text-orange-400 focus:border-orange-500 outline-none"
        />

        <div className="flex gap-4">
          <button
            onClick={() => placeOrder('BUY')}
            className="flex-1 border border-green-500 text-green-400 py-2 hover:bg-green-500 hover:text-black transition uppercase font-bold"
          >
            Buy
          </button>
          <button
            onClick={() => placeOrder('SELL')}
            className="flex-1 border border-red-500 text-red-400 py-2 hover:bg-red-500 hover:text-black transition uppercase font-bold"
          >
            Sell
          </button>
        </div>
      </div>

      <div className="text-md font-semibold mb-3 uppercase tracking-wider">
        Active Orders
      </div>

      {orders.length === 0 ? (
        <div className="text-gray-600 border border-dashed border-gray-800 p-4 text-center">
          NO_ACTIVE_TRANSACTIONS
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div key={order.id}
              className="flex justify-between items-center bg-gray-900/50 border border-gray-800 p-3 rounded group hover:border-gray-700">
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {order.side}
                  </span>
                  <span className="text-white">
                    {order.quantity} × {order.asset.ticker}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 uppercase mt-1">
                  Status: {order.status}
                </span>
              </div>

              {(order.status === 'PENDING' || order.status === 'PARTIAL') && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="text-[10px] border border-gray-700 text-gray-500 px-3 py-1 hover:border-red-500 hover:text-red-500 transition uppercase"
                >
                  [Terminate]
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}