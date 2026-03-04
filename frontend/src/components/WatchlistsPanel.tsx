import { useState, useEffect, useRef } from 'react'
import { useWatchlists } from '../hooks/useWatchlists'
import type { Watchlist, AssetSearchResult, WatchlistItem } from '../types/watchlist'

export default function WatchlistsPanel({ token }: { token: string }) {
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

  const [newName, setNewName] = useState('')
  const [addingTo, setAddingTo] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Define handleAdd first so it's available in useEffect
  const handleAdd = (watchlistId: number, assetId: number) => {
    addAssetToList(watchlistId, assetId)
    setSearchQuery('')
    setAddingTo(null)
    setHighlightedIndex(null)
  }

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || addingTo === null) {
      setHighlightedIndex(null)
      return
    }

    const timer = setTimeout(() => {
      search(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, addingTo])

  // Reset highlight when results or addingTo change
  useEffect(() => {
    setHighlightedIndex(null)
  }, [searchResults, addingTo])

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (addingTo === null || searchResults.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => {
          if (prev === null || prev >= searchResults.length - 1) return 0
          return prev + 1
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => {
          if (prev === null || prev <= 0) return searchResults.length - 1
          return prev - 1
        })
      } else if (e.key === 'Enter' && highlightedIndex !== null) {
        e.preventDefault()
        const selected = searchResults[highlightedIndex]
        if (selected && addingTo !== null) {
          handleAdd(addingTo, selected.id)
        }
      } else if (e.key === 'Escape') {
        setAddingTo(null)
        setSearchQuery('')
        setHighlightedIndex(null)
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchResults, highlightedIndex, addingTo])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex === null || !resultsRef.current) return

    const container = resultsRef.current
    const items = container.querySelectorAll('div[data-highlightable="true"]')
    const highlighted = items[highlightedIndex] as HTMLElement

    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [highlightedIndex])

  const handleCreate = () => {
    if (!newName.trim()) return
    addNewWatchlist(newName.trim())
    setNewName('')
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
            onClick={handleCreate}
            className="border border-orange-500 px-4 py-2 hover:bg-orange-500 hover:text-black transition"
          >
            CREATE
          </button>
        </div>
      </div>

      {watchlists.length === 0 ? (
        <div className="text-gray-600">NO WATCHLISTS YET - CREATE ONE ABOVE</div>
      ) : (
        <div className="space-y-6">
          {watchlists.map((wl: Watchlist) => (
            <div key={wl.id} className="border border-gray-800 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">{wl.name}</div>
                <div className="flex gap-3">
                  {addingTo === wl.id ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex gap-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="SEARCH TICKER OR NAME"
                          className="flex-1 bg-black border border-gray-800 p-2 text-orange-400 placeholder-gray-600 focus:outline-none focus:border-orange-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            setAddingTo(null)
                            setSearchQuery('')
                            setHighlightedIndex(null)
                          }}
                          className="border border-gray-600 px-3 py-1 hover:bg-gray-700 transition text-xs"
                        >
                          CANCEL
                        </button>
                      </div>

                      {searchLoading && <div className="text-gray-500 text-xs">SEARCHING...</div>}

                      {searchResults.length > 0 ? (
                        <div
                          ref={resultsRef}
                          className="max-h-48 overflow-y-auto border border-gray-800 rounded bg-gray-900/70"
                        >
                          {searchResults.map((asset: AssetSearchResult, index: number) => (
                            <div
                              key={asset.id}
                              data-highlightable="true"
                              className={`p-2 cursor-pointer flex justify-between items-center transition ${
                                index === highlightedIndex
                                  ? 'bg-orange-900/70 text-white'
                                  : 'hover:bg-gray-800 text-orange-300 hover:text-white'
                              }`}
                              onClick={() => handleAdd(wl.id, asset.id)}
                            >
                              <div className="font-bold">{asset.ticker}</div>
                              <div className="text-gray-400 truncate ml-4">{asset.name}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        searchQuery.trim() && !searchLoading && (
                          <div className="text-gray-600 text-xs mt-2">NO MATCHING ASSETS</div>
                        )
                      )}
                    </div>
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
                <div className="text-gray-600 italic text-center py-4">EMPTY WATCHLIST</div>
              ) : (
                <div className="space-y-2">
                  {wl.items.map((item: WatchlistItem) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded">
                      <div>
                        <span className="font-bold text-orange-300">{item.asset.ticker}</span>
                        <span className="text-gray-500 ml-3">— {item.asset.name}</span>
                      </div>
                      <button
                        onClick={() => removeAssetFromList(wl.id, item.asset.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-medium"
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