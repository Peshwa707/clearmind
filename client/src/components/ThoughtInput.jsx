import { useState } from 'react'
import { Mic, MicOff, Send, Loader2 } from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './ThoughtInput.css'

export function ThoughtInput({ onAnalyze, isAnalyzing }) {
  const [thought, setThought] = useState('')
  const {
    isListening,
    fullTranscript,
    error: voiceError,
    isSupported: voiceSupported,
    toggleListening,
    clearTranscript,
    setTranscript
  } = useVoiceInput()

  // Combine typed text with voice transcript
  const combinedText = thought + (fullTranscript ? (thought ? ' ' : '') + fullTranscript : '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (combinedText.trim().length >= 10 && !isAnalyzing) {
      onAnalyze(combinedText.trim())
      setThought('')
      clearTranscript()
    }
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      // When stopping, merge transcript into thought
      if (fullTranscript) {
        setThought(prev => prev + (prev ? ' ' : '') + fullTranscript)
        clearTranscript()
      }
    }
    toggleListening()
  }

  const handleTextChange = (e) => {
    setThought(e.target.value)
    // Clear any pending transcript when user types
    if (fullTranscript) {
      setThought(prev => prev + (prev ? ' ' : '') + fullTranscript)
      clearTranscript()
    }
  }

  const charCount = combinedText.length
  const isValid = charCount >= 10 && charCount <= 2000

  return (
    <div className="thought-input-container">
      <form onSubmit={handleSubmit} className="thought-form">
        <div className="input-header">
          <label htmlFor="thought-input" className="input-label">
            What's on your mind?
          </label>
          <span className="input-hint">
            Share a thought or feeling you'd like to explore
          </span>
        </div>

        <div className="textarea-wrapper">
          <textarea
            id="thought-input"
            value={combinedText}
            onChange={handleTextChange}
            placeholder="I feel like... / I can't stop thinking about... / I'm worried that..."
            rows={5}
            disabled={isAnalyzing}
            className={`thought-textarea ${isListening ? 'listening' : ''}`}
          />

          {isListening && (
            <div className="listening-indicator">
              <span className="pulse-dot"></span>
              Listening...
            </div>
          )}
        </div>

        <div className="input-footer">
          <div className="char-count">
            <span className={charCount < 10 ? 'warning' : charCount > 2000 ? 'error' : ''}>
              {charCount}
            </span>
            <span className="char-limit"> / 2000</span>
            {charCount < 10 && charCount > 0 && (
              <span className="min-hint"> (minimum 10 characters)</span>
            )}
          </div>

          <div className="input-actions">
            {voiceSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`btn-voice ${isListening ? 'active' : ''}`}
                disabled={isAnalyzing}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? 'Stop' : 'Voice'}
              </button>
            )}

            <button
              type="submit"
              disabled={!isValid || isAnalyzing}
              className="btn-analyze"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Analyze Thought
                </>
              )}
            </button>
          </div>
        </div>

        {voiceError && (
          <div className="voice-error">
            {voiceError}
          </div>
        )}
      </form>
    </div>
  )
}

export default ThoughtInput
