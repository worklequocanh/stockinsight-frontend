import { createContext, useContext, useEffect, useState } from 'react'
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/storage'
import { getCurrentUser, loginRequest } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getStoredToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      const savedToken = getStoredToken()
      if (!savedToken) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      try {
        const response = await getCurrentUser()
        if (isMounted) {
          setUser(response.user)
          setToken(savedToken)
        }
      } catch {
        clearStoredToken()
        if (isMounted) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email, password) {
    const data = await loginRequest(email, password)
    setStoredToken(data.accessToken)
    setToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
