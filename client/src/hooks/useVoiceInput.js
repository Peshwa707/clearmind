import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for speech-to-text using Web Speech API
 * @returns {Object} Voice input state and controls
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript + ' '
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          setTranscript(prev => prev + final)
        }
        setInterimTranscript(interim)
      }

      recognition.onerror = (event) => {
        setError(event.error)
        setIsListening(false)

        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please enable microphone permissions.')
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
      }
    } else {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser.')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null)
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Already started
        console.warn('Recognition already started')
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: transcript + interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    setTranscript
  }
}

export default useVoiceInput
