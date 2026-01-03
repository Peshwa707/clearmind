import { useState } from 'react'
import { BarChart2, Calendar, TrendingUp, Trash2, LogIn, UserPlus } from 'lucide-react'
import { useThoughtHistory } from '../hooks/useLocalStorage'
import { useAuth } from '../context/AuthContext'
import './Progress.css'

export function Progress() {
  const { history, clearHistory, getRecentDistortions, totalEntries } = useThoughtHistory()
  const { isAuthenticated, login, register, user } = useAuth()
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const recentDistortions = getRecentDistortions()

  const distortionNames = {
    all_or_nothing: 'All-or-Nothing',
    overgeneralization: 'Overgeneralization',
    mental_filter: 'Mental Filtering',
    disqualifying_positive: 'Disqualifying Positive',
    jumping_to_conclusions: 'Jumping to Conclusions',
    magnification: 'Magnification',
    emotional_reasoning: 'Emotional Reasoning',
    should_statements: 'Should Statements',
    labeling: 'Labeling',
    personalization: 'Personalization'
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    const name = formData.get('name')

    try {
      if (authMode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      setShowAuthForm(false)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Your Progress</h1>
        <p>Track your thought patterns and see how you're growing</p>
      </div>

      {!isAuthenticated && (
        <div className="auth-prompt">
          <div className="auth-prompt-content">
            <h3>Save Your Progress</h3>
            <p>
              Create an account to keep your history across devices and track your
              long-term progress.
            </p>
            <div className="auth-buttons">
              <button
                className="btn btn-primary"
                onClick={() => { setShowAuthForm(true); setAuthMode('register'); }}
              >
                <UserPlus size={18} />
                Create Account
              </button>
              <button
                className="btn btn-outline"
                onClick={() => { setShowAuthForm(true); setAuthMode('login'); }}
              >
                <LogIn size={18} />
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalEntries}</span>
            <span className="stat-label">Thoughts Analyzed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{recentDistortions.length}</span>
            <span className="stat-label">Patterns Identified</span>
          </div>
        </div>
      </div>

      {recentDistortions.length > 0 && (
        <div className="patterns-section">
          <h2>Most Common Patterns</h2>
          <p className="section-desc">
            Understanding your most frequent thinking patterns can help you
            recognize them more easily.
          </p>
          <div className="patterns-list">
            {recentDistortions.slice(0, 5).map(({ id, count }) => (
              <div key={id} className="pattern-item">
                <span className="pattern-name">
                  {distortionNames[id] || id}
                </span>
                <div className="pattern-bar-container">
                  <div
                    className="pattern-bar"
                    style={{
                      width: `${(count / recentDistortions[0].count) * 100}%`
                    }}
                  />
                </div>
                <span className="pattern-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h2>Recent History</h2>
            <button
              className="btn-clear"
              onClick={() => {
                if (confirm('Clear all history? This cannot be undone.')) {
                  clearHistory()
                }
              }}
            >
              <Trash2 size={16} />
              Clear History
            </button>
          </div>

          <div className="history-list">
            {history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="history-item">
                <div className="history-date">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
                <p className="history-thought">{entry.thought}</p>
                {entry.identified_distortions?.length > 0 && (
                  <div className="history-tags">
                    {entry.identified_distortions.map((d, i) => (
                      <span key={i} className="distortion-tag">
                        {d.name || distortionNames[d.id] || d.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="empty-history">
          <BarChart2 size={48} />
          <h3>No history yet</h3>
          <p>
            Start analyzing your thoughts to see your progress and patterns here.
          </p>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthForm && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthForm(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h2>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label htmlFor="name">Name (optional)</label>
                  <input type="text" id="name" name="name" placeholder="Your name" />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>

              {authError && <p className="auth-error">{authError}</p>}

              <button type="submit" className="btn btn-primary" disabled={authLoading}>
                {authLoading ? 'Loading...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setAuthMode('register')}>Sign up</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')}>Sign in</button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
