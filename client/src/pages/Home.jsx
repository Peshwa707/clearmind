import { useState, useEffect } from 'react'
import { Brain, RefreshCw } from 'lucide-react'
import ThoughtInput from '../components/ThoughtInput'
import DistortionCard from '../components/DistortionCard'
import ReframeDisplay from '../components/ReframeDisplay'
import { ExerciseSuggestions } from '../components/ExerciseCard'
import { useThoughtHistory } from '../hooks/useLocalStorage'
import { API_ENDPOINTS } from '../services/api'
import './Home.css'

export function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const [exercises, setExercises] = useState([])
  const { addEntry } = useThoughtHistory()

  useEffect(() => {
    // Fetch exercises for suggestions
    fetch(API_ENDPOINTS.exercises())
      .then(res => res.json())
      .then(data => setExercises(data.exercises || []))
      .catch(err => console.error('Error fetching exercises:', err))
  }, [])

  const handleAnalyze = async (thought) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.analyze(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thought }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Analysis failed')
      }

      const result = await response.json()
      setAnalysisResult(result)

      // Save to local history
      addEntry({
        thought: result.original_thought,
        identified_distortions: result.identified_distortions,
        reframes: result.reframes,
      })
    } catch (err) {
      setError(err.message)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setError(null)
  }

  const handleStartExercise = (exercise) => {
    // For now, just scroll to exercises page
    // In a full implementation, this would open a modal or navigate
    window.location.href = `/exercises#${exercise.id}`
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-icon">
          <Brain size={48} />
        </div>
        <h1>Clear Your Mind</h1>
        <p>
          Share what's troubling you, and we'll help you identify unhelpful thinking
          patterns and discover healthier perspectives.
        </p>
      </div>

      {!analysisResult ? (
        <ThoughtInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      ) : (
        <div className="analysis-results">
          <div className="results-header">
            <h2>Your Thought Analysis</h2>
            <button onClick={handleReset} className="btn-new-thought">
              <RefreshCw size={18} />
              Analyze Another Thought
            </button>
          </div>

          <div className="original-thought">
            <h3>Your thought:</h3>
            <blockquote>{analysisResult.original_thought}</blockquote>
          </div>

          {analysisResult.identified_distortions?.length > 0 && (
            <div className="distortions-section">
              <h3>
                Thinking Patterns Identified
                <span className="count">
                  ({analysisResult.identified_distortions.length})
                </span>
              </h3>
              <div className="distortions-list">
                {analysisResult.identified_distortions.map((distortion, index) => (
                  <DistortionCard
                    key={distortion.id || index}
                    distortion={distortion}
                    isExpanded={index === 0}
                  />
                ))}
              </div>
            </div>
          )}

          <ReframeDisplay
            reframes={analysisResult.reframes}
            compassionateResponse={analysisResult.compassionate_response}
          />

          <ExerciseSuggestions
            exerciseIds={analysisResult.suggested_exercises}
            exercises={exercises}
            onStart={handleStartExercise}
          />

          {analysisResult.analysis_method === 'rule_based' && (
            <div className="method-notice">
              Analysis performed using pattern matching. For more detailed insights,
              configure your API key.
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Something went wrong: {error}</p>
          <button onClick={handleReset} className="btn btn-outline">
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
