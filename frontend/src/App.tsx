import { useState, useMemo, useCallback } from 'react'
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

type MainTab = 'HOLDINGS' | 'ORDERS' | 'HISTORY'
type SidebarTab = 'WATCHLIST' | 'BALANCE'

export default function App() {
  const { token, signIn, signOut, error: authError, loading: authLoading } = useAuth()
  const { portfolio, loading: portfolioLoading, error: portfolioError, refresh: refreshPortfolio } = usePortfolio(token)
  const { prices: marketPrices } = useMarketPrices(token)

  const [activeTab, setActiveTab] = useState<MainTab>('HOLDINGS')
  const [activeSidebar, setActiveSidebar] = useState<SidebarTab>('WATCHLIST')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // OPTIMIZATION: Keep references stable to prevent TopBar/Orders re-renders
  const handleLogout = useCallback(() => signOut(), [signOut])
  const handleRefresh = useCallback(() => refreshPortfolio(), [refreshPortfolio])
  const memoizedPrices = useMemo(() => marketPrices, [marketPrices])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    await signIn(email, password)
    setPassword('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded">
          <h1 className="text-2xl text-orange-500 font-bold mb-8 text-center tracking-tighter">SETP//TERMINAL</h1>
          <input className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 outline-none" placeholder="user@network.net" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 outline-none" placeholder="ACCESS_KEY" value={password} onChange={e => setPassword(e.target.value)} />
          {authError && <div className="p-2 border border-red-900 bg-red-950 text-red-500 text-xs mb-4 animate-pulse">{authError}</div>}
          <button onClick={handleLogin} disabled={authLoading} className="w-full p-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-all font-bold">
            {authLoading ? "ESTABLISHING_LINK..." : "INITIATE_SESSION"}
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
            portfolio && <PortfolioSummary portfolio={portfolio} marketPrices={memoizedPrices} />
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
                <div className={activeTab === 'HOLDINGS' ? 'block' : 'hidden'}>
                  {portfolio && <HoldingsPanel portfolio={portfolio} marketPrices={memoizedPrices} />}
                </div>
                <div className={activeTab === 'ORDERS' ? 'block' : 'hidden'}>
                  <OrdersPanel token={token} marketPrices={memoizedPrices} onOrderComplete={handleRefresh} />
                </div>
                {activeTab === 'HISTORY' && <div className="text-center text-gray-600 text-[10px] p-12 uppercase">No historical data available.</div>}
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
                {activeSidebar === 'WATCHLIST' ? <WatchlistsPanel token={token} marketPrices={memoizedPrices} /> : <div className="p-4"><BalancePanel token={token} onDepositComplete={handleRefresh} /></div>}
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