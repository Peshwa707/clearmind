import { createContext, useContext, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import databaseService from '../services/database'
import { useNetworkStatus } from '../hooks/useOfflineSync'

const AuthContext = createContext(null)

// Use environment variable or fallback to relative URL
const API_BASE = import.meta.env.VITE_API_URL || '/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('clearmind_token'))
  const [localUserId, setLocalUserId] = useState(() => localStorage.getItem('clearmind_local_user_id'))
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('online') // 'online' | 'local'
  const [dbReady, setDbReady] = useState(false)
  const { isOnline } = useNetworkStatus()

  // Initialize database
  useEffect(() => {
    const initDb = async () => {
      const success = await databaseService.initialize()
      setDbReady(success || Capacitor.getPlatform() === 'web')
    }
    initDb()
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for local user first
      if (localUserId && dbReady) {
        try {
          const localUser = await databaseService.getUserById(parseInt(localUserId))
          if (localUser) {
            setUser(localUser)
            setAuthMode('local')
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error loading local user:', error)
        }
      }

      // Check for online token
      if (token && isOnline) {
        await fetchUser()
      } else {
        setLoading(false)
      }
    }

    if (dbReady) {
      checkAuth()
    }
  }, [dbReady, isOnline])

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        setAuthMode('online')
      } else {
        // Token invalid, try local auth
        if (localUserId) {
          const localUser = await databaseService.getUserById(parseInt(localUserId))
          if (localUser) {
            setUser(localUser)
            setAuthMode('local')
          } else {
            logout()
          }
        } else {
          logout()
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      // Offline - try local auth
      if (localUserId) {
        try {
          const localUser = await databaseService.getUserById(parseInt(localUserId))
          if (localUser) {
            setUser(localUser)
            setAuthMode('local')
          }
        } catch (e) {
          console.error('Local auth also failed:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    // Try online login first if connected
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (res.ok) {
          const data = await res.json()
          setToken(data.access_token)
          setUser(data.user)
          setAuthMode('online')
          localStorage.setItem('clearmind_token', data.access_token)
          return data.user
        }
      } catch (error) {
        console.log('Online login failed, trying local:', error)
      }
    }

    // Fall back to local login
    try {
      const localUser = await databaseService.loginUser(email, password)
      setUser(localUser)
      setLocalUserId(localUser.id.toString())
      setAuthMode('local')
      localStorage.setItem('clearmind_local_user_id', localUser.id.toString())
      return localUser
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (email, password, name) => {
    // Try online registration first if connected
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })

        if (res.ok) {
          const data = await res.json()
          setToken(data.access_token)
          setUser(data.user)
          setAuthMode('online')
          localStorage.setItem('clearmind_token', data.access_token)

          // Also create local user for offline access
          try {
            await databaseService.createUser(email, name, password)
          } catch (e) {
            // Ignore if local creation fails (might already exist)
          }

          return data.user
        } else {
          const error = await res.json()
          throw new Error(error.detail || 'Registration failed')
        }
      } catch (error) {
        if (error.message && !error.message.includes('fetch')) {
          throw error
        }
        console.log('Online registration failed, trying local:', error)
      }
    }

    // Create local account
    try {
      const localUser = await databaseService.createUser(email, name, password)
      setUser(localUser)
      setLocalUserId(localUser.id.toString())
      setAuthMode('local')
      localStorage.setItem('clearmind_local_user_id', localUser.id.toString())
      return localUser
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setLocalUserId(null)
    setAuthMode('online')
    localStorage.removeItem('clearmind_token')
    localStorage.removeItem('clearmind_local_user_id')
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    authMode,
    isOnline,
    dbReady,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
