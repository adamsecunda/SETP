import { useState } from 'react'
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

  const {
    portfolio,
    loading: portfolioLoading,
    error: portfolioError,
    refresh: refreshPortfolio
  } = usePortfolio(token)

  const { prices: marketPrices } = useMarketPrices(token)

  const [activeTab, setActiveTab] = useState<MainTab>('HOLDINGS')
  const [activeSidebar, setActiveSidebar] = useState<SidebarTab>('WATCHLIST')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    await signIn(email, password)
    setPassword('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded shadow-2xl">
          <h1 className="text-2xl text-orange-500 font-bold mb-8 text-center">
            SETP//TERMINAL
          </h1>

          <input
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 focus:outline-none focus:border-orange-500"
            placeholder="user@network.net"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-3 bg-black border border-gray-800 mb-4 text-orange-300 focus:outline-none focus:border-orange-500"
            placeholder="ACCESS_KEY"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {authError && (
            <div className="p-2 border border-red-900 bg-red-950 text-red-500 text-xs mb-4">
              {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full p-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors"
          >
            {authLoading ? "CONNECTING..." : "INITIATE_SESSION"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <TopBar
        onLogout={signOut}
        balance={portfolio?.balance}
      />

      <main className="p-6 max-w-[1600px] mx-auto font-mono text-white">

        {/* LIVE MARKET STRIP */}
        <div className="mb-4 bg-black border border-gray-800 overflow-x-auto whitespace-nowrap px-4 py-2 flex gap-8 text-[11px] no-scrollbar">
          {marketPrices.map(p => (
            <div key={p.ticker}>
              <span className="text-gray-500">{p.ticker}</span>
              <span className="text-orange-400 ml-2">
                ${p.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* PORTFOLIO SUMMARY */}
        <div className="mb-6">
          {portfolioLoading ? (
            <div className="h-24 bg-gray-950 border border-gray-800 flex items-center justify-center text-gray-600">
              RETRIEVING_PORTFOLIO_METRICS...
            </div>
          ) : (
            portfolio && (
              <PortfolioSummary
                portfolio={portfolio}
                marketPrices={marketPrices}
              />
            )
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8">
            <div className="bg-gray-950 border border-gray-800 rounded overflow-hidden">
              <div className="flex bg-black border-b border-gray-800">
                {(['HOLDINGS', 'ORDERS', 'HISTORY'] as MainTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-xs font-bold border-r border-gray-800 transition-all ${activeTab === tab
                      ? "text-orange-500 bg-gray-900 border-b-2 border-orange-500 shadow-[inset_0_-2px_0_rgba(249,115,22,1)]"
                      : "text-gray-600 hover:text-gray-400"
                      }`}
                  >
                    {tab}.SYS
                  </button>
                ))}
              </div>

              <div className="p-2 min-h-[500px]">
                {portfolioError && (
                  <div className="text-red-500 p-6">
                    {portfolioError}
                  </div>
                )}

                {activeTab === 'HOLDINGS' && portfolio && (
                  <HoldingsPanel
                    portfolio={portfolio}
                    marketPrices={marketPrices}
                  />
                )}

                {activeTab === 'ORDERS' && (
                  <OrdersPanel
                    token={token}
                    onOrderComplete={refreshPortfolio}
                  />
                )}

                {activeTab === 'HISTORY' && (
                  <div className="text-center text-gray-600 text-xs p-12">
                    <p className="animate-pulse">ACCESSING_ARCHIVAL_DATA...</p>
                    <p className="mt-2 text-[10px] opacity-50 underline">NO_RECORDS_FOUND</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR AREA */}
          <div className="lg:col-span-4">
            <section className="bg-gray-950 border border-gray-800 rounded overflow-hidden flex flex-col min-h-[500px]">

              {/* SIDEBAR TABS */}
              <div className="flex bg-black border-b border-gray-800">
                {(['WATCHLIST', 'BALANCE'] as SidebarTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSidebar(tab)}
                    className={`flex-1 px-4 py-3 text-[10px] font-bold border-r border-gray-800 transition-all ${activeSidebar === tab
                      ? "text-orange-500 bg-gray-900 border-b-2 border-orange-500 shadow-[inset_0_-2px_0_rgba(249,115,22,1)]"
                      : "text-gray-600 hover:text-gray-400"
                      }`}
                  >
                    {tab}.MDL
                  </button>
                ))}
                <div className="px-4 flex items-center justify-center bg-black">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
                </div>
              </div>

              {/* SIDEBAR CONTENT PANEL */}
              <div className="flex-grow">
                {activeSidebar === 'WATCHLIST' ? (
                  <div className="animate-in fade-in slide-in-from-right-1 duration-300">
                    <WatchlistsPanel token={token} marketPrices={marketPrices} />
                  </div>
                ) : (
                  <div className="p-4 animate-in fade-in slide-in-from-right-1 duration-300">
                    <BalancePanel
                      token={token}
                      onDepositComplete={refreshPortfolio}
                    />
                  </div>
                )}
              </div>

              {/* MODULE FOOTER */}
              <div className="bg-black border-t border-gray-900 px-4 py-2 text-[9px] text-gray-700 flex justify-between uppercase tracking-widest">
                <span>Status: Optimal</span>
                <span>ID: {activeSidebar}_SEC_04</span>
              </div>

            </section>
          </div>

        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-black border-t border-gray-800 px-4 py-1 text-[9px] flex justify-between z-50">
        <span className="text-gray-500">SYSTEM_STATUS: <span className="text-green-600">ONLINE</span></span>
        <span className="text-gray-700 font-bold uppercase">SETP_UNIV_PROJ_V1 // BUILT_BY_AI_GEN</span>
      </footer>
    </Layout>
  )
}