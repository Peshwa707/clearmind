import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Square, Tag, Heart, Clock, Pause, Play } from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { API_ENDPOINTS, apiRequest } from '../services/api'

// Theme colors
const THEME_COLORS = {
  work: '#5B8FB9',
  relationships: '#E8B4B8',
  family: '#7AB8A8',
  health: '#98D8AA',
  finance: '#F7D060',
  social: '#B4A7D6',
  future: '#87CEEB',
  self: '#DDA0DD',
  past: '#D3D3D3',
  general: '#C0C0C0',
  other: '#A9A9A9'
}

// Emotion colors
const EMOTION_COLORS = {
  anxious: '#E8B4B8',
  overwhelmed: '#F7D060',
  sad: '#87CEEB',
  angry: '#FF6B6B',
  frustrated: '#FFA07A',
  confused: '#B4A7D6',
  hopeful: '#98D8AA',
  relieved: '#7AB8A8',
  neutral: '#C0C0C0'
}

/**
 * Ambient listening mode - continuous voice capture with real-time categorization
 */
export default function AmbientMode({ onEnd, onSave }) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [thoughts, setThoughts] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [themeCounts, setThemeCounts] = useState({})
  const [emotionCounts, setEmotionCounts] = useState({})

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useVoiceInput()

  const timerRef = useRef(null)
  const lastProcessedRef = useRef('')
  const thoughtsEndRef = useRef(null)

  // Auto-scroll to latest thought
  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thoughts])

  // Timer for session duration
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isActive, isPaused])

  // Process transcript when we have enough text
  useEffect(() => {
    const fullTranscript = transcript + ' ' + interimTranscript
    setCurrentTranscript(fullTranscript.trim())

    // Check if we have new content to process (at least 20 chars of new content)
    const newContent = fullTranscript.replace(lastProcessedRef.current, '').trim()

    if (newContent.length >= 30 && !newContent.endsWith('...')) {
      processThought(newContent)
      lastProcessedRef.current = fullTranscript
    }
  }, [transcript, interimTranscript])

  const processThought = async (text) => {
    if (text.length < 10) return

    try {
      const result = await apiRequest(API_ENDPOINTS.chatCategorize, {
        method: 'POST',
        body: JSON.stringify({ thought: text })
      })

      const newThought = {
        id: Date.now(),
        text: text,
        themes: result.themes || ['general'],
        emotions: result.emotions || ['neutral'],
        keyPhrase: result.key_phrase || text.substring(0, 50),
        timestamp: new Date().toISOString()
      }

      setThoughts(prev => [...prev, newThought])

      // Update counts
      result.themes?.forEach(theme => {
        setThemeCounts(prev => ({
          ...prev,
          [theme]: (prev[theme] || 0) + 1
        }))
      })

      result.emotions?.forEach(emotion => {
        setEmotionCounts(prev => ({
          ...prev,
          [emotion]: (prev[emotion] || 0) + 1
        }))
      })

    } catch (error) {
      console.error('Categorization error:', error)
      // Still add the thought without categorization
      setThoughts(prev => [...prev, {
        id: Date.now(),
        text: text,
        themes: ['general'],
        emotions: ['neutral'],
        keyPhrase: text.substring(0, 50),
        timestamp: new Date().toISOString()
      }])
    }
  }

  const handleStart = useCallback(() => {
    setIsActive(true)
    setIsPaused(false)
    startListening()
  }, [startListening])

  const handlePause = useCallback(() => {
    setIsPaused(true)
    stopListening()
  }, [stopListening])

  const handleResume = useCallback(() => {
    setIsPaused(false)
    startListening()
  }, [startListening])

  const handleStop = useCallback(() => {
    stopListening()
    setIsActive(false)

    // Process any remaining transcript
    if (currentTranscript.length > 10) {
      const remaining = currentTranscript.replace(lastProcessedRef.current, '').trim()
      if (remaining.length > 10) {
        processThought(remaining)
      }
    }
  }, [stopListening, currentTranscript])

  const handleSaveAndEnd = useCallback(() => {
    handleStop()

    const sessionData = {
      id: `ambient_${Date.now()}`,
      type: 'ambient',
      started_at: new Date(Date.now() - duration * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration: duration,
      thoughts: thoughts,
      themes: Object.keys(themeCounts),
      emotions: Object.keys(emotionCounts),
      theme_counts: themeCounts,
      emotion_counts: emotionCounts,
      summary: `${thoughts.length} thoughts captured in ${formatDuration(duration)}`
    }

    onSave?.(sessionData)
    onEnd?.()
  }, [handleStop, duration, thoughts, themeCounts, emotionCounts, onSave, onEnd])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <div className="ambient-mode">
        <div className="ambient-unsupported">
          <MicOff size={48} />
          <h3>Voice input not supported</h3>
          <p>Your browser or device doesn't support voice recognition.</p>
          <button className="btn btn-secondary" onClick={onEnd}>
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ambient-mode">
      <div className="ambient-header">
        <div className="ambient-status">
          <div className={`status-indicator ${isActive ? (isPaused ? 'paused' : 'active') : 'inactive'}`}>
            {isActive && !isPaused && <Mic size={20} />}
            {isPaused && <Pause size={20} />}
            {!isActive && <MicOff size={20} />}
          </div>
          <div className="status-text">
            <h2>Ambient Listening</h2>
            <span className="status-label">
              {!isActive ? 'Ready to start' : isPaused ? 'Paused' : 'Listening...'}
            </span>
          </div>
        </div>

        <div className="ambient-timer">
          <Clock size={16} />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Stats Bar */}
      {thoughts.length > 0 && (
        <div className="ambient-stats">
          <div className="stat-group">
            <Tag size={14} />
            <span>{Object.keys(themeCounts).length} themes</span>
          </div>
          <div className="stat-group">
            <Heart size={14} />
            <span>{Object.keys(emotionCounts).length} emotions</span>
          </div>
          <div className="stat-group">
            <span>{thoughts.length} thoughts</span>
          </div>
        </div>
      )}

      {/* Current Transcript */}
      {isActive && currentTranscript && (
        <div className="current-transcript">
          <div className="transcript-label">Currently hearing:</div>
          <p>{currentTranscript}</p>
        </div>
      )}

      {/* Categorized Thoughts */}
      <div className="thoughts-stream">
        {thoughts.length === 0 && !isActive && (
          <div className="empty-state">
            <Mic size={48} />
            <h3>Start talking</h3>
            <p>Press the button below and start speaking your thoughts. They'll be automatically categorized as you talk.</p>
          </div>
        )}

        {thoughts.map((thought) => (
          <div key={thought.id} className="thought-card">
            <div className="thought-tags">
              {thought.themes.map(theme => (
                <span
                  key={theme}
                  className="theme-badge"
                  style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.other }}
                >
                  {theme}
                </span>
              ))}
              {thought.emotions.map(emotion => (
                <span
                  key={emotion}
                  className="emotion-badge"
                  style={{ backgroundColor: EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral }}
                >
                  {emotion}
                </span>
              ))}
            </div>
            <p className="thought-text">{thought.keyPhrase}</p>
            <span className="thought-time">
              {new Date(thought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        <div ref={thoughtsEndRef} />
      </div>

      {/* Controls */}
      <div className="ambient-controls">
        {!isActive ? (
          <button className="btn btn-primary start-btn" onClick={handleStart}>
            <Mic size={20} />
            Start Listening
          </button>
        ) : (
          <>
            {isPaused ? (
              <button className="btn btn-primary resume-btn" onClick={handleResume}>
                <Play size={20} />
                Resume
              </button>
            ) : (
              <button className="btn btn-secondary pause-btn" onClick={handlePause}>
                <Pause size={20} />
                Pause
              </button>
            )}
            <button className="btn btn-accent stop-btn" onClick={handleSaveAndEnd}>
              <Square size={20} />
              Save & End
            </button>
          </>
        )}

        {!isActive && thoughts.length === 0 && (
          <button className="btn btn-outline back-btn" onClick={onEnd}>
            Back to Chat
          </button>
        )}
      </div>
    </div>
  )
}
