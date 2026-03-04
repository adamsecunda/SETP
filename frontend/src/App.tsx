import { useState, useMemo } from 'react' // Added useMemo
import { useAuth } from './hooks/useAuth'
import { usePortfolio } from './hooks/usePortfolio'
import Layout from './components/Layout'
import TopBar from './components/TopBar'
import PortfolioSummary from './components/PortfolioSummary'
import HoldingsPanel from './components/HoldingsPanel'
import WatchlistsPanel from './components/WatchlistsPanel'
import OrdersPanel from './components/OrdersPanel'
import { useMarketPrices } from './hooks/useMarketPrices'
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

  // OPTIMIZATION: Memoize market prices so they don't trigger 
  // downstream renders unless the actual data array changes.
  const memoizedPrices = useMemo(() => marketPrices, [marketPrices]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    await signIn(email, password)
    setPassword('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded shadow-2xl">
          <h1 className="text-2xl text-orange-500 font-bold mb-8 text-center tracking-tighter">
            SETP//TERMINAL
          </h1>
          <input
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="user@network.net"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="ACCESS_KEY"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {authError && (
            <div className="p-2 border border-red-900 bg-red-950 text-red-500 text-xs mb-4 animate-pulse">
              {authError}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full p-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-all duration-200 font-bold"
          >
            {authLoading ? "ESTABLISHING_LINK..." : "INITIATE_SESSION"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <TopBar onLogout={signOut} balance={portfolio?.balance} />

      <main className="p-6 max-w-[1600px] mx-auto font-mono text-white">
        
        {/* LIVE MARKET STRIP - Optimized rendering */}
        <div className="mb-4 bg-black border border-gray-800 overflow-hidden px-4 py-2 flex gap-8 text-[11px]">
          <div className="flex gap-8 animate-marquee whitespace-nowrap">
            {memoizedPrices.map(p => (
              <div key={p.ticker} className="flex-shrink-0">
                <span className="text-gray-500">{p.ticker}</span>
                <span className="text-orange-400 ml-2">${p.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PORTFOLIO SUMMARY */}
        <div className="mb-6">
          {portfolioLoading && !portfolio ? (
            <div className="h-24 bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-600 text-xs">
              <span className="animate-pulse">RETRIEVING_ENCRYPTED_METRICS...</span>
            </div>
          ) : (
            portfolio && <PortfolioSummary portfolio={portfolio} marketPrices={memoizedPrices} />
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8">
            <div className="bg-gray-950 border border-gray-800 rounded overflow-hidden shadow-xl">
              <div className="flex bg-black border-b border-gray-800">
                {(['HOLDINGS', 'ORDERS', 'HISTORY'] as MainTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-[10px] font-bold border-r border-gray-800 transition-all duration-150 ${
                      activeTab === tab
                        ? "text-orange-500 bg-gray-900 shadow-[inset_0_-2px_0_#f97316]"
                        : "text-gray-600 hover:text-gray-400 hover:bg-gray-900/50"
                    }`}
                  >
                    {tab}.SYS
                  </button>
                ))}
              </div>

              <div className="p-2 min-h-[520px] bg-opacity-50">
                {portfolioError && <div className="text-red-500 p-6 text-xs">{portfolioError}</div>}
                
                {/* Conditional Rendering without unmounting triggers */}
                <div className={activeTab === 'HOLDINGS' ? 'block' : 'hidden'}>
                  {portfolio && <HoldingsPanel portfolio={portfolio} marketPrices={memoizedPrices} />}
                </div>
                
                <div className={activeTab === 'ORDERS' ? 'block' : 'hidden'}>
                  <OrdersPanel token={token} onOrderComplete={refreshPortfolio} />
                </div>

                {activeTab === 'HISTORY' && (
                  <div className="text-center text-gray-600 text-[10px] p-12 uppercase tracking-widest">
                    <p className="opacity-50">No historical data available in current node.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR AREA */}
          <div className="lg:col-span-4">
            <section className="bg-gray-950 border border-gray-800 rounded overflow-hidden flex flex-col min-h-[520px] shadow-xl">
              <div className="flex bg-black border-b border-gray-800">
                {(['WATCHLIST', 'BALANCE'] as SidebarTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSidebar(tab)}
                    className={`flex-1 px-4 py-3 text-[10px] font-bold border-r border-gray-800 transition-all ${
                      activeSidebar === tab
                        ? "text-orange-500 bg-gray-900 shadow-[inset_0_-2px_0_#f97316]"
                        : "text-gray-600 hover:text-gray-400 hover:bg-gray-900/50"
                    }`}
                  >
                    {tab}.MDL
                  </button>
                ))}
                <div className="px-4 flex items-center justify-center bg-black">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {activeSidebar === 'WATCHLIST' ? (
                  <WatchlistsPanel token={token} marketPrices={memoizedPrices} />
                ) : (
                  <div className="p-4">
                    <BalancePanel token={token} onDepositComplete={refreshPortfolio} />
                  </div>
                )}
              </div>

              <div className="bg-black border-t border-gray-900 px-4 py-2 text-[8px] text-gray-700 flex justify-between uppercase">
                <span>Node_Verified: TRUE</span>
                <span>ID: {activeSidebar}_0x{Math.floor(Math.random()*1000)}</span>
              </div>
            </section>
          </div>

        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 px-4 py-1 text-[9px] flex justify-between z-50">
        <span className="text-gray-600">TERMINAL_STATUS: <span className="text-green-600">CONNECTED</span></span>
        <span className="text-gray-600 opacity-50">V1.0.4-STABLE</span>
      </footer>
    </Layout>
  )
}