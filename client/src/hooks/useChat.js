import { useState, useCallback } from 'react'
import { API_ENDPOINTS, apiRequest } from '../services/api'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm here to help you work through what's on your mind. What's been weighing on you lately?",
  timestamp: new Date().toISOString()
}

/**
 * Custom hook for managing chat state and interactions
 */
export function useChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [sessionMetadata, setSessionMetadata] = useState({
    themes: [],
    emotions: []
  })

  /**
   * Send a message to the chat bot
   */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading || sessionComplete) return

    const userMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Build conversation history (excluding welcome message for API)
      const historyForApi = messages
        .filter(m => m !== WELCOME_MESSAGE)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await apiRequest(API_ENDPOINTS.chat, {
        method: 'POST',
        body: JSON.stringify({
          message: text.trim(),
          conversation_history: historyForApi
        })
      })

      const botMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, botMessage])

      // Update metadata
      if (response.metadata) {
        setSessionMetadata(prev => ({
          themes: [...new Set([...prev.themes, ...(response.metadata.themes || [])])],
          emotions: [...new Set([...prev.emotions, ...(response.metadata.detected_emotions || [])])]
        }))
      }

    } catch (err) {
      console.error('Chat error:', err)
      if (err.message === 'offline') {
        setError('You appear to be offline. Please check your connection.')
      } else {
        setError('Failed to get response. Please try again.')
      }
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, sessionComplete])

  /**
   * End the session and get a summary
   */
  const endSession = useCallback(async () => {
    if (messages.length <= 1 || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const historyForApi = messages
        .filter(m => m !== WELCOME_MESSAGE)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await apiRequest(API_ENDPOINTS.chatSummarize, {
        method: 'POST',
        body: JSON.stringify({
          conversation_history: historyForApi
        })
      })

      setSummary(response)
      setSessionComplete(true)

    } catch (err) {
      console.error('Summary error:', err)
      if (err.message === 'offline') {
        // Create offline summary
        setSummary({
          summary: 'Session completed offline.',
          themes: sessionMetadata.themes.length > 0 ? sessionMetadata.themes : ['general'],
          emotions: sessionMetadata.emotions.length > 0 ? sessionMetadata.emotions : ['processing'],
          action_items: ['Review this session when back online']
        })
        setSessionComplete(true)
      } else {
        setError('Failed to generate summary. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, sessionMetadata])

  /**
   * Start a new session (clears everything)
   */
  const startNewSession = useCallback(() => {
    setMessages([{
      ...WELCOME_MESSAGE,
      timestamp: new Date().toISOString()
    }])
    setSummary(null)
    setSessionComplete(false)
    setSessionMetadata({ themes: [], emotions: [] })
    setError(null)
  }, [])

  /**
   * Get the current session data for saving
   */
  const getSessionData = useCallback(() => {
    return {
      id: `session_${Date.now()}`,
      started_at: messages[0]?.timestamp,
      ended_at: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      themes: summary?.themes || sessionMetadata.themes,
      emotions: summary?.emotions || sessionMetadata.emotions,
      action_items: summary?.action_items || [],
      summary: summary?.summary || ''
    }
  }, [messages, summary, sessionMetadata])

  return {
    messages,
    isLoading,
    sessionComplete,
    summary,
    error,
    sessionMetadata,
    sendMessage,
    endSession,
    startNewSession,
    getSessionData,
    hasMessages: messages.length > 1 // More than just welcome message
  }
}

export default useChat
