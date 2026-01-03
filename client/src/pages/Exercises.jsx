import { useState, useEffect } from 'react'
import { Search, Filter, Clock, ChevronRight, X } from 'lucide-react'
import ExerciseCard from '../components/ExerciseCard'
import './Exercises.css'

export function Exercises() {
  const [exercises, setExercises] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeExercise, setActiveExercise] = useState(null)

  useEffect(() => {
    fetchExercises()
  }, [selectedCategory])

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const url = selectedCategory
        ? `/api/exercises?category=${selectedCategory}`
        : '/api/exercises'
      const response = await fetch(url)
      const data = await response.json()
      setExercises(data.exercises || [])
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Error fetching exercises:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredExercises = exercises.filter(exercise => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      exercise.name.toLowerCase().includes(query) ||
      exercise.description.toLowerCase().includes(query)
    )
  })

  const handleStartExercise = (exercise) => {
    setActiveExercise(exercise)
  }

  const handleCloseExercise = () => {
    setActiveExercise(null)
  }

  return (
    <div className="exercises-page">
      <div className="exercises-header">
        <h1>CBT Exercise Library</h1>
        <p>Evidence-based exercises to help you develop healthier thinking patterns</p>
      </div>

      <div className="exercises-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading exercises...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="empty-state">
          <p>No exercises found matching your criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="exercises-grid">
          {filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onStart={handleStartExercise}
            />
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {activeExercise && (
        <div className="exercise-modal-overlay" onClick={handleCloseExercise}>
          <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseExercise}>
              <X size={24} />
            </button>

            <div className="modal-header">
              <h2>{activeExercise.name}</h2>
              <div className="modal-meta">
                <span className="duration">
                  <Clock size={16} />
                  {activeExercise.duration_minutes} minutes
                </span>
              </div>
            </div>

            <p className="modal-description">{activeExercise.description}</p>

            <div className="modal-steps">
              <h3>Steps to Follow</h3>
              <ol>
                {activeExercise.steps?.map((step, index) => (
                  <li key={index}>
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {activeExercise.tips && (
              <div className="modal-tips">
                <strong>Tip:</strong> {activeExercise.tips}
              </div>
            )}

            <button className="btn-complete" onClick={handleCloseExercise}>
              Mark as Complete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Exercises
