import { useState, useEffect } from 'react'

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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">SETP Trading</h1>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white p-4 rounded font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-blue-800">Portfolio</h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {loading && <p className="text-center text-xl">Loading...</p>}
        {error && <p className="text-red-600 text-center text-xl">{error}</p>}

        {portfolio && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <h3 className="text-lg text-gray-600 mb-2">Cash Balance</h3>
                <p className="text-4xl font-bold">${portfolio.balance.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <h3 className="text-lg text-gray-600 mb-2">Holdings Value</h3>
                <p className="text-4xl font-bold">
                  ${(portfolio.total_portfolio_value - portfolio.balance).toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl text-center">
                <h3 className="text-lg text-blue-800 mb-2">Total Value</h3>
                <p className="text-4xl font-bold text-blue-800">
                  ${portfolio.total_portfolio_value.toFixed(2)}
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Holdings ({portfolio.holdings_count})</h2>

            {portfolio.holdings.length === 0 ? (
              <p className="text-gray-600 text-center py-12">No holdings yet — place an order!</p>
            ) : (
              <div className="grid gap-6">
                {portfolio.holdings.map((h: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-6 rounded-xl flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold">{h.asset.ticker} - {h.asset.name}</h3>
                      <p className="text-gray-600">Quantity: {h.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${h.current_value.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App