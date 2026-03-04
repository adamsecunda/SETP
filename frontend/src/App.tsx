import { useState } from 'react'
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

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return
    }
    await signIn(email, password)
    // Clear fields on success or error
    setPassword('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md rounded">
          <h1 className="text-xl mb-6 text-orange-400 font-mono text-center">SETP TERMINAL LOGIN</h1>

          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm text-orange-300 placeholder-gray-600 focus:outline-none focus:border-orange-500 rounded"
          />

          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm text-orange-300 placeholder-gray-600 focus:outline-none focus:border-orange-500 rounded"
          />

          {authError && (
            <p className="text-red-500 text-xs mb-4 text-center">{authError}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={authLoading || !email.trim() || !password.trim()}
            className={`w-full p-3 border border-orange-500 text-orange-400 font-mono text-sm rounded hover:bg-orange-500 hover:text-black transition disabled:opacity-50 ${
              authLoading ? 'cursor-wait' : ''
            }`}
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