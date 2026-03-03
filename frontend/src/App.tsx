import { useState, useEffect } from 'react'

import Layout from './components/Layout'
import TopBar from './components/TopBar.tsx'
import PortfolioSummary from './components/PortfolioSummary'
import HoldingsPanel from './components/HoldingsPanel'

const BASE_URL = 'http://127.0.0.1:8000/api'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('token', data.access)
      setToken(data.access)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadPortfolio = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/portfolio/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to load')
      setPortfolio(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setPortfolio(null)
  }

  useEffect(() => {
    if (token) loadPortfolio()
  }, [token])

  /* ================= LOGIN ================= */

  if (!token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="p-8 border border-gray-800 bg-gray-950 w-full max-w-md">
          <h1 className="text-xl mb-6 text-orange-400 font-mono">
            SETP TERMINAL LOGIN
          </h1>

          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm"
          />

          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 mb-4 bg-black border border-gray-800 text-sm"
          />

          {error && (
            <p className="text-red-500 text-xs mb-4">{error}</p>
          )}

          <button
            onClick={login}
            className="w-full p-3 border border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-black text-sm"
          >
            LOGIN
          </button>
        </div>
      </div>
    )
  }

  /* ================= TERMINAL DASHBOARD ================= */

  return (
    <Layout>
      <TopBar onLogout={logout} />

      {loading && (
        <div className="p-6 text-gray-500 text-sm">
          LOADING...
        </div>
      )}

      {error && (
        <div className="p-6 text-red-500 text-sm">
          {error}
        </div>
      )}

      {portfolio && (
        <>
          <PortfolioSummary portfolio={portfolio} />
          <HoldingsPanel portfolio={portfolio} />
        </>
      )}
    </Layout>
  )
}

export default App