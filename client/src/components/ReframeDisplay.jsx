import { Sparkles, Heart, ArrowRight } from 'lucide-react'
import './ReframeDisplay.css'

export function ReframeDisplay({ reframes, compassionateResponse }) {
  if (!reframes?.length && !compassionateResponse) {
    return null
  }

  return (
    <div className="reframe-display">
      {compassionateResponse && (
        <div className="compassionate-message">
          <div className="message-icon">
            <Heart size={24} />
          </div>
          <p>{compassionateResponse}</p>
        </div>
      )}

      {reframes?.length > 0 && (
        <div className="reframes-section">
          <h3 className="reframes-title">
            <Sparkles size={20} />
            Healthier Perspectives
          </h3>

          <div className="reframes-list">
            {reframes.map((reframe, index) => (
              <div key={index} className="reframe-card">
                <div className="reframe-number">{index + 1}</div>
                <div className="reframe-content">
                  <p className="reframe-perspective">{reframe.perspective}</p>
                  {reframe.explanation && (
                    <p className="reframe-explanation">
                      <ArrowRight size={14} />
                      {reframe.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReframeDisplay
