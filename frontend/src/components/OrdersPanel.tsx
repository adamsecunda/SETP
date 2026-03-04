import { useState, useEffect } from 'react'

const BASE_URL = 'http://127.0.0.1:8000/api'

interface Order {
  id: number
  asset: { id: number; ticker: string; name: string }
  side: 'BUY' | 'SELL'
  order_type: 'MARKET' | 'LIMIT'
  quantity: number
  filled_quantity: number
  price?: number
  status: 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED'
  created_at: string
}

export default function OrdersPanel({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Trading form state
  const [selectedAsset, setSelectedAsset] = useState('')
  const [quantity, setQuantity] = useState('')

  useEffect(() => {
    if (!token) return
    fetchActiveOrders()
  }, [token])

  const fetchActiveOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/orders/active/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`)
      const data = await res.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const placeOrder = async (side: 'BUY' | 'SELL') => {
    if (!selectedAsset || !quantity || Number(quantity) <= 0) {
      setError('Select asset and enter valid quantity')
      return
    }

    const url = side === 'BUY'
      ? `${BASE_URL}/orders/market-buy/`
      : `${BASE_URL}/orders/market-sell/`

    setError('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_id: Number(selectedAsset),
          quantity: Number(quantity)
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Order failed')
      }

      await res.json()
      setQuantity('')
      setSelectedAsset('')
      fetchActiveOrders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const cancelOrder = async (orderId: number) => {
    if (!confirm('Cancel this order?')) return

    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Cancel failed')
      fetchActiveOrders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="p-6 text-gray-500 font-mono">LOADING ORDERS...</div>
  if (error) return <div className="p-6 text-red-500 font-mono">{error}</div>

  return (
    <div className="bg-black border border-gray-800 rounded p-6 font-mono text-sm text-orange-400 mt-6">
      <div className="text-lg font-bold mb-4">ORDERS & TRADING</div>

      {/* Place Order Form */}
      <div className="mb-8">
        <div className="text-md font-semibold mb-2">PLACE NEW ORDER</div>
        <div className="flex gap-4 mb-4">
          <select
            value={selectedAsset}
            onChange={e => setSelectedAsset(e.target.value)}
            className="bg-black border border-gray-800 p-2 text-orange-400 flex-1"
          >
            <option value="">SELECT ASSET</option>
            <option value="13">AAPL - Apple Inc.</option>
            {/* Add more options as needed */}
          </select>
          <input
            type="number"
            placeholder="QUANTITY"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="bg-black border border-gray-800 p-2 text-orange-400 w-32"
            min="1"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => placeOrder('BUY')}
            className="border border-green-500 px-6 py-2 text-green-400 hover:bg-green-500 hover:text-black transition flex-1"
          >
            BUY
          </button>
          <button
            onClick={() => placeOrder('SELL')}
            className="border border-red-500 px-6 py-2 text-red-400 hover:bg-red-500 hover:text-black transition flex-1"
          >
            SELL
          </button>
        </div>
      </div>
      <div>
        <div className="text-md font-semibold mb-2">ACTIVE ORDERS</div>
        {orders.length === 0 ? (
          <div className="text-gray-600">NO ACTIVE ORDERS</div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded">
                <div>
                  <span className="font-bold text-orange-300">
                    {order.side} {order.quantity} × {order.asset.ticker}
                  </span>
                  <span className="text-gray-500 ml-3">
                    — {order.status} {order.filled_quantity > 0 ? `(${order.filled_quantity} filled)` : ''}
                  </span>
                </div>
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="text-red-500 hover:text-red-400 text-xs font-medium"
                >
                  CANCEL
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}