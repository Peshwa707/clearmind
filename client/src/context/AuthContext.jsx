import { createContext, useContext, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import databaseService from '../services/database'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [localUserId, setLocalUserId] = useState(() => localStorage.getItem('clearmind_local_user_id'))
  const [loading, setLoading] = useState(true)
  const [dbReady, setDbReady] = useState(false)

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
      if (localUserId && dbReady) {
        try {
          const localUser = await databaseService.getUserById(parseInt(localUserId))
          if (localUser) {
            setUser(localUser)
          }
        } catch (error) {
          console.error('Error loading local user:', error)
        }
      }
      setLoading(false)
    }

    if (dbReady) {
      checkAuth()
    }
  }, [dbReady, localUserId])

  const login = async (email, password) => {
    try {
      const localUser = await databaseService.loginUser(email, password)
      setUser(localUser)
      setLocalUserId(localUser.id.toString())
      localStorage.setItem('clearmind_local_user_id', localUser.id.toString())
      return localUser
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (email, password, name) => {
    try {
      const localUser = await databaseService.createUser(email, name, password)
      setUser(localUser)
      setLocalUserId(localUser.id.toString())
      localStorage.setItem('clearmind_local_user_id', localUser.id.toString())
      return localUser
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = () => {
    setUser(null)
    setLocalUserId(null)
    localStorage.removeItem('clearmind_local_user_id')
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
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
