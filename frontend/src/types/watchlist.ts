export interface Watchlist {
  id: number
  name: string
  created_at: string
  items: WatchlistItem[]
}

export interface WatchlistItem {
  id: number
  asset: {
    id: number
    ticker: string
    name: string
    type?: string
  }
  added_at: string
}

export interface AssetSearchResult {
  id: number
  ticker: string
  name: string
  type: string
}