import { useEffect, useRef } from 'react'
import { MessageCircle, AlertCircle } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import SessionSummary from '../components/SessionSummary'
import { useChat } from '../hooks/useChat'
import { useChatSessions } from '../hooks/useLocalStorage'
import './Home.css'

export function Home() {
  const {
    messages,
    isLoading,
    sessionComplete,
    summary,
    error,
    hasMessages,
    sendMessage,
    endSession,
    startNewSession,
    getSessionData
  } = useChat()

  const { saveSession } = useChatSessions()
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveAndNew = () => {
    // Save the session
    const sessionData = getSessionData()
    saveSession(sessionData)

    // Start fresh
    startNewSession()
  }

  return (
    <div className="home-page chat-page">
      <div className="chat-header">
        <div className="chat-header-icon">
          <MessageCircle size={24} />
        </div>
        <div className="chat-header-text">
          <h1>Clear Your Mind</h1>
          <p>Talk through what's on your mind</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {isLoading && (
            <div className="chat-message bot">
              <div className="message-avatar bot-avatar">
                <MessageCircle size={18} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={sendMessage}
          onEndSession={endSession}
          disabled={sessionComplete}
          isLoading={isLoading}
          hasMessages={hasMessages}
        />
      </div>

      {sessionComplete && summary && (
        <SessionSummary
          summary={summary}
          onSaveAndNew={handleSaveAndNew}
        />
      )}
    </div>
  )
}

export default Home
