import { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

/**
 * Custom hook for speech-to-text
 * Uses Capacitor plugin on native, Web Speech API on web
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  const recognitionRef = useRef(null)
  const isNative = Capacitor.getPlatform() !== 'web'

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (isNative) {
        // Check if speech recognition is available on native
        try {
          const available = await SpeechRecognition.available()
          setIsSupported(available.available)

          if (available.available) {
            // Check/request permission
            const permStatus = await SpeechRecognition.checkPermissions()
            if (permStatus.speechRecognition === 'granted') {
              setHasPermission(true)
            } else if (permStatus.speechRecognition !== 'denied') {
              const reqStatus = await SpeechRecognition.requestPermissions()
              setHasPermission(reqStatus.speechRecognition === 'granted')
            }
          }
        } catch (e) {
          console.error('Speech recognition init error:', e)
          setIsSupported(false)
        }
      } else {
        // Web Speech API
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognitionAPI) {
          setIsSupported(true)
          setHasPermission(true) // Browser handles permissions
          recognitionRef.current = new SpeechRecognitionAPI()

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
              setHasPermission(false)
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
      }
    }

    init()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (isNative) {
        SpeechRecognition.stop().catch(() => {})
      }
    }
  }, [isNative])

  const startListening = useCallback(async () => {
    if (isListening) return

    setError(null)

    if (isNative) {
      try {
        // Request permission if needed
        if (!hasPermission) {
          const reqStatus = await SpeechRecognition.requestPermissions()
          if (reqStatus.speechRecognition !== 'granted') {
            setError('Microphone permission denied')
            return
          }
          setHasPermission(true)
        }

        setIsListening(true)

        // Start listening with partial results
        SpeechRecognition.start({
          language: 'en-US',
          maxResults: 5,
          partialResults: true,
          popup: false,
        })

        // Listen for results
        SpeechRecognition.addListener('partialResults', (data) => {
          if (data.matches && data.matches.length > 0) {
            setInterimTranscript(data.matches[0])
          }
        })

      } catch (e) {
        console.error('Start listening error:', e)
        setError('Failed to start voice input')
        setIsListening(false)
      }
    } else {
      // Web Speech API
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          console.warn('Recognition already started')
        }
      }
    }
  }, [isListening, isNative, hasPermission])

  const stopListening = useCallback(async () => {
    if (!isListening) return

    if (isNative) {
      try {
        const result = await SpeechRecognition.stop()

        // Get final result
        if (result.matches && result.matches.length > 0) {
          setTranscript(prev => prev + result.matches[0] + ' ')
        }

        setInterimTranscript('')
        setIsListening(false)

        // Remove listeners
        SpeechRecognition.removeAllListeners()
      } catch (e) {
        console.error('Stop listening error:', e)
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }

    setIsListening(false)
  }, [isListening, isNative])

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

  const requestPermission = useCallback(async () => {
    if (isNative) {
      try {
        const reqStatus = await SpeechRecognition.requestPermissions()
        const granted = reqStatus.speechRecognition === 'granted'
        setHasPermission(granted)
        if (!granted) {
          setError('Microphone permission denied. Please enable it in app settings.')
        }
        return granted
      } catch (e) {
        setError('Failed to request permission')
        return false
      }
    }
    return true
  }, [isNative])

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: transcript + interimTranscript,
    error,
    isSupported,
    hasPermission,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    setTranscript,
    requestPermission
  }
}

export default useVoiceInput
