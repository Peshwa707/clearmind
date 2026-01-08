import { CheckCircle, Tag, Heart, ListChecks, MessageCircle, RotateCcw } from 'lucide-react'

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

// Emotion icons/colors
const EMOTION_STYLES = {
  anxious: { color: '#E8B4B8', label: 'Anxious' },
  overwhelmed: { color: '#F7D060', label: 'Overwhelmed' },
  sad: { color: '#87CEEB', label: 'Sad' },
  angry: { color: '#FF6B6B', label: 'Angry' },
  frustrated: { color: '#FFA07A', label: 'Frustrated' },
  confused: { color: '#B4A7D6', label: 'Confused' },
  hopeful: { color: '#98D8AA', label: 'Hopeful' },
  relieved: { color: '#7AB8A8', label: 'Relieved' },
  processing: { color: '#C0C0C0', label: 'Processing' },
  other: { color: '#A9A9A9', label: 'Other' }
}

/**
 * Session summary card displayed when session ends
 */
export default function SessionSummary({ summary, onSaveAndNew, onViewConversation }) {
  if (!summary) return null

  const themes = summary.themes || ['general']
  const emotions = summary.emotions || ['processing']
  const actionItems = summary.action_items || []

  return (
    <div className="session-summary-overlay">
      <div className="session-summary-card">
        <div className="summary-header">
          <CheckCircle size={24} className="success-icon" />
          <h2>Session Complete</h2>
        </div>

        {summary.summary && (
          <p className="summary-text">{summary.summary}</p>
        )}

        <div className="summary-section">
          <div className="section-label">
            <Tag size={16} />
            <span>Themes</span>
          </div>
          <div className="tags-container">
            {themes.map((theme, idx) => (
              <span
                key={idx}
                className="theme-tag"
                style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.other }}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </span>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <div className="section-label">
            <Heart size={16} />
            <span>Emotions</span>
          </div>
          <div className="tags-container">
            {emotions.map((emotion, idx) => {
              const style = EMOTION_STYLES[emotion] || EMOTION_STYLES.other
              return (
                <span
                  key={idx}
                  className="emotion-tag"
                  style={{ backgroundColor: style.color }}
                >
                  {style.label}
                </span>
              )
            })}
          </div>
        </div>

        {actionItems.length > 0 && (
          <div className="summary-section">
            <div className="section-label">
              <ListChecks size={16} />
              <span>Action Items</span>
            </div>
            <ul className="action-items">
              {actionItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="summary-actions">
          <button
            className="btn btn-primary save-new-btn"
            onClick={onSaveAndNew}
          >
            <RotateCcw size={18} />
            Save & Start New Chat
          </button>

          {onViewConversation && (
            <button
              className="btn btn-secondary view-btn"
              onClick={onViewConversation}
            >
              <MessageCircle size={18} />
              View Conversation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
