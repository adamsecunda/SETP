import { useState, useMemo, useCallback, memo } from 'react'
import { useAuth } from './hooks/useAuth'
import { usePortfolio } from './hooks/usePortfolio'
import { useMarketPrices } from './hooks/useMarketPrices'
import Layout from './components/Layout'
import TopBar from './components/TopBar'
import PortfolioSummary from './components/PortfolioSummary'
import HoldingsPanel from './components/HoldingsPanel'
import WatchlistsPanel from './components/WatchlistsPanel'
import OrdersPanel from './components/OrdersPanel'
import BalancePanel from './components/BalancePanel'
import OrderHistory from './components/OrderHistory'

// Cache for performance
const MemoizedHoldings = memo(HoldingsPanel)
const MemoizedOrders = memo(OrdersPanel)
const MemoizedWatchlist = memo(WatchlistsPanel)
const MemoizedSummary = memo(PortfolioSummary)

type MainTab = 'HOLDINGS' | 'ORDERS' | 'HISTORY'
type SidebarTab = 'WATCHLIST' | 'BALANCE'

export default function App() {
  const { token, signIn, signOut, error: authError, loading: authLoading } = useAuth()
  const { portfolio, loading: portfolioLoading, refresh: refreshPortfolio } = usePortfolio(token)
  
  // High-frequency data hook (Prices update often)
  const { prices: marketPrices } = useMarketPrices(token)

  // Auth & UI State
  const [isRegistering, setIsRegistering] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('HOLDINGS')
  const [activeSidebar, setActiveSidebar] = useState<SidebarTab>('WATCHLIST')
  
  // Form State
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  // OPTIMIZATION: Keep references stable
  const handleLogout = useCallback(() => signOut(), [signOut])
  const handleRefresh = useCallback(() => refreshPortfolio(), [refreshPortfolio])
  const memoizedPrices = useMemo(() => marketPrices, [marketPrices])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    setLocalError('')
    await signIn(email, password)
    setPassword('')
  }

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !username.trim()) {
      setLocalError("ERR_REQUIRED_FIELDS_MISSING")
      return
    }
    
    setLocalError('')
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      if (response.ok) {
        await signIn(email, password)
      } else {
        const data = await response.json()
        setLocalError(data.detail || "ERR_REGISTRATION_FAILED")
      }
    } catch (err) {
      setLocalError("ERR_NETWORK_TIMEOUT")
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded shadow-2xl">
          <h1 className="text-2xl text-orange-500 font-bold mb-8 text-center tracking-tighter">
            SETP//{isRegistering ? "CREATE_IDENTITY" : "TERMINAL"}
          </h1>

          {isRegistering && (
            <input 
              className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 outline-none focus:border-orange-500 transition-colors" 
              placeholder="NETWORK_HANDLE" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          )}

          <input 
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 outline-none focus:border-orange-500 transition-colors" 
            placeholder="USER@NETWORK.NET" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          
          <input 
            type="password" 
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 outline-none focus:border-orange-500 transition-colors" 
            placeholder="ACCESS_KEY" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />

          {(authError || localError) && (
            <div className="p-2 border border-red-900 bg-red-950 text-red-500 text-[10px] mb-4 animate-pulse uppercase">
              STATUS_ERROR: {authError || localError}
            </div>
          )}

          <button 
            onClick={isRegistering ? handleRegister : handleLogin} 
            disabled={authLoading} 
            className="w-full p-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-all font-bold mb-4 uppercase"
          >
            {authLoading ? "ESTABLISHING_LINK..." : isRegistering ? "CONFIRM_REGISTRATION" : "INITIATE_SESSION"}
          </button>

          <button 
            onClick={() => {
                setIsRegistering(!isRegistering)
                setLocalError('')
            }}
            className="w-full text-[10px] text-gray-600 hover:text-orange-400 uppercase tracking-widest transition-colors"
          >
            {isRegistering ? "Back to Login" : "No identity detected? Register"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <TopBar onLogout={handleLogout} balance={portfolio?.balance} />

      <main className="p-6 pb-24 max-w-[1600px] mx-auto font-mono text-white">

        <div className="mb-4 bg-black border border-gray-800 overflow-x-auto px-4 py-2 flex gap-8 text-[11px] no-scrollbar">
          {memoizedPrices.map(p => (
            <div key={p.ticker} className="flex-shrink-0">
              <span className="text-gray-500">{p.ticker}</span>
              <span className="text-orange-400 ml-2">${p.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          {portfolioLoading && !portfolio ? (
            <div className="h-24 bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-600 text-xs animate-pulse">RETRIEVING_METRICS...</div>
          ) : (
            portfolio && <MemoizedSummary portfolio={portfolio} marketPrices={memoizedPrices} />
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="bg-gray-950 border border-gray-800 rounded overflow-hidden shadow-xl">
              <div className="flex bg-black border-b border-gray-800">
                {(['HOLDINGS', 'ORDERS', 'HISTORY'] as MainTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-[10px] font-bold border-r border-gray-800 transition-all ${activeTab === tab ? "text-orange-500 bg-gray-900 shadow-[inset_0_-2px_0_#f97316]" : "text-gray-600 hover:text-gray-400"}`}>
                    {tab}.SYS
                  </button>
                ))}
              </div>

              <div className="p-2 min-h-[520px]">
                {activeTab === 'HOLDINGS' && portfolio && (
                  <MemoizedHoldings portfolio={portfolio} marketPrices={memoizedPrices} />
                )}
                {activeTab === 'ORDERS' && (
                  <MemoizedOrders token={token} marketPrices={memoizedPrices} onOrderComplete={handleRefresh} />
                )}
                {activeTab === 'HISTORY' && (
                  <OrderHistory token={token} />
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <section className="bg-gray-950 border border-gray-800 rounded overflow-hidden flex flex-col min-h-[520px] shadow-xl">
              <div className="flex bg-black border-b border-gray-800">
                {(['WATCHLIST', 'BALANCE'] as SidebarTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveSidebar(tab)} className={`flex-1 px-4 py-3 text-[10px] font-bold border-r border-gray-800 transition-all ${activeSidebar === tab ? "text-orange-500 bg-gray-900 shadow-[inset_0_-2px_0_#f97316]" : "text-gray-600 hover:text-gray-400"}`}>
                    {tab}.MDL
                  </button>
                ))}
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {activeSidebar === 'WATCHLIST' ? (
                  <MemoizedWatchlist token={token} marketPrices={memoizedPrices} />
                ) : (
                  <div className="p-4"><BalancePanel token={token} onDepositComplete={handleRefresh} /></div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 px-4 py-1 text-[9px] flex justify-between z-50">
        <span className="text-gray-600 uppercase">Status: Connected</span>
        <span className="text-gray-600 opacity-50 uppercase tracking-tighter">V1.0.4-STABLE</span>
      </footer>
    </Layout>
  )
}