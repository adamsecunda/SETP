import { useState, useEffect } from 'react'
import { getWatchlists, createWatchlist, addToWatchlist, removeFromWatchlist, searchAssets } from '../api/api'
import type { Watchlist, AssetSearchResult } from '../types/watchlist'

export function useWatchlists(token: string | null) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setWatchlists([])
      return
    }
    fetchWatchlists()
  }, [token])

  const fetchWatchlists = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getWatchlists(token!)
      setWatchlists(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load watchlists')
      console.error('Fetch watchlists error:', err)
    } finally {
      setLoading(false)
    }
  }

  const addNewWatchlist = async (name: string) => {
    if (!token) return
    try {
      const newList = await createWatchlist(token, name)
      setWatchlists(prev => [...prev, newList])
    } catch (err: any) {
      setError(err.message || 'Failed to create watchlist')
      console.error('Create watchlist error:', err)
    }
  }

  const addAssetToList = async (watchlistId: number, assetId: number) => {
    if (!token) return
    try {
      await addToWatchlist(token, watchlistId, assetId)
      await fetchWatchlists()
    } catch (err: any) {
      setError(err.message || 'Failed to add asset')
      console.error('Add asset error:', err)
    }
  }

  const removeAssetFromList = async (watchlistId: number, itemId: number) => {
    if (!token) return
    try {
      await removeFromWatchlist(token, watchlistId, itemId)
      await fetchWatchlists()
    } catch (err: any) {
      setError(err.message || 'Failed to remove asset')
      console.error('Remove asset error:', err)
    }
  }

  const search = async (query: string) => {
    if (!token || !query.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const data = await searchAssets(token, query)
      const results = data.results || (Array.isArray(data) ? data : [])
      setSearchResults(results)
    } catch (err: any) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  return {
    watchlists,
    loading,
    error,
    addNewWatchlist,
    addAssetToList,
    removeAssetFromList,
    search,
    searchResults,
    searchLoading,
  }
}