import { useState } from 'react'
import { login } from '../api/api'

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = async (email: string, password: string) => {
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.access)
      setToken(data.access)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem('token')
    setToken('')
  }

  return { token, signIn, signOut, error, loading }
}