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

 
  // Poll Active Orders
 

  useEffect(() => {
    if (!token) return

    fetchActiveOrders()

    const interval = setInterval(fetchActiveOrders, 1000)

    return () => clearInterval(interval)

  }, [token])

 
  // Asset Search
  useEffect(() => {

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    if (searchRef.current) clearTimeout(searchRef.current)

    searchRef.current = setTimeout(async () => {

      try {

        setSearchLoading(true)

        const res = await fetch(
          `${BASE_URL}/api/assets/?search=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!res.ok) return

        const data = await res.json()

        setSearchResults(
          Array.isArray(data)
            ? data
            : data.results || []
        )

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

  }, [searchQuery, token])

 
  // Fetch Orders
 

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

 
  // Place Order
  const placeOrder = async (side: 'BUY' | 'SELL') => {

    if (!selectedAsset || !quantity || Number(quantity) <= 0) return

    const url =
      side === 'BUY'
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

      // Backend matcher delay buffer
      setTimeout(fetchActiveOrders, 500)

      if (onOrderComplete) {
        onOrderComplete()
      }

    } catch (err) {
      console.error(err)
    }
  }

 
  // Render
  return (
    <div className="bg-black border border-gray-800 rounded p-6 font-mono text-sm text-orange-400 mt-6">

      <div className="text-lg font-bold mb-6">
        ORDERS & TRADING
      </div>

      <div className="mb-10 border border-gray-800 p-4 rounded">

        <div className="text-md font-semibold mb-4">
          PLACE ORDER
        </div>

        <div className="relative mb-4">

          <input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setSelectedAsset(null)
            }}
            placeholder="SEARCH ASSET TICKER OR NAME"
            className="w-full bg-black border border-gray-800 p-2 text-orange-400"
          />

          {searchLoading && (
            <div className="text-xs text-gray-500 mt-1">
              SEARCHING...
            </div>
          )}

          {searchResults.length > 0 && !selectedAsset && (
            <div className="absolute z-50 w-full max-h-48 overflow-y-auto border border-gray-800 bg-gray-900">

              {searchResults.map(asset => (
                <div
                  key={asset.id}
                  className="p-2 hover:bg-orange-900 cursor-pointer flex justify-between"
                  onClick={() => {
                    setSelectedAsset(asset)
                    setSearchQuery(`${asset.ticker} — ${asset.name}`)
                    setSearchResults([])
                  }}
                >
                  <span className="font-bold">{asset.ticker}</span>
                  <span className="text-gray-400 truncate ml-4">
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
          className="w-full bg-black border border-gray-800 p-2 mb-4 text-orange-400"
        />

        <div className="flex gap-4">

          <button
            onClick={() => placeOrder('BUY')}
            className="flex-1 border border-green-500 text-green-400 py-2 hover:bg-green-500 hover:text-black transition"
          >
            BUY
          </button>

          <button
            onClick={() => placeOrder('SELL')}
            className="flex-1 border border-red-500 text-red-400 py-2 hover:bg-red-500 hover:text-black transition"
          >
            SELL
          </button>

        </div>

      </div>

      <div className="text-md font-semibold mb-3">
        ACTIVE ORDERS
      </div>

      {orders.length === 0 ? (
        <div className="text-gray-600">NO ACTIVE ORDERS</div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div key={order.id}
              className="flex justify-between bg-gray-900/50 p-3 rounded">

              <div>
                <span className="font-bold text-orange-300">
                  {order.side} {order.quantity} × {order.asset.ticker}
                </span>

                <span className="text-gray-500 ml-3">
                  — {order.status}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}