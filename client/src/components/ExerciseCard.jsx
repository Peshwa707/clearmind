import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
import './ExerciseCard.css'

export function ExerciseCard({ exercise, onStart, compact = false }) {
  const categoryLabels = {
    cognitive_restructuring: 'Cognitive',
    mindfulness: 'Mindfulness',
    behavioral_activation: 'Behavioral',
    positive_psychology: 'Positive',
    self_compassion: 'Self-Care'
  }

  const categoryColors = {
    cognitive_restructuring: '#5B8FB9',
    mindfulness: '#7AB8A8',
    behavioral_activation: '#E8B4B8',
    positive_psychology: '#F6AD55',
    self_compassion: '#BA68C8'
  }

  const color = categoryColors[exercise.category] || '#5B8FB9'

  if (compact) {
    return (
      <button
        className="exercise-card-compact"
        onClick={() => onStart?.(exercise)}
        style={{ '--exercise-color': color }}
      >
        <span className="exercise-name-compact">{exercise.name}</span>
        <span className="exercise-duration-compact">
          <Clock size={14} />
          {exercise.duration_minutes}m
        </span>
        <ChevronRight size={18} className="exercise-arrow" />
      </button>
    )
  }

  return (
    <div className="exercise-card" style={{ '--exercise-color': color }}>
      <div className="exercise-header">
        <span className="exercise-category">
          {categoryLabels[exercise.category] || exercise.category}
        </span>
        <span className="exercise-duration">
          <Clock size={14} />
          {exercise.duration_minutes} min
        </span>
      </div>

      <h3 className="exercise-name">{exercise.name}</h3>
      <p className="exercise-description">{exercise.description}</p>

      {exercise.steps && (
        <div className="exercise-steps">
          <h4>Steps:</h4>
          <ol>
            {exercise.steps.slice(0, 3).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
            {exercise.steps.length > 3 && (
              <li className="more-steps">+ {exercise.steps.length - 3} more steps</li>
            )}
          </ol>
        </div>
      )}

      {exercise.tips && (
        <p className="exercise-tip">
          <strong>Tip:</strong> {exercise.tips}
        </p>
      )}

      <button
        className="exercise-start-btn"
        onClick={() => onStart?.(exercise)}
      >
        Start Exercise
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

export function ExerciseSuggestions({ exerciseIds, exercises, onStart }) {
  if (!exerciseIds?.length || !exercises) {
    return null
  }

  const suggestedExercises = exerciseIds
    .map(id => exercises.find(e => e.id === id))
    .filter(Boolean)

  if (!suggestedExercises.length) {
    return null
  }

  return (
    <div className="exercise-suggestions">
      <h3 className="suggestions-title">
        <CheckCircle2 size={20} />
        Recommended Exercises
      </h3>
      <div className="suggestions-list">
        {suggestedExercises.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onStart={onStart}
            compact
          />
        ))}
      </div>
    </div>
  )
}

export default ExerciseCard
