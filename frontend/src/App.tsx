import { useAuth } from './hooks/useAuth'
import { usePortfolio } from './hooks/usePortfolio'
import Layout from './components/Layout'
import TopBar from './components/TopBar'
import PortfolioSummary from './components/PortfolioSummary'
import HoldingsPanel from './components/HoldingsPanel'
import WatchlistsPanel from './components/WatchlistsPanel'

function App() {
  const { token, signIn, signOut, error: authError, loading: authLoading } = useAuth()
  const { portfolio, loading: portfolioLoading, error: portfolioError } = usePortfolio(token)

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md">
          <h1 className="text-xl mb-6 text-orange-400 font-mono">SETP TERMINAL LOGIN</h1>
          <input
            type="email"
            placeholder="EMAIL"
            onChange={e => {/* you can add state here if needed */}}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            onChange={e => {/* state */}}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm"
          />
          {authError && <p className="text-red-500 text-xs mb-4">{authError}</p>}
          <button
            onClick={() => handleLogin('your@email.com', 'pass')} // replace with form values
            disabled={authLoading}
            className="w-full p-3 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-black text-sm disabled:opacity-50"
          >
            {authLoading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <TopBar onLogout={signOut} />
      {portfolioLoading && <div className="p-6 text-gray-500 text-sm">LOADING...</div>}
      {portfolioError && <div className="p-6 text-red-500 text-sm">{portfolioError}</div>}
      {portfolio && (
        <>
          <PortfolioSummary portfolio={portfolio} />
          <HoldingsPanel portfolio={portfolio} />
          <WatchlistsPanel token={token} />
        </>
      )}
    </Layout>
  )
}

export default App