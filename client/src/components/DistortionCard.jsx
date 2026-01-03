import { AlertTriangle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import './DistortionCard.css'

const distortionColors = {
  all_or_nothing: '#E57373',
  overgeneralization: '#F06292',
  mental_filter: '#BA68C8',
  disqualifying_positive: '#9575CD',
  jumping_to_conclusions: '#7986CB',
  magnification: '#64B5F6',
  emotional_reasoning: '#4FC3F7',
  should_statements: '#4DB6AC',
  labeling: '#81C784',
  personalization: '#AED581'
}

export function DistortionCard({ distortion, isExpanded: defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const color = distortionColors[distortion.id] || '#7FB3D5'
  const confidence = Math.round((distortion.confidence || 0.7) * 100)

  return (
    <div
      className="distortion-card"
      style={{ '--distortion-color': color }}
    >
      <button
        className="distortion-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="distortion-icon">
          <AlertTriangle size={20} />
        </div>

        <div className="distortion-info">
          <h3 className="distortion-name">{distortion.name}</h3>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidence}%` }}
            />
            <span className="confidence-label">{confidence}% match</span>
          </div>
        </div>

        <div className="expand-icon">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="distortion-details">
          <p className="distortion-description">
            {distortion.description}
          </p>

          {distortion.specific_explanation && (
            <div className="specific-explanation">
              <Lightbulb size={16} />
              <p>{distortion.specific_explanation}</p>
            </div>
          )}

          {distortion.examples && distortion.examples.length > 0 && (
            <div className="examples-section">
              <h4>Common examples:</h4>
              <ul>
                {distortion.examples.map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="reframe-prompt">
            <strong>Try this:</strong> {distortion.reframe_prompt}
          </div>
        </div>
      )}
    </div>
  )
}

export default DistortionCard
