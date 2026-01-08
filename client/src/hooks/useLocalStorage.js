import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import databaseService from '../services/database'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook for persisting state in localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if nothing in storage
 * @returns {[any, Function]} - State value and setter
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage whenever value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

/**
 * Hook for managing thought history with SQLite on mobile, localStorage on web
 */
export function useThoughtHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, dbReady } = useAuth()
  const isNative = Capacitor.getPlatform() !== 'web'

  // Load history on mount and when user changes
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      try {
        if (user && dbReady) {
          const thoughts = await databaseService.getThoughts(user.id)
          setHistory(thoughts.map(t => ({
            id: t.id,
            timestamp: t.createdAt,
            thought: t.thought,
            identified_distortions: t.distortions,
            reframes: t.reframes,
            synced: t.synced
          })))
        } else if (!isNative) {
          // Web fallback - use localStorage
          const stored = localStorage.getItem('clearmind_history')
          setHistory(stored ? JSON.parse(stored) : [])
        } else {
          setHistory([])
        }
      } catch (error) {
        console.error('Error loading history:', error)
        // Fallback to localStorage
        const stored = localStorage.getItem('clearmind_history')
        setHistory(stored ? JSON.parse(stored) : [])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user, dbReady, isNative])

  const addEntry = useCallback(async (entry) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    }

    try {
      if (user && dbReady) {
        // Save to SQLite
        const saved = await databaseService.saveThought(
          user.id,
          entry.thought,
          entry.identified_distortions || [],
          entry.reframes || []
        )
        newEntry.id = saved.id
        newEntry.timestamp = saved.createdAt
      }
    } catch (error) {
      console.error('Error saving to database:', error)
    }

    // Update local state
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 100)
      // Also save to localStorage as backup
      if (!isNative) {
        localStorage.setItem('clearmind_history', JSON.stringify(updated))
      }
      return updated
    })

    return newEntry
  }, [user, dbReady, isNative])

  const removeEntry = useCallback(async (id) => {
    try {
      if (user && dbReady) {
        await databaseService.deleteThought(id, user.id)
      }
    } catch (error) {
      console.error('Error deleting from database:', error)
    }

    setHistory(prev => {
      const updated = prev.filter(entry => entry.id !== id)
      if (!isNative) {
        localStorage.setItem('clearmind_history', JSON.stringify(updated))
      }
      return updated
    })
  }, [user, dbReady, isNative])

  const clearHistory = useCallback(async () => {
    // Note: This only clears local state, not the database
    setHistory([])
    if (!isNative) {
      localStorage.setItem('clearmind_history', JSON.stringify([]))
    }
  }, [isNative])

  const getRecentDistortions = useCallback(() => {
    const distortionCounts = {}
    history.forEach(entry => {
      (entry.identified_distortions || []).forEach(d => {
        const id = d.id || d.name || d
        distortionCounts[id] = (distortionCounts[id] || 0) + 1
      })
    })
    return Object.entries(distortionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }))
  }, [history])

  // Get analytics/stats
  const getStats = useCallback(async () => {
    if (user && dbReady) {
      return await databaseService.getDistortionStats(user.id)
    }
    return getRecentDistortions()
  }, [user, dbReady, getRecentDistortions])

  return {
    history,
    loading,
    addEntry,
    removeEntry,
    clearHistory,
    getRecentDistortions,
    getStats,
    totalEntries: history.length
  }
}

/**
 * Hook for managing completed exercises
 */
export function useExerciseProgress() {
  const [completed, setCompleted] = useState([])
  const { user, dbReady } = useAuth()
  const isNative = Capacitor.getPlatform() !== 'web'

  useEffect(() => {
    const loadCompleted = async () => {
      try {
        if (user && dbReady) {
          const exercises = await databaseService.getCompletedExercises(user.id)
          setCompleted(exercises)
        } else if (!isNative) {
          const stored = localStorage.getItem('clearmind_exercises_completed')
          setCompleted(stored ? JSON.parse(stored) : [])
        }
      } catch (error) {
        console.error('Error loading completed exercises:', error)
      }
    }

    loadCompleted()
  }, [user, dbReady, isNative])

  const markComplete = useCallback(async (exerciseId) => {
    const entry = {
      id: Date.now(),
      exerciseId,
      completedAt: new Date().toISOString()
    }

    try {
      if (user && dbReady) {
        const saved = await databaseService.completeExercise(user.id, exerciseId)
        entry.id = saved.id
      }
    } catch (error) {
      console.error('Error saving exercise completion:', error)
    }

    setCompleted(prev => {
      const updated = [entry, ...prev]
      if (!isNative) {
        localStorage.setItem('clearmind_exercises_completed', JSON.stringify(updated))
      }
      return updated
    })

    return entry
  }, [user, dbReady, isNative])

  const isCompleted = useCallback((exerciseId) => {
    return completed.some(e => e.exerciseId === exerciseId)
  }, [completed])

  const getCompletionCount = useCallback((exerciseId) => {
    return completed.filter(e => e.exerciseId === exerciseId).length
  }, [completed])

  return {
    completed,
    markComplete,
    isCompleted,
    getCompletionCount,
    totalCompleted: completed.length
  }
}

export default useLocalStorage
