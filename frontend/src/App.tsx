import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { usePortfolio } from './hooks/usePortfolio'
import Layout from './components/Layout'
import TopBar from './components/TopBar'
import PortfolioSummary from './components/PortfolioSummary'
import HoldingsPanel from './components/HoldingsPanel'
import WatchlistsPanel from './components/WatchlistsPanel'
import OrdersPanel from './components/OrdersPanel'

// Types for view switching
type MainTab = 'HOLDINGS' | 'ORDERS' | 'HISTORY'

function App() {
  const { token, signIn, signOut, error: authError, loading: authLoading } = useAuth()
  const { portfolio, loading: portfolioLoading, error: portfolioError } = usePortfolio(token)

  const [activeTab, setActiveTab] = useState<MainTab>('HOLDINGS')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    await signIn(email, password)
    setPassword('')
  }

  // Login
  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl text-orange-500 font-bold tracking-tighter">SETP//TERMINAL</h1>
            <p className="text-[10px] text-gray-500 mt-1">SECURE ACCESS GATEWAY V2.0.4</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 ml-1">IDENTITY_EMAIL</label>
              <input
                type="email"
                placeholder="user@network.net"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 bg-black border border-gray-800 text-orange-300 placeholder-gray-700 focus:outline-none focus:border-orange-600 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 ml-1">ACCESS_KEY</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 bg-black border border-gray-800 text-orange-300 placeholder-gray-700 focus:outline-none focus:border-orange-600 transition-colors"
              />
            </div>

            {authError && (
              <div className="p-2 border border-red-900 bg-red-950/30 text-red-500 text-[10px] text-center uppercase">
                Critical Error: {authError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={authLoading || !email.trim() || !password.trim()}
              className="w-full p-3 mt-4 border border-orange-500 text-orange-500 font-bold hover:bg-orange-500 hover:text-black transition-all disabled:opacity-30 disabled:grayscale"
            >
              {authLoading ? 'ESTABLISHING_CONNECTION...' : 'INITIATE_SESSION'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard
  return (
    <Layout>
      <TopBar onLogout={signOut} />
      
      <main className="p-4 md:p-6 max-w-[1600px] mx-auto font-mono text-white">
        
        {/* Row 1: High-Level Summary */}
        <div className="mb-6">
          {portfolioLoading ? (
            <div className="h-24 bg-gray-950 border border-gray-800 animate-pulse flex items-center justify-center text-gray-600">
              RETRIEVING_PORTFOLIO_METRICS...
            </div>
          ) : (
            portfolio && <PortfolioSummary portfolio={portfolio} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gray-950 border border-gray-800 rounded shadow-sm">
              <div className="flex bg-black border-b border-gray-800 overflow-x-auto">
                {(['HOLDINGS', 'ORDERS', 'HISTORY'] as MainTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-[11px] font-bold tracking-widest transition-all border-r border-gray-800 ${
                      activeTab === tab 
                        ? 'text-orange-500 bg-gray-900 border-b-2 border-b-orange-500' 
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {tab}.SYS
                  </button>
                ))}
              </div>
              {/* Dynamic panel */}
              <div className="p-1 min-h-[400px]">
                {portfolioError && <div className="p-6 text-red-500">{portfolioError}</div>}
                
                {activeTab === 'HOLDINGS' && portfolio && (
                  <HoldingsPanel portfolio={portfolio} />
                )}
                
                {activeTab === 'ORDERS' && (
                  <OrdersPanel token={token} />
                )}

                {activeTab === 'HISTORY' && (
                  <div className="p-8 text-center text-gray-700 text-xs">
                    HISTORY_MODULE_LOADED // NO_DATA_FOUND
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-gray-950 border border-gray-800 rounded overflow-hidden">
              <div className="bg-black px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                <span className="text-[10px] text-orange-500 font-bold">WATCHLIST.DATA</span>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <WatchlistsPanel token={token} />
              </div>
            </section>
          </div>

        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-4 py-1 flex justify-between items-center z-50">
        <div className="text-[9px] text-gray-600 flex gap-4">
          <span>SYSTEM: ONLINE</span>
          <span>LATENCY: 14ms</span>
          <span>FEED: NASDAQ_REALTIME</span>
        </div>
        <div className="text-[9px] text-orange-800">
          SETP_UNIV_PROJ_V1
        </div>
      </footer>
    </Layout>
  )
}

export default App