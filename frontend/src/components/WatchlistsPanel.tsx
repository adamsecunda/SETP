import { useState, useEffect } from 'react'

const BASE_URL = 'http://127.0.0.1:8000/api'

interface Watchlist {
  id: number
  name: string
  created_at: string
  items: Array<{
    id: number
    asset: { id: number; ticker: string; name: string }
    added_at: string
  }>
}

export default function WatchlistsPanel({ token }: { token: string }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [assetId, setAssetId] = useState('')

  useEffect(() => {
    fetchWatchlists()
  }, [])

  const fetchWatchlists = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/watchlists/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load watchlists')
      const data = await res.json()
      setWatchlists(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createWatchlist = async () => {
    if (!newName.trim()) return
    try {
      const res = await fetch(`${BASE_URL}/watchlists/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName.trim() })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.name?.[0] || 'Failed to create')
      }
      const newList = await res.json()
      setWatchlists([...watchlists, newList])
      setNewName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const addAsset = async (watchlistId: number) => {
    if (!assetId.trim()) return alert('Enter an asset ID')
    try {
      const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ asset_id: Number(assetId) })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.non_field_errors?.[0] || 'Failed to add asset')
      }
      setAssetId('')
      setAddingTo(null)
      fetchWatchlists()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const removeItem = async (watchlistId: number, itemId: number) => {
    if (!confirm('Remove this asset?')) return

    try {
      const res = await fetch(`${BASE_URL}/watchlists/${watchlistId}/items/${itemId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to remove')
      }
      fetchWatchlists()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="p-6 text-gray-500 font-mono">LOADING WATCHLISTS...</div>
  if (error) return <div className="p-6 text-red-500 font-mono">{error}</div>

  return (
    <div className="bg-black border border-gray-800 rounded p-6 font-mono text-sm text-orange-400 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-bold">WATCHLISTS</div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="NEW WATCHLIST NAME"
            className="bg-black border border-gray-800 p-2 text-orange-400 placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={createWatchlist}
            className="border border-orange-500 px-4 py-2 hover:bg-orange-500 hover:text-black transition"
          >
            CREATE
          </button>
        </div>
      </div>

      {watchlists.length === 0 ? (
        <div className="text-gray-600">NO WATCHLISTS YET</div>
      ) : (
        <div className="space-y-6">
          {watchlists.map(wl => (
            <div key={wl.id} className="border border-gray-800 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">{wl.name}</div>
                <div className="flex gap-3">
                  {addingTo === wl.id ? (
                    <>
                      <input
                        type="number"
                        value={assetId}
                        onChange={e => setAssetId(e.target.value)}
                        placeholder="ASSET ID"
                        className="bg-black border border-gray-800 p-2 w-32 text-orange-400 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => addAsset(wl.id)}
                        className="border border-green-500 px-3 py-1 hover:bg-green-500 hover:text-black transition text-xs"
                      >
                        ADD
                      </button>
                      <button
                        onClick={() => setAddingTo(null)}
                        className="border border-gray-600 px-3 py-1 hover:bg-gray-700 transition text-xs"
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setAddingTo(wl.id)}
                      className="border border-orange-500 px-3 py-1 hover:bg-orange-500 hover:text-black transition text-xs"
                    >
                      + ADD ASSET
                    </button>
                  )}
                </div>
              </div>

              {wl.items.length === 0 ? (
                <div className="text-gray-600 italic">EMPTY</div>
              ) : (
                <div className="space-y-2">
                  {wl.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded">
                      <div>
                        <span className="font-bold">{item.asset.ticker}</span>
                        <span className="text-gray-500 ml-2"> - {item.asset.name}</span>
                      </div>
                      <button
                        onClick={() => removeItem(wl.id, item.id)}
                        className="text-red-500 hover:text-red-400 text-xs"
                      >
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}