import { useState, useEffect, useRef } from 'react'
import { useWatchlists } from '../hooks/useWatchlists'
import type { Watchlist, AssetSearchResult, WatchlistItem } from '../types/watchlist'

// Define the Price interface to match your market feed
interface Price {
  ticker: string;
  price: number;
}

interface WatchlistsPanelProps {
  token: string;
  marketPrices: Price[]; // Add this to props
}

export default function WatchlistsPanel({ token, marketPrices }: WatchlistsPanelProps) {
  const {
    watchlists,
    loading,
    error,
    addNewWatchlist,
    addAssetToList,
    removeAssetFromList,
    search,
    searchResults,
    searchLoading,
  } = useWatchlists(token)

  // --- Helper to find price ---
  const getLivePrice = (ticker: string) => {
    const marketData = marketPrices.find(p => p.ticker === ticker);
    return marketData ? marketData.price.toFixed(2) : '---';
  }

  const [newName, setNewName] = useState('')
  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleAdd = (watchlistId: number, assetId: number) => {
    addAssetToList(watchlistId, assetId)
    setSearchQuery('')
    setAddingTo(null)
    setHighlightedIndex(null)
  }

  // search logic
  useEffect(() => {
    if (!searchQuery.trim() || addingTo === null) {
      setHighlightedIndex(null)
      return
    }
    const timer = setTimeout(() => { search(searchQuery) }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, addingTo])

  useEffect(() => { setHighlightedIndex(null) }, [searchResults, addingTo])

  // Navigation logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (addingTo === null || searchResults.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => (prev === null || prev >= searchResults.length - 1) ? 0 : prev + 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => (prev === null || prev <= 0) ? searchResults.length - 1 : prev - 1)
      } else if (e.key === 'Enter' && highlightedIndex !== null) {
        e.preventDefault()
        const selected = searchResults[highlightedIndex]
        if (selected) handleAdd(addingTo, selected.id)
      } else if (e.key === 'Escape') {
        setAddingTo(null); setSearchQuery(''); setHighlightedIndex(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchResults, highlightedIndex, addingTo])

  const handleCreate = () => {
    if (!newName.trim()) return
    addNewWatchlist(newName.trim())
    setNewName('')
  }

  if (loading) return <div className="p-6 text-gray-500 font-mono animate-pulse">LOADING_DATA...</div>
  if (error) return <div className="p-6 text-red-500 font-mono">ERR: {error}</div>

  return (
    <div className="bg-black font-mono text-sm text-orange-400 p-4">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="NEW_LIST_ID"
            className="flex-grow bg-black border border-gray-800 p-2 text-xs focus:border-orange-500 outline-none"
          />
          <button
            onClick={handleCreate}
            className="border border-orange-500 px-3 py-1 text-xs hover:bg-orange-500 hover:text-black transition"
          >
            CREATE
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {watchlists.map((wl: Watchlist) => (
          <div key={wl.id} className="border border-gray-900 rounded overflow-hidden">
            <div className="bg-gray-950 p-2 flex justify-between items-center border-b border-gray-900">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{wl.name}</span>
              <button 
                onClick={() => setAddingTo(addingTo === wl.id ? null : wl.id)}
                className="text-[10px] border border-gray-700 px-2 py-0.5 hover:border-orange-500"
              >
                {addingTo === wl.id ? 'CLOSE' : '+ ASSET'}
              </button>
            </div>

            {addingTo === wl.id && (
              <div className="p-2 border-b border-gray-900 bg-black">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SEARCH_TICKER"
                  className="w-full bg-gray-900 border border-gray-800 p-1.5 text-xs outline-none"
                  autoFocus
                />
                {searchResults.length > 0 && (
                   <div className="mt-1 max-h-32 overflow-y-auto bg-gray-950 border border-gray-800">
                     {searchResults.map((asset, idx) => (
                       <div 
                        key={asset.id} 
                        onClick={() => handleAdd(wl.id, asset.id)}
                        className={`p-2 text-[10px] cursor-pointer ${idx === highlightedIndex ? 'bg-orange-500 text-black' : 'hover:bg-gray-800'}`}
                       >
                         {asset.ticker} - {asset.name}
                       </div>
                     ))}
                   </div>
                )}
              </div>
            )}

            <div className="divide-y divide-gray-900">
              {wl.items.map((item: WatchlistItem) => (
                <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-900/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-orange-400 text-xs">{item.asset.ticker}</span>
                    <span className="text-[9px] text-gray-600 truncate max-w-[80px]">{item.asset.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-orange-300 font-mono text-xs">
                      ${getLivePrice(item.asset.ticker)}
                    </span>
                    <button
                      onClick={() => removeAssetFromList(wl.id, item.asset.id)}
                      className="text-red-900 hover:text-red-500 text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {wl.items.length === 0 && (
                <div className="p-4 text-[10px] text-gray-700 text-center uppercase tracking-widest">List_Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}