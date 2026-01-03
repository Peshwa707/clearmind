import { useState, useEffect } from 'react'

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
 * Hook for managing thought history in localStorage
 */
export function useThoughtHistory() {
  const [history, setHistory] = useLocalStorage('clearmind_history', [])

  const addEntry = (entry) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    }
    setHistory(prev => [newEntry, ...prev].slice(0, 100)) // Keep last 100 entries
    return newEntry
  }

  const removeEntry = (id) => {
    setHistory(prev => prev.filter(entry => entry.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const getRecentDistortions = () => {
    const distortionCounts = {}
    history.forEach(entry => {
      (entry.identified_distortions || []).forEach(d => {
        distortionCounts[d.id] = (distortionCounts[d.id] || 0) + 1
      })
    })
    return Object.entries(distortionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }))
  }

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
    getRecentDistortions,
    totalEntries: history.length
  }
}

export default useLocalStorage
