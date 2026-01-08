import { useState } from 'react'
import {
  ArrowLeft, Edit3, Trash2, Brain, Bell, ListChecks,
  ChevronDown, ChevronUp, Check, X, Clock, Loader2
} from 'lucide-react'
import { API_ENDPOINTS, apiRequest } from '../services/api'
import './SessionDetail.css'

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

export default function SessionDetail({
  session,
  onBack,
  onUpdateThought,
  onDeleteThought,
  onDeleteSession,
  onAddReminder,
  onAddActionPlan,
  onAddDistortionAnalysis
}) {
  const [expandedThought, setExpandedThought] = useState(null)
  const [editingThought, setEditingThought] = useState(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState({})
  const [activeModal, setActiveModal] = useState(null) // { type: 'distortion'|'action'|'reminder', thoughtId, data }

  const thoughts = session.thoughts || []

  const handleEditStart = (thought) => {
    setEditingThought(thought.id)
    setEditText(thought.text || thought.keyPhrase)
  }

  const handleEditSave = async (thoughtId) => {
    if (editText.trim()) {
      await onUpdateThought(session.id, thoughtId, {
        text: editText.trim(),
        keyPhrase: editText.trim().substring(0, 50)
      })
    }
    setEditingThought(null)
    setEditText('')
  }

  const handleEditCancel = () => {
    setEditingThought(null)
    setEditText('')
  }

  const handleAnalyzeDistortions = async (thought) => {
    setLoading(prev => ({ ...prev, [`distortion_${thought.id}`]: true }))
    try {
      const result = await apiRequest(API_ENDPOINTS.chatAnalyzeDistortions, {
        method: 'POST',
        body: JSON.stringify({ thought: thought.text || thought.keyPhrase })
      })
      setActiveModal({
        type: 'distortion',
        thoughtId: thought.id,
        data: result
      })
    } catch (error) {
      console.error('Distortion analysis error:', error)
    } finally {
      setLoading(prev => ({ ...prev, [`distortion_${thought.id}`]: false }))
    }
  }

  const handleCreateActionPlan = async (thought) => {
    setLoading(prev => ({ ...prev, [`action_${thought.id}`]: true }))
    try {
      const result = await apiRequest(API_ENDPOINTS.chatActionPlan, {
        method: 'POST',
        body: JSON.stringify({ thought: thought.text || thought.keyPhrase })
      })
      setActiveModal({
        type: 'action',
        thoughtId: thought.id,
        data: result
      })
    } catch (error) {
      console.error('Action plan error:', error)
    } finally {
      setLoading(prev => ({ ...prev, [`action_${thought.id}`]: false }))
    }
  }

  const handleCreateReminder = async (thought) => {
    setLoading(prev => ({ ...prev, [`reminder_${thought.id}`]: true }))
    try {
      const result = await apiRequest(API_ENDPOINTS.chatReminder, {
        method: 'POST',
        body: JSON.stringify({ thought: thought.text || thought.keyPhrase })
      })
      setActiveModal({
        type: 'reminder',
        thoughtId: thought.id,
        data: result
      })
    } catch (error) {
      console.error('Reminder error:', error)
    } finally {
      setLoading(prev => ({ ...prev, [`reminder_${thought.id}`]: false }))
    }
  }

  const handleSaveDistortionAnalysis = () => {
    if (activeModal?.type === 'distortion') {
      onAddDistortionAnalysis(session.id, activeModal.thoughtId, activeModal.data)
    }
    setActiveModal(null)
  }

  const handleSaveActionPlan = () => {
    if (activeModal?.type === 'action') {
      onAddActionPlan(session.id, activeModal.thoughtId, activeModal.data)
    }
    setActiveModal(null)
  }

  const handleSaveReminder = () => {
    if (activeModal?.type === 'reminder') {
      onAddReminder(session.id, activeModal.thoughtId, activeModal.data)
    }
    setActiveModal(null)
  }

  return (
    <div className="session-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-outline back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="header-info">
          <span className="session-date-full">
            {new Date(session.ended_at || session.started_at).toLocaleDateString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
          <span className="session-time-full">
            {new Date(session.started_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
            {session.duration && ` · ${Math.floor(session.duration / 60)}m ${session.duration % 60}s`}
          </span>
        </div>
        <button className="btn btn-danger delete-session-btn" onClick={() => onDeleteSession(session.id)}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Session Tags */}
      <div className="detail-tags">
        {(session.themes || []).map(theme => (
          <span
            key={theme}
            className="theme-badge"
            style={{ backgroundColor: THEME_COLORS[theme] || THEME_COLORS.other }}
          >
            {theme}
          </span>
        ))}
        {(session.emotions || []).map(emotion => (
          <span
            key={emotion}
            className="emotion-badge"
            style={{ backgroundColor: EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral }}
          >
            {emotion}
          </span>
        ))}
      </div>

      {/* Thoughts List */}
      <div className="thoughts-list">
        <h3>{thoughts.length} Thought{thoughts.length !== 1 ? 's' : ''}</h3>

        {thoughts.map((thought) => (
          <div key={thought.id} className="thought-detail-card">
            {/* Thought Header */}
            <div className="thought-detail-header">
              <div className="thought-mini-tags">
                {thought.themes?.slice(0, 2).map(t => (
                  <span key={t} className="mini-tag theme" style={{ backgroundColor: THEME_COLORS[t] }}>{t}</span>
                ))}
                {thought.emotions?.slice(0, 2).map(e => (
                  <span key={e} className="mini-tag emotion" style={{ backgroundColor: EMOTION_COLORS[e] }}>{e}</span>
                ))}
              </div>
              <span className="thought-timestamp">
                {new Date(thought.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Thought Content */}
            <div className="thought-content">
              {editingThought === thought.id ? (
                <div className="edit-thought">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleEditSave(thought.id)}>
                      <Check size={14} /> Save
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={handleEditCancel}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="thought-full-text">{thought.text || thought.keyPhrase}</p>

                  {/* Expand/Collapse for analysis results */}
                  {(thought.distortionAnalysis || thought.actionPlan || thought.reminders?.length > 0) && (
                    <button
                      className="expand-btn"
                      onClick={() => setExpandedThought(expandedThought === thought.id ? null : thought.id)}
                    >
                      {expandedThought === thought.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {expandedThought === thought.id ? 'Hide details' : 'Show details'}
                    </button>
                  )}

                  {/* Expanded Analysis Results */}
                  {expandedThought === thought.id && (
                    <div className="thought-analysis-results">
                      {thought.distortionAnalysis && (
                        <div className="analysis-section distortion-section">
                          <h4><Brain size={14} /> Cognitive Distortions</h4>
                          {thought.distortionAnalysis.distortions?.map((d, i) => (
                            <div key={i} className="distortion-item">
                              <span className="distortion-type">{d.type}</span>
                              <p className="distortion-explanation">{d.explanation}</p>
                              <p className="distortion-reframe"><strong>Reframe:</strong> {d.reframe}</p>
                            </div>
                          ))}
                          {thought.distortionAnalysis.balanced_thought && (
                            <p className="balanced-thought">
                              <strong>Balanced thought:</strong> {thought.distortionAnalysis.balanced_thought}
                            </p>
                          )}
                        </div>
                      )}

                      {thought.actionPlan && (
                        <div className="analysis-section action-section">
                          <h4><ListChecks size={14} /> Action Plan</h4>
                          <p className="action-goal"><strong>Goal:</strong> {thought.actionPlan.goal}</p>
                          <ul className="action-steps">
                            {thought.actionPlan.steps?.map((step, i) => (
                              <li key={i}>
                                <span className="step-action">{step.action}</span>
                                <span className="step-meta">{step.timeframe} · {step.difficulty}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="first-step"><strong>Start now:</strong> {thought.actionPlan.first_step}</p>
                        </div>
                      )}

                      {thought.reminders?.length > 0 && (
                        <div className="analysis-section reminder-section">
                          <h4><Bell size={14} /> Reminders</h4>
                          {thought.reminders.map((r, i) => (
                            <div key={i} className="reminder-item">
                              <p>{r.reminder_text}</p>
                              <span className="reminder-time"><Clock size={12} /> {r.suggested_time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Thought Actions */}
            {editingThought !== thought.id && (
              <div className="thought-actions">
                <button
                  className="action-btn"
                  onClick={() => handleEditStart(thought)}
                  title="Edit thought"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleAnalyzeDistortions(thought)}
                  disabled={loading[`distortion_${thought.id}`]}
                  title="Analyze cognitive distortions"
                >
                  {loading[`distortion_${thought.id}`] ? <Loader2 size={16} className="spin" /> : <Brain size={16} />}
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleCreateActionPlan(thought)}
                  disabled={loading[`action_${thought.id}`]}
                  title="Create action plan"
                >
                  {loading[`action_${thought.id}`] ? <Loader2 size={16} className="spin" /> : <ListChecks size={16} />}
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleCreateReminder(thought)}
                  disabled={loading[`reminder_${thought.id}`]}
                  title="Create reminder"
                >
                  {loading[`reminder_${thought.id}`] ? <Loader2 size={16} className="spin" /> : <Bell size={16} />}
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => onDeleteThought(session.id, thought.id)}
                  title="Delete thought"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Analysis Results */}
      {activeModal && (
        <div className="analysis-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            {activeModal.type === 'distortion' && (
              <>
                <div className="modal-header">
                  <Brain size={20} />
                  <h3>Cognitive Distortions</h3>
                </div>
                <div className="modal-content">
                  {activeModal.data.distortions?.map((d, i) => (
                    <div key={i} className="distortion-card">
                      <span className="distortion-type-badge">{d.type}</span>
                      <p className="distortion-explanation">{d.explanation}</p>
                      <div className="reframe-box">
                        <strong>Reframe:</strong> {d.reframe}
                      </div>
                    </div>
                  ))}
                  {activeModal.data.balanced_thought && (
                    <div className="balanced-thought-box">
                      <strong>Balanced Thought:</strong>
                      <p>{activeModal.data.balanced_thought}</p>
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleSaveDistortionAnalysis}>
                    Save Analysis
                  </button>
                  <button className="btn btn-outline" onClick={() => setActiveModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {activeModal.type === 'action' && (
              <>
                <div className="modal-header">
                  <ListChecks size={20} />
                  <h3>Action Plan</h3>
                </div>
                <div className="modal-content">
                  <div className="goal-box">
                    <strong>Goal:</strong>
                    <p>{activeModal.data.goal}</p>
                  </div>
                  <h4>Steps:</h4>
                  <ul className="action-steps-list">
                    {activeModal.data.steps?.map((step, i) => (
                      <li key={i} className="action-step-item">
                        <div className="step-number">{i + 1}</div>
                        <div className="step-content">
                          <p>{step.action}</p>
                          <div className="step-badges">
                            <span className="time-badge">{step.timeframe}</span>
                            <span className={`difficulty-badge ${step.difficulty}`}>{step.difficulty}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="first-step-box">
                    <strong>Start Now:</strong>
                    <p>{activeModal.data.first_step}</p>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleSaveActionPlan}>
                    Save Plan
                  </button>
                  <button className="btn btn-outline" onClick={() => setActiveModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {activeModal.type === 'reminder' && (
              <>
                <div className="modal-header">
                  <Bell size={20} />
                  <h3>Reminder</h3>
                </div>
                <div className="modal-content">
                  <div className="reminder-preview">
                    <p className="reminder-text">{activeModal.data.reminder_text}</p>
                    <div className="reminder-meta">
                      <Clock size={14} />
                      <span>{activeModal.data.suggested_time}</span>
                      <span className="category-badge">{activeModal.data.category}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleSaveReminder}>
                    Save Reminder
                  </button>
                  <button className="btn btn-outline" onClick={() => setActiveModal(null)}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
