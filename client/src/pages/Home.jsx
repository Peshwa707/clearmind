import { useState, useEffect, useRef } from 'react'
import { MessageCircle, AlertCircle, Mic, MessageSquare } from 'lucide-react'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import SessionSummary from '../components/SessionSummary'
import AmbientMode from '../components/AmbientMode'
import { useChat } from '../hooks/useChat'
import { useChatSessions } from '../hooks/useLocalStorage'
import './Home.css'

export function Home() {
  const [mode, setMode] = useState('chat') // 'chat' or 'ambient'

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
    const sessionData = getSessionData()
    saveSession(sessionData)
    startNewSession()
  }

  const handleAmbientSave = (sessionData) => {
    saveSession(sessionData)
  }

  const handleAmbientEnd = () => {
    setMode('chat')
  }

  // Ambient Mode
  if (mode === 'ambient') {
    return (
      <div className="home-page">
        <AmbientMode
          onEnd={handleAmbientEnd}
          onSave={handleAmbientSave}
        />
      </div>
    )
  }

  // Chat Mode
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

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
          onClick={() => setMode('chat')}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          className={`mode-btn ${mode === 'ambient' ? 'active' : ''}`}
          onClick={() => setMode('ambient')}
        >
          <Mic size={16} />
          Ambient
        </button>
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
