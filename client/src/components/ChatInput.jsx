import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Square, Loader } from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'

/**
 * Chat input with text and voice support
 */
export default function ChatInput({
  onSend,
  onEndSession,
  disabled = false,
  isLoading = false,
  hasMessages = false
}) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: voiceSupported,
    toggleListening,
    clearTranscript
  } = useVoiceInput()

  // Combine typed text with voice transcript
  useEffect(() => {
    if (transcript) {
      setText(prev => (prev + ' ' + transcript).trim())
      clearTranscript()
    }
  }, [transcript, clearTranscript])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const messageText = (text + ' ' + interimTranscript).trim()
    if (messageText && !disabled && !isLoading) {
      onSend(messageText)
      setText('')
      clearTranscript()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const displayText = text + (interimTranscript ? ' ' + interimTranscript : '')

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={displayText}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type what's on your mind..."}
            disabled={disabled || isLoading}
            rows={1}
            className={isListening ? 'listening' : ''}
          />

          {voiceSupported && (
            <button
              type="button"
              className={`voice-btn ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
              disabled={disabled || isLoading}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          <button
            type="submit"
            className="send-btn"
            disabled={!displayText.trim() || disabled || isLoading}
            title="Send message"
          >
            {isLoading ? <Loader size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>

      {hasMessages && (
        <button
          type="button"
          className="end-session-btn"
          onClick={onEndSession}
          disabled={disabled || isLoading}
        >
          <Square size={14} />
          End Session
        </button>
      )}
    </div>
  )
}
